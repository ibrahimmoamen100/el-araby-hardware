import { useState, useEffect, useMemo, useCallback } from "react";
import { useStore } from "@/store/useStore";
import { Product, ProductSize, ProductAddon } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
// import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  DollarSign,
  Package,
  Receipt,
  ArrowLeft,
  Save,
  RotateCcw,
  Settings,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { salesService, CashierSale, updateProductQuantitiesAtomically } from "@/lib/firebase";
import { formatCurrency } from "@/utils/format";

interface CartItem {
  product: {
    id: string;
    name: string;
    price: number;
    images?: string[];
    wholesaleInfo?: {
      purchasePrice: number;
      quantity: number;
    };
  };
  quantity: number;
  selectedSize?: {
    id: string;
    label: string;
    price: number;
  };
  selectedAddons: {
    id: string;
    label: string;
    price_delta: number;
  }[];
  unitFinalPrice: number;
  totalPrice: number;
}

interface Sale {
  id: string;
  items: CartItem[];
  totalAmount: number;
  timestamp: Date;
  customerName?: string;
}

export default function Cashier() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { products, updateProduct, loadProducts, removeFromCart: storeRemoveFromCart, updateProductQuantity } = useStore();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  // Product options selection state
  const [selectedProductForOptions, setSelectedProductForOptions] = useState<Product | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [optionsDialogOpen, setOptionsDialogOpen] = useState(false);
  
  // Add loading state to prevent multiple rapid clicks
  const [loadingProducts, setLoadingProducts] = useState<Set<string>>(new Set());

  // Check and archive expired products
  const checkAndArchiveExpiredProducts = useCallback(async () => {
    if (!products) return;
    
    const currentDate = new Date();
    const expiredProducts = products.filter(product => 
      product.specialOffer && 
      product.offerEndsAt && 
      new Date(product.offerEndsAt) <= currentDate &&
      !product.isArchived
    );

    if (expiredProducts.length > 0) {
      console.log(`Found ${expiredProducts.length} expired products, archiving them...`);
      
      try {
        for (const product of expiredProducts) {
          await updateProduct({ ...product, isArchived: true });
          console.log(`Archived expired product: ${product.name}`);
        }
        
        // Reload products to reflect changes
        await loadProducts();
        console.log('Products reloaded after archiving expired products');
        
      } catch (error) {
        console.error('Error archiving expired products:', error);
      }
    }
  }, [products, updateProduct, loadProducts]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(products?.map(p => p.category).filter(Boolean) || []);
    return Array.from(cats) as string[];
  }, [products]);

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    return products?.filter(product => {
      // Check if product is archived
      if (product.isArchived) return false;
      
      // Check if product has expired special offer
      if (product.specialOffer && product.offerEndsAt) {
        const offerEndDate = new Date(product.offerEndsAt);
        const currentDate = new Date();
        if (offerEndDate <= currentDate) {
          // Product offer has expired, don't show it
          return false;
        }
      }
      
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.brand.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    }) || [];
  }, [products, searchQuery, selectedCategory]);

  // Calculate final price for a product with options
  const calculateFinalPrice = (product: Product, sizeId: string | null, addonIds: string[]) => {
    let finalPrice = product.price; // Base price

    // If sizes are available and one is selected, use that price instead of base price
    if (product.sizes && product.sizes.length > 0 && sizeId) {
      const selectedSize = product.sizes.find(size => size.id === sizeId);
      if (selectedSize) {
        finalPrice = selectedSize.price;
      }
    }

    // Add addon prices
    if (product.addons && addonIds.length > 0) {
      const selectedAddons = product.addons.filter(addon => addonIds.includes(addon.id));
      selectedAddons.forEach(addon => {
        finalPrice += addon.price_delta;
      });
    }

    // Apply special offer discount if available
    if (product.specialOffer && 
        product.offerEndsAt &&
        new Date(product.offerEndsAt) > new Date()) {
      if (product.discountPrice) {
        // Use the discount price as recorded in admin
        finalPrice = product.discountPrice;
      } else if (product.discountPercentage) {
        // Calculate discount if discountPrice is not available
        const discountAmount = (finalPrice * product.discountPercentage) / 100;
        finalPrice = finalPrice - discountAmount;
      }
    }

    return finalPrice;
  };

  // Calculate cart totals
  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = 0; // No tax applied
    const total = subtotal; // Total equals subtotal without tax
    return { subtotal, tax, total };
  }, [cart]);

  // Add product to cart
  const addToCart = async (product: Product) => {
    // Prevent multiple rapid clicks on the same product
    if (loadingProducts.has(product.id)) {
      console.log(`Product ${product.name} is already being processed, ignoring click`);
      return;
    }

    try {
      // Add product to loading set to prevent multiple clicks
      setLoadingProducts(prev => new Set(prev).add(product.id));
      
      // Get the latest product data from store
      const latestProduct = products?.find(p => p.id === product.id);
      if (!latestProduct) {
        toast.error("المنتج غير موجود");
        return;
      }

      const availableQuantity = latestProduct.wholesaleInfo?.quantity || 0;
      if (availableQuantity <= 0) {
        toast.error("لا يوجد مخزون متاح لهذا المنتج");
        return;
      }

      // Check if product has sizes or addons
      const hasSizes = latestProduct.sizes && latestProduct.sizes.length > 0;
      const hasAddons = latestProduct.addons && latestProduct.addons.length > 0;

      if (hasSizes || hasAddons) {
        // Open options dialog for products with sizes/addons
        setSelectedProductForOptions(latestProduct);
        setSelectedSizeId(hasSizes ? latestProduct.sizes![0].id : null);
        setSelectedAddonIds([]);
        setOptionsDialogOpen(true);
        return;
      }

      // For products without options, add directly
      await addProductToCartWithOptions(latestProduct, null, [], 1);
      
    } catch (error) {
      console.error('Error adding product to cart:', error);
      toast.error("خطأ في إضافة المنتج", {
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
      });
    } finally {
      // Remove product from loading set after processing
      setLoadingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
    }
  };

  // Helper function to convert Product to CartItem product format
  const convertProductToCartFormat = (product: Product) => ({
    id: product.id || '',
    name: product.name || '',
    price: product.price || 0,
    images: product.images || [],
    wholesaleInfo: product.wholesaleInfo ? {
      purchasePrice: product.wholesaleInfo.purchasePrice || 0,
      quantity: product.wholesaleInfo.quantity || 0
    } : undefined
  });

  // Helper function to convert ProductSize to CartItem size format
  const convertSizeToCartFormat = (size: ProductSize | null) => {
    if (!size) return undefined;
    return {
      id: size.id || '',
      label: size.label || '',
      price: size.price || 0
    };
  };

  // Helper function to convert ProductAddon to CartItem addon format
  const convertAddonsToCartFormat = (addons: ProductAddon[]) => {
    return addons.map(addon => ({
      id: addon.id || '',
      label: addon.label || '',
      price_delta: addon.price_delta || 0
    }));
  };

  // Add product to cart with selected options
  const addProductToCartWithOptions = async (
    product: Product, 
    selectedSize: ProductSize | null, 
    selectedAddons: ProductAddon[], 
    quantity: number = 1
  ) => {
    // Prevent multiple rapid calls for the same product
    if (loadingProducts.has(product.id || '')) {
      console.log(`Product ${product.name} is already being processed, ignoring add request`);
      return;
    }

    try {
      // Add product to loading set to prevent multiple calls
      setLoadingProducts(prev => new Set(prev).add(product.id || ''));
      
      const availableQuantity = product.wholesaleInfo?.quantity || 0;
      if (availableQuantity < quantity) {
        toast.error(`لا يوجد مخزون كافي. المتوفر: ${availableQuantity}`);
        return;
      }

      // Calculate final price
      const unitFinalPrice = calculateFinalPrice(
        product, 
        selectedSize?.id || null, 
        selectedAddons.map(addon => addon.id)
      );

      // Check if item with same options already exists in cart
      const existingItem = cart.find(item => 
        item.product.id === product.id && 
        item.selectedSize?.id === selectedSize?.id &&
        JSON.stringify(item.selectedAddons.map(a => a.id).sort()) === 
        JSON.stringify(selectedAddons.map(a => a.id).sort())
      );

      if (existingItem) {
        // Update existing item quantity
        await updateCartQuantityWithOptions(
          product.id || '', 
          existingItem.quantity + quantity,
          selectedSize,
          selectedAddons
        );
      } else {
        // Add new item to cart
        const newCartItem: CartItem = {
          product: convertProductToCartFormat(product),
          quantity,
          selectedSize: convertSizeToCartFormat(selectedSize),
          selectedAddons: convertAddonsToCartFormat(selectedAddons),
          unitFinalPrice,
          totalPrice: unitFinalPrice * quantity
        };

        setCart(prev => [...prev, newCartItem]);

        // Update product quantity in store
        const newQuantity = availableQuantity - quantity;
        await updateProductQuantity(product.id || '', newQuantity);
        await loadProducts();
      }

      toast.success("تم إضافة المنتج إلى السلة");
      
    } catch (error) {
      console.error('Error adding product to cart with options:', error);
      toast.error("خطأ في إضافة المنتج", {
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
      });
    } finally {
      // Remove product from loading set after processing
      setLoadingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(product.id || '');
        return newSet;
      });
    }
  };

  // Update cart item quantity (for backward compatibility)
  const updateCartQuantity = async (productId: string, newQuantity: number) => {
    const item = cart.find(item => item.product.id === productId);
    if (!item) return;

    await updateCartQuantityWithOptions(
      productId, 
      newQuantity, 
      item.selectedSize, 
      item.selectedAddons
    );
  };

  // Update cart item quantity with options
  const updateCartQuantityWithOptions = async (
    productId: string, 
    newQuantity: number, 
    selectedSize: ProductSize | null, 
    selectedAddons: ProductAddon[]
  ) => {
    // Prevent multiple rapid calls for the same product
    if (loadingProducts.has(productId)) {
      console.log(`Product ${productId} is already being processed, ignoring update request`);
      return;
    }

    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const item = cart.find(item => 
      item.product.id === productId && 
      item.selectedSize?.id === selectedSize?.id &&
      JSON.stringify(item.selectedAddons.map(a => a.id).sort()) === 
      JSON.stringify(selectedAddons.map(a => a.id).sort())
    );
    
    if (!item) return;

    try {
      // Add product to loading set to prevent multiple calls
      setLoadingProducts(prev => new Set(prev).add(productId));
      
      // Get the latest product data from store
      const latestProduct = products?.find(p => p.id === productId);
      if (!latestProduct) {
        toast.error("المنتج غير موجود");
        return;
      }

      const currentStoreQuantity = latestProduct.wholesaleInfo?.quantity || 0;
      const currentCartQuantity = item.quantity;
      const quantityDifference = newQuantity - currentCartQuantity;
      
      console.log(`Cashier updateCartQuantity: Product ${latestProduct.name}`);
      console.log(`- Current store quantity: ${currentStoreQuantity}`);
      console.log(`- Current cart quantity: ${currentCartQuantity}`);
      console.log(`- New cart quantity: ${newQuantity}`);
      console.log(`- Quantity difference: ${quantityDifference}`);

      // Check if we're increasing quantity (taking more from store)
      if (quantityDifference > 0) {
        if (currentStoreQuantity < quantityDifference) {
          toast.error(`لا يوجد مخزون كافي. المتوفر: ${currentStoreQuantity}`);
          return;
        }
        
        // Deduct the additional quantity from store
        const newStoreQuantity = currentStoreQuantity - quantityDifference;
        console.log(`- Taking ${quantityDifference} more from store. New store quantity: ${newStoreQuantity}`);
        await updateProductQuantity(productId, newStoreQuantity);
        await loadProducts();
        
      } else if (quantityDifference < 0) {
        // We're decreasing quantity (returning some to store)
        const quantityToReturn = Math.abs(quantityDifference);
        const newStoreQuantity = currentStoreQuantity + quantityToReturn;
        console.log(`- Returning ${quantityToReturn} to store. New store quantity: ${newStoreQuantity}`);
        await updateProductQuantity(productId, newStoreQuantity);
        await loadProducts();
      }

      // Calculate new unit price and total
      const unitFinalPrice = calculateFinalPrice(
        latestProduct, 
        selectedSize?.id || null, 
        selectedAddons.map(addon => addon.id)
      );

      // Update local cart with converted types
      setCart(prev => prev.map(cartItem =>
        cartItem.product.id === productId && 
        cartItem.selectedSize?.id === selectedSize?.id &&
        JSON.stringify(cartItem.selectedAddons.map(a => a.id).sort()) === 
        JSON.stringify(selectedAddons.map(a => a.id).sort())
          ? { 
              ...cartItem, 
              quantity: newQuantity, 
              unitFinalPrice,
              totalPrice: unitFinalPrice * newQuantity 
            }
          : cartItem
      ));

      console.log(`Cashier: Successfully updated cart quantity for ${latestProduct.name}`);
      
    } catch (error) {
      console.error('Error updating cart quantity:', error);
      toast.error("خطأ في تحديث الكمية", {
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
      });
    } finally {
      // Remove product from loading set after processing
      setLoadingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  // Remove item from cart
  const removeFromCart = async (productId: string, selectedSize?: ProductSize, selectedAddons: ProductAddon[] = []) => {
    // Prevent multiple rapid calls for the same product
    if (loadingProducts.has(productId)) {
      console.log(`Product ${productId} is already being processed, ignoring remove request`);
      return;
    }

    const item = cart.find(item => 
      item.product.id === productId && 
      item.selectedSize?.id === selectedSize?.id &&
      JSON.stringify(item.selectedAddons.map(a => a.id).sort()) === 
      JSON.stringify(selectedAddons.map(a => a.id).sort())
    );
    
    if (!item) return;

    try {
      // Add product to loading set to prevent multiple calls
      setLoadingProducts(prev => new Set(prev).add(productId));
      
      // Get the latest product data from store
      const latestProduct = products?.find(p => p.id === productId);
      if (!latestProduct) {
        toast.error("المنتج غير موجود");
        return;
      }

      const currentStoreQuantity = latestProduct.wholesaleInfo?.quantity || 0;
      const cartQuantity = item.quantity;
      
      console.log(`Cashier removeFromCart: Product ${latestProduct.name}`);
      console.log(`- Current store quantity: ${currentStoreQuantity}`);
      console.log(`- Cart quantity to restore: ${cartQuantity}`);

      // Remove from local cart first
      setCart(prev => prev.filter(cartItem => 
        !(cartItem.product.id === productId && 
          cartItem.selectedSize?.id === selectedSize?.id &&
          JSON.stringify(cartItem.selectedAddons.map(a => a.id).sort()) === 
          JSON.stringify(selectedAddons.map(a => a.id).sort()))
      ));

      // Restore the full cart quantity to store
      const newStoreQuantity = currentStoreQuantity + cartQuantity;
      console.log(`- Restoring ${cartQuantity} to store. New store quantity: ${newStoreQuantity}`);
      await updateProductQuantity(productId, newStoreQuantity);
      await loadProducts();
      
      console.log(`Cashier: Successfully removed ${latestProduct.name} from cart`);
      
    } catch (error) {
      console.error('Error removing product from cart:', error);
      toast.error("خطأ في إزالة المنتج", {
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
      });
    } finally {
      // Remove product from loading set after processing
      setLoadingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  // Handle product options selection
  const handleSizeChange = (sizeId: string) => {
    setSelectedSizeId(sizeId);
  };

  const handleAddonToggle = (addonId: string, checked: boolean) => {
    if (checked) {
      setSelectedAddonIds(prev => [...prev, addonId]);
    } else {
      setSelectedAddonIds(prev => prev.filter(id => id !== addonId));
    }
  };

  const handleConfirmOptions = async () => {
    if (!selectedProductForOptions) return;

    const selectedSize = selectedSizeId && selectedProductForOptions.sizes 
      ? selectedProductForOptions.sizes.find(size => size.id === selectedSizeId) || null
      : null;
    
    const selectedAddons = selectedProductForOptions.addons 
      ? selectedProductForOptions.addons.filter(addon => selectedAddonIds.includes(addon.id))
      : [];

    await addProductToCartWithOptions(selectedProductForOptions, selectedSize, selectedAddons, 1);
    
    // Reset options dialog
    setOptionsDialogOpen(false);
    setSelectedProductForOptions(null);
    setSelectedSizeId(null);
    setSelectedAddonIds([]);
  };

  const handleCancelOptions = () => {
    setOptionsDialogOpen(false);
    setSelectedProductForOptions(null);
    setSelectedSizeId(null);
    setSelectedAddonIds([]);
  };

  // Complete sale
  const completeSale = async () => {
    if (cart.length === 0) {
      toast.error("السلة فارغة");
      return;
    }

    // Check if user is authenticated (optional check)
    try {
      // This is a basic check - you might want to add more robust authentication
      const currentUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (!currentUser) {
        console.warn('No user session found, proceeding with sale anyway');
      }
    } catch (error) {
      console.warn('Error checking user session:', error);
    }

    try {
      // Add all products to loading set to prevent interactions during sale completion
      const productIds = cart.map(item => item.product.id);
      setLoadingProducts(prev => new Set([...prev, ...productIds]));
      
      // Validate cart data before creating sale
      if (!cart || cart.length === 0) {
        throw new Error("السلة فارغة");
      }
      
      // Validate each cart item
      for (const item of cart) {
        if (!item.product || !item.product.id || !item.product.name) {
          throw new Error("بيانات المنتج غير صحيحة");
        }
        if (item.quantity <= 0) {
          throw new Error("كمية المنتج يجب أن تكون أكبر من صفر");
        }
        if (item.unitFinalPrice <= 0) {
          throw new Error("سعر المنتج غير صحيح");
        }
      }
      
      // Create sale record (quantities already deducted when adding to cart)
      const newSale: Omit<CashierSale, 'id'> = {
        items: cart.map(item => ({
          product: {
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            images: item.product.images || [],
            wholesaleInfo: item.product.wholesaleInfo ? {
              purchasePrice: item.product.wholesaleInfo.purchasePrice || 0,
              quantity: item.product.wholesaleInfo.quantity || 0
            } : undefined
          },
          quantity: item.quantity,
          selectedSize: item.selectedSize ? {
            id: item.selectedSize.id,
            label: item.selectedSize.label,
            price: item.selectedSize.price
          } : undefined,
          selectedAddons: (item.selectedAddons || []).map(addon => ({
            id: addon.id,
            label: addon.label,
            price_delta: addon.price_delta
          })),
          unitFinalPrice: item.unitFinalPrice,
          totalPrice: item.totalPrice
        })),
        totalAmount: cartTotals.total,
        timestamp: new Date(),
        customerName: customerName || null
      };

      // Save to Firebase first
      console.log('Cashier: Saving sale to Firebase...');
      console.log('Cashier: Sale data:', newSale);
      
      if (!salesService || typeof salesService.addSale !== 'function') {
        throw new Error("خدمة المبيعات غير متاحة");
      }
      
      let savedSale;
      try {
        savedSale = await salesService.addSale(newSale);
        console.log('Cashier: Sale saved to Firebase with ID:', savedSale.id);
      } catch (firebaseError) {
        console.error('Firebase save failed, saving to localStorage as backup:', firebaseError);
        
        // Create a temporary sale with local ID for backup
        const tempSale: CashierSale = {
          ...newSale,
          id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        // Save to localStorage as backup
        const existingSales = localStorage.getItem("cashier-sales");
        const salesArray = existingSales ? JSON.parse(existingSales) : [];
        salesArray.unshift(tempSale);
        localStorage.setItem("cashier-sales", JSON.stringify(salesArray));
        
        savedSale = tempSale;
        console.log('Cashier: Sale saved to localStorage as backup with ID:', savedSale.id);
        
        // Show warning to user
        toast.warning("تم حفظ عملية البيع محلياً - سيتم مزامنتها لاحقاً", {
          description: "حدث خطأ في الاتصال بالسيرفر",
          duration: 3000,
        });
      }

      // Update sales state and save to localStorage
      setSales(prev => {
        const updatedSales = [savedSale, ...prev];
        // Save immediately to localStorage as backup
        try {
          localStorage.setItem("cashier-sales", JSON.stringify(updatedSales));
          console.log('Cashier: Sale saved to localStorage as backup');
        } catch (error) {
          console.error('Error saving sale to localStorage:', error);
        }
        return updatedSales;
      });
      
      // Clear cart and customer name
      setCart([]);
      setCustomerName("");
      
      // Reload products to ensure we have the latest data
      console.log('Cashier: Reloading products after sale completion...');
      await loadProducts();
      console.log('Cashier: Products reloaded successfully');
      
      toast.success("تم إتمام عملية البيع بنجاح");
    } catch (error) {
      console.error('Error completing sale:', error);
      
      // Provide more specific error messages
      let errorMessage = "حدث خطأ أثناء إتمام عملية البيع";
      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          errorMessage = "خطأ في الصلاحيات - تأكد من تسجيل الدخول";
        } else if (error.message.includes('network')) {
          errorMessage = "خطأ في الاتصال - تحقق من الإنترنت";
        } else if (error.message.includes('quota-exceeded')) {
          errorMessage = "تم تجاوز الحد المسموح - حاول مرة أخرى لاحقاً";
        } else {
          errorMessage = `خطأ: ${error.message}`;
        }
      }
      
      toast.error(errorMessage, {
        description: "يرجى المحاولة مرة أخرى أو الاتصال بالدعم الفني",
        duration: 5000,
      });
    } finally {
      // Clear all products from loading set after processing
      setLoadingProducts(new Set());
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (cart.length === 0) return;
    
    try {
      console.log('Cashier: Clearing cart and restoring quantities...');
      
      // Add all products to loading set to prevent interactions during clear
      const productIds = cart.map(item => item.product.id);
      setLoadingProducts(prev => new Set([...prev, ...productIds]));
      
      // Restore all quantities to store using proper logic
      for (const item of cart) {
        // Get the latest product data from store
        const latestProduct = products?.find(p => p.id === item.product.id);
        if (!latestProduct) {
          console.warn(`Product ${item.product.id} not found in store during clear`);
          continue;
        }

        const currentStoreQuantity = latestProduct.wholesaleInfo?.quantity || 0;
        const cartQuantity = item.quantity;
        const newStoreQuantity = currentStoreQuantity + cartQuantity;
        
        console.log(`Clearing ${item.product.name}: returning ${cartQuantity} to store (${currentStoreQuantity} -> ${newStoreQuantity})`);
        await updateProductQuantity(item.product.id, newStoreQuantity);
      }
      
      // Reload products to ensure we have latest data
      await loadProducts();
      
      setCart([]);
      setCustomerName("");
      
      console.log('Cashier: Cart cleared successfully');
      toast.success("تم مسح السلة واستعادة الكميات");
      
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error("خطأ في مسح السلة", {
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
      });
    } finally {
      // Clear all products from loading set after processing
      setLoadingProducts(new Set());
    }
  };

  // Check and archive expired products on mount and when products change
  useEffect(() => {
    checkAndArchiveExpiredProducts();
  }, [checkAndArchiveExpiredProducts]);

  // Load sales from Firebase and localStorage on mount
  useEffect(() => {
    const loadSales = async () => {
      try {
        console.log('Cashier: Loading sales from Firebase...');
        const firebaseSales = await salesService.getAllSales();
        console.log('Cashier: Firebase sales loaded:', firebaseSales.length);
        
        // Also load from localStorage as backup
        const savedSales = localStorage.getItem("cashier-sales");
        let localStorageSales: CashierSale[] = [];
        
        if (savedSales) {
          try {
            const parsedSales = JSON.parse(savedSales);
            localStorageSales = parsedSales.map((sale: any) => ({
              ...sale,
              timestamp: new Date(sale.timestamp)
            }));
            console.log('Cashier: LocalStorage sales loaded:', localStorageSales.length);
          } catch (error) {
            console.error("Error parsing localStorage sales:", error);
            localStorage.removeItem("cashier-sales");
          }
        }
        
        // Merge Firebase and localStorage sales, prioritizing Firebase
        const mergedSales = [...firebaseSales];
        
        // Add localStorage sales that don't exist in Firebase
        localStorageSales.forEach(localSale => {
          const existsInFirebase = firebaseSales.some(firebaseSale => 
            firebaseSale.id === localSale.id || 
            (firebaseSale.timestamp.getTime() === localSale.timestamp.getTime() && 
             firebaseSale.totalAmount === localSale.totalAmount)
          );
          
          if (!existsInFirebase) {
            console.log('Cashier: Adding localStorage sale to Firebase:', localSale);
            mergedSales.push(localSale);
          }
        });
        
        setSales(mergedSales);
        console.log('Cashier: Total sales loaded:', mergedSales.length);
        
        // Update localStorage with merged data
        localStorage.setItem("cashier-sales", JSON.stringify(mergedSales));
        
      } catch (error) {
        console.error("Error loading sales from Firebase:", error);
        
        // Fallback to localStorage only
        try {
          const savedSales = localStorage.getItem("cashier-sales");
          if (savedSales) {
            const parsedSales = JSON.parse(savedSales);
            const salesWithDates = parsedSales.map((sale: any) => ({
              ...sale,
              timestamp: new Date(sale.timestamp)
            }));
            setSales(salesWithDates);
            console.log('Cashier: Fallback to localStorage sales:', salesWithDates.length);
          } else {
            setSales([]);
          }
        } catch (localError) {
          console.error("Error loading sales from localStorage:", localError);
          localStorage.removeItem("cashier-sales");
          setSales([]);
        }
      }
    };

    loadSales();
  }, []);

  // Save sales to localStorage whenever sales change
  useEffect(() => {
    const saveSalesToStorage = () => {
      try {
        console.log('Cashier: Saving sales to localStorage, count:', sales.length);
        localStorage.setItem("cashier-sales", JSON.stringify(sales));
        console.log('Cashier: Sales saved successfully');
      } catch (error) {
        console.error("Error saving sales to localStorage:", error);
        toast.error("حدث خطأ في حفظ عمليات البيع");
      }
    };

    // Always save, even if sales array is empty (to clear localStorage when needed)
    saveSalesToStorage();
  }, [sales]);

  // Manual save function
  const saveSalesManually = async () => {
    try {
      // Save to localStorage
      localStorage.setItem("cashier-sales", JSON.stringify(sales));
      
      // Also save any unsaved sales to Firebase
      const unsavedSales = sales.filter(sale => !sale.id.startsWith('firebase_'));
      if (unsavedSales.length > 0) {
        console.log('Cashier: Saving unsaved sales to Firebase:', unsavedSales.length);
        for (const sale of unsavedSales) {
          await salesService.addSale(sale);
        }
      }
      
      toast.success("تم حفظ عمليات البيع بنجاح");
      console.log('Cashier: Manual save completed, sales count:', sales.length);
    } catch (error) {
      console.error("Error in manual save:", error);
      toast.error("حدث خطأ في حفظ عمليات البيع");
    }
  };

  // Confirm and delete sale
  const confirmDeleteSale = (saleId: string) => {
    const saleToDelete = sales.find(sale => sale.id === saleId);
    if (!saleToDelete) {
      toast.error("عملية البيع غير موجودة");
      return;
    }

    const totalItems = saleToDelete.items.reduce((sum, item) => sum + item.quantity, 0);
    const confirmMessage = `هل أنت متأكد من حذف عملية البيع هذه؟
    
العميل: ${saleToDelete.customerName || "عميل بدون اسم"}
عدد المنتجات: ${totalItems} منتج
المجموع: ${saleToDelete.totalAmount.toLocaleString()} ج.م

سيتم استرجاع جميع الكميات للمخزون.`;

    if (window.confirm(confirmMessage)) {
      deleteSale(saleId);
    }
  };

  // Delete sale and restore quantities
  const deleteSale = async (saleId: string) => {
    try {
      // Find the sale to delete
      const saleToDelete = sales.find(sale => sale.id === saleId);
      if (!saleToDelete) {
        toast.error("عملية البيع غير موجودة");
        return;
      }

      // Add all products to loading set to prevent interactions during deletion
      const productIds = saleToDelete.items.map(item => item.product.id);
      setLoadingProducts(prev => new Set([...prev, ...productIds]));

      console.log('Cashier: Deleting sale and restoring quantities...');
      console.log('Sale to delete:', saleToDelete);

      // Restore quantities for all products in the sale
      for (const item of saleToDelete.items) {
        // Get the latest product data from store
        const latestProduct = products?.find(p => p.id === item.product.id);
        if (!latestProduct) {
          console.warn(`Product ${item.product.id} not found in store during sale deletion`);
          continue;
        }

        const currentStoreQuantity = latestProduct.wholesaleInfo?.quantity || 0;
        const quantityToRestore = item.quantity;
        const newStoreQuantity = currentStoreQuantity + quantityToRestore;
        
        console.log(`Restoring ${item.product.name}: adding ${quantityToRestore} to store (${currentStoreQuantity} -> ${newStoreQuantity})`);
        await updateProductQuantity(item.product.id, newStoreQuantity);
      }

      // Reload products to ensure we have latest data
      await loadProducts();

      // Delete from Firebase if it's a Firebase sale
      if (!saleId.startsWith('local_')) {
        try {
          await salesService.deleteSale(saleId);
          console.log('Cashier: Sale deleted from Firebase');
        } catch (firebaseError) {
          console.error('Error deleting from Firebase:', firebaseError);
          toast.warning("تم حذف عملية البيع محلياً - سيتم مزامنتها لاحقاً", {
            description: "حدث خطأ في الاتصال بالسيرفر",
            duration: 3000,
          });
        }
      }

      // Remove from local state
      setSales(prev => prev.filter(sale => sale.id !== saleId));

      // Update localStorage
      const updatedSales = sales.filter(sale => sale.id !== saleId);
      localStorage.setItem("cashier-sales", JSON.stringify(updatedSales));

      console.log('Cashier: Sale deleted successfully');
      toast.success("تم حذف عملية البيع واسترجاع الكميات بنجاح");
      
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast.error("حدث خطأ في حذف عملية البيع", {
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
      });
    } finally {
      // Clear all products from loading set after processing
      setLoadingProducts(new Set());
    }
  };

  // Save data before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        localStorage.setItem("cashier-sales", JSON.stringify(sales));
        console.log('Cashier: Data saved before page unload');
      } catch (error) {
        console.error("Error saving data before unload:", error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sales]);

  return (
    <div className="min-h-screen bg-gray-50">
        <Helmet>
          <title>نظام الكاشير</title>
          <meta name="description" content="نظام كاشير متكامل لإدارة المبيعات والمخزون" />
        </Helmet>
        
        <div className="container mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/admin")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              العودة للوحة التحكم
            </Button>
            <h1 className="text-3xl font-bold">نظام الكاشير</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              <Package className="h-3 w-3 mr-1" />
              {products?.filter(p => !p.isArchived).length || 0} منتج متاح
            </Badge>
            <Badge variant="outline" className="text-sm">
              <ShoppingCart className="h-3 w-3 mr-1" />
              {sales.length} عملية بيع
            </Badge>
            <Button
              onClick={saveSalesManually}
              variant="outline"
              size="sm"
              className="gap-2"
              title="حفظ عمليات البيع"
            >
              <Save className="h-4 w-4" />
              حفظ
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">البحث والتصفية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="البحث في المنتجات..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">جميع التصنيفات</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Products Grid */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">المنتجات المتاحة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[600px] overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         {filteredProducts.map(product => {
                       const availableQuantity = product.wholesaleInfo?.quantity || 0;
                       const isAvailable = availableQuantity > 0;
                       const inCart = cart.find(item => item.product.id === product.id);
                       
                       // Check if product has active special offer
                       const hasSpecialOffer = product.specialOffer && 
                         product.offerEndsAt && 
                         new Date(product.offerEndsAt) > new Date();
                       
                       // Calculate discounted price
                       const discountedPrice = hasSpecialOffer && product.discountPrice
                         ? product.discountPrice
                         : (hasSpecialOffer && product.discountPercentage
                             ? product.price - product.price * (product.discountPercentage / 100)
                             : null);
                       
                       return (
                         <div
                           key={product.id}
                           className={`relative p-4 border rounded-lg transition-all hover:shadow-md ${
                             !isAvailable ? 'opacity-50 bg-gray-100' : 
                             loadingProducts.has(product.id || '') ? 'opacity-75 bg-blue-50 border-blue-300' : 
                             'hover:border-blue-300 cursor-pointer'
                           } ${hasSpecialOffer ? 'border-red-200 bg-gradient-to-br from-red-50 to-pink-50 shadow-sm' : ''}`}
                           onClick={() => isAvailable && !loadingProducts.has(product.id || '') && addToCart(product)}
                         >
                           {/* Special Offer Badge */}
                           {hasSpecialOffer && (
                             <div className="absolute -top-2 -right-2 z-10">
                               <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                                 {product.discountPercentage}% خصم
                               </div>
                             </div>
                           )}
                           
                           {/* Special Offer Border Animation */}
                           {hasSpecialOffer && (
                             <div className="absolute inset-0 rounded-lg border-2 border-red-300 opacity-30 animate-pulse"></div>
                           )}
                           
                           {/* Loading Indicator */}
                           {loadingProducts.has(product.id || '') && (
                             <div className="absolute inset-0 rounded-lg bg-blue-100 bg-opacity-50 flex items-center justify-center z-20">
                               <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                             </div>
                           )}
                           
                           <div className="flex items-start gap-3 relative z-10">
                             <div className="relative">
                               <img
                                 src={product.images?.[0] || "/placeholder.svg"}
                                 alt={product.name}
                                 className={`w-16 h-16 object-cover rounded-md ${hasSpecialOffer ? 'ring-2 ring-red-200' : ''}`}
                               />
                               {hasSpecialOffer && (
                                 <div className="absolute -top-1 -left-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                   ✨
                                 </div>
                               )}
                             </div>
                             <div className="flex-1 min-w-0">
                               <div className="flex items-start justify-between">
                                 <div className="flex-1 min-w-0">
                                   <h3 className={`font-medium text-sm truncate ${hasSpecialOffer ? 'text-red-800' : ''}`}>
                                     {product.name}
                                   </h3>
                                   <p className="text-xs text-gray-500">{product.brand}</p>
                                 </div>
                                 <div className="flex items-center gap-1">
                                   {(product.sizes && product.sizes.length > 0) || (product.addons && product.addons.length > 0) ? (
                                     <Settings className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                   ) : null}
                                 </div>
                               </div>
                               <div className="flex items-center justify-between mt-2">
                                 <div className="flex flex-col">
                                   {discountedPrice !== null ? (
                                     <div className="flex items-center gap-2">
                                       <span className="font-bold text-lg text-red-600">
                                         {formatCurrency(discountedPrice, 'جنيه')}
                                       </span>
                                       <span className="text-sm text-gray-500 line-through">
                                         {formatCurrency(product.price, 'جنيه')}
                                       </span>
                                     </div>
                                   ) : (
                                     <span className="font-bold text-lg">
                                       {formatCurrency(product.price, 'جنيه')}
                                     </span>
                                   )}
                                   {hasSpecialOffer && (
                                     <div className="flex items-center gap-1 mt-1">
                                       <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                       <span className="text-xs text-red-600 font-medium">
                                         عرض خاص ينتهي {new Date(product.offerEndsAt as string).toLocaleDateString()}
                                       </span>
                                     </div>
                                   )}
                                 </div>
                                 <Badge variant={isAvailable ? "default" : "destructive"}>
                                   {isAvailable ? `${availableQuantity} متاح` : 'غير متاح'}
                                 </Badge>
                               </div>
                               {inCart && (
                                 <div className="mt-2 text-xs text-blue-600">
                                   في السلة: {inCart.quantity}
                                 </div>
                               )}
                             </div>
                           </div>
                         </div>
                       );
                     })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cart Section */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  سلة المشتريات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Customer Name */}
                <div>
                  <label className="text-sm font-medium mb-2 block">اسم العميل (اختياري)</label>
                  <Input
                    placeholder="أدخل اسم العميل..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>

                {/* Cart Items */}
                <div className="h-[300px] overflow-y-auto">
                  {cart.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>السلة فارغة</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cart.map(item => (
                        <div key={`${item.product.id}-${item.selectedSize?.id || 'no-size'}-${item.selectedAddons.map(a => a.id).sort().join('-')}`} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">{item.product.name}</h4>
                              {item.selectedSize && (
                                <p className="text-xs text-blue-600 font-medium">
                                  📐 الحجم: {item.selectedSize.label}
                                </p>
                              )}
                              {item.selectedAddons && item.selectedAddons.length > 0 && (
                                <p className="text-xs text-green-600">
                                  ➕ الإضافات: {item.selectedAddons.map(addon => addon.label).join(', ')}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.product.id, item.selectedSize, item.selectedAddons)}
                              disabled={loadingProducts.has(item.product.id)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 flex-shrink-0"
                            >
                              {loadingProducts.has(item.product.id) ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b border-red-500"></div>
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateCartQuantityWithOptions(item.product.id, item.quantity - 1, item.selectedSize, item.selectedAddons)}
                                disabled={loadingProducts.has(item.product.id)}
                                className="h-6 w-6 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateCartQuantityWithOptions(item.product.id, item.quantity + 1, item.selectedSize, item.selectedAddons)}
                                disabled={loadingProducts.has(item.product.id)}
                                className="h-6 w-6 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500">
                                {formatCurrency(item.unitFinalPrice, 'جنيه')} × {item.quantity}
                              </div>
                                                              <span className="font-bold text-sm">
                                  {formatCurrency(item.totalPrice, 'جنيه')}
                                </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cart Totals */}
                {cart.length > 0 && (
                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between font-bold text-lg">
                      <span>الإجمالي:</span>
                      <span>{cartTotals.total.toLocaleString()} ج.م</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={completeSale}
                    disabled={cart.length === 0 || loadingProducts.size > 0}
                    className="flex-1 gap-2"
                  >
                    {loadingProducts.size > 0 ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Receipt className="h-4 w-4" />
                    )}
                    {loadingProducts.size > 0 ? 'جاري الإتمام...' : 'إتمام البيع'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={clearCart}
                    disabled={cart.length === 0 || loadingProducts.size > 0}
                    className="gap-2"
                  >
                    {loadingProducts.size > 0 ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    ) : (
                      <RotateCcw className="h-4 w-4" />
                    )}
                    {loadingProducts.size > 0 ? 'جاري المسح...' : 'مسح'}
                  </Button>
                </div>
              </CardContent>
            </Card>

                         {/* Recent Sales */}
             <Card>
               <CardHeader>
                 <CardTitle className="text-lg flex items-center gap-2">
                   <DollarSign className="h-5 w-5" />
                   المبيعات الأخيرة
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="max-h-[670px] overflow-y-auto">
                   {sales.length === 0 ? (
                     <div className="text-center text-gray-500 py-8">
                       <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                       <p>لا توجد مبيعات حديثة</p>
                     </div>
                                        ) : (
                                            <div className="space-y-4">
                       {sales.slice(0, 5).map(sale => {
                         const isDeleting = loadingProducts.size > 0;
                         return (
                           <div key={sale.id} className={`border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow relative ${isDeleting ? 'opacity-75' : ''}`}>
                             {/* Loading Overlay */}
                             {isDeleting && (
                               <div className="absolute inset-0 rounded-lg bg-gray-100 bg-opacity-50 flex items-center justify-center z-10">
                                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                               </div>
                             )}
                             
                             {/* Sale Header */}
                             <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-100">
                               <div className="flex items-center gap-2">
                                 <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                   <DollarSign className="h-4 w-4 text-green-600" />
                                 </div>
                                 <div>
                                   <span className="text-sm font-semibold text-gray-900">
                                     {sale.customerName || "عميل بدون اسم"}
                                   </span>
                                   <div className="text-xs text-gray-500">
                                     {sale.timestamp.toLocaleDateString('ar-EG')} - {sale.timestamp.toLocaleTimeString('ar-EG', { 
                                       hour: '2-digit', 
                                       minute: '2-digit' 
                                     })}
                                   </div>
                                 </div>
                               </div>
                               <div className="flex items-start gap-2">
                                 <div className="text-right">
                                   <div className="text-lg font-bold text-green-600">
                                     {sale.totalAmount.toLocaleString()} ج.م
                                   </div>
                                   <div className="text-xs text-gray-500">
                                     {sale.items.length} منتج
                                   </div>
                                 </div>
                                 <Button
                                   variant="ghost"
                                   size="sm"
                                   onClick={() => confirmDeleteSale(sale.id)}
                                   disabled={loadingProducts.size > 0}
                                   className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                   title="حذف عملية البيع"
                                 >
                                   {loadingProducts.size > 0 ? (
                                     <div className="animate-spin rounded-full h-4 w-4 border-b border-red-500"></div>
                                   ) : (
                                     <AlertTriangle className="h-4 w-4" />
                                   )}
                                 </Button>
                               </div>
                             </div>

                             {/* Sale Items */}
                             <div className="space-y-2">
                               {sale.items.slice(0, 3).map((item, index) => (
                                 <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                                   {/* Product Image */}
                                   <div className="relative">
                                     <img
                                       src={item.product.images?.[0] || "/placeholder.svg"}
                                       alt={item.product.name}
                                       className="w-12 h-12 object-cover rounded-md border"
                                     />
                                     {item.selectedSize && (
                                       <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1 rounded-full">
                                         {item.selectedSize.label}
                                       </div>
                                     )}
                                   </div>

                                   {/* Product Details */}
                                   <div className="flex-1 min-w-0">
                                     <div className="flex items-start justify-between">
                                       <div className="flex-1 min-w-0">
                                         <h4 className="text-sm font-medium text-gray-900 truncate">
                                           {item.product.name}
                                         </h4>
                                         <div className="flex items-center gap-2 mt-1">
                                           <span className="text-xs text-gray-500">
                                             الكمية: {item.quantity}
                                           </span>
                                           {item.selectedAddons && item.selectedAddons.length > 0 && (
                                             <span className="text-xs text-green-600">
                                               +{item.selectedAddons.length} إضافة
                                             </span>
                                           )}
                                         </div>
                                       </div>
                                       <div className="text-right ml-2">
                                         <div className="text-sm font-semibold text-gray-900">
                                           {formatCurrency(item.unitFinalPrice, 'جنيه')}
                                         </div>
                                         <div className="text-xs text-gray-500">
                                           × {item.quantity}
                                         </div>
                                       </div>
                                     </div>

                                     {/* Addons Display */}
                                     {item.selectedAddons && item.selectedAddons.length > 0 && (
                                       <div className="mt-1 flex flex-wrap gap-1">
                                         {item.selectedAddons.map((addon, addonIndex) => (
                                           <span
                                             key={addonIndex}
                                             className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                                           >
                                             +{addon.label}
                                           </span>
                                         ))}
                                       </div>
                                     )}
                                   </div>
                                 </div>
                               ))}

                               {/* Show more items indicator */}
                               {sale.items.length > 3 && (
                                 <div className="text-center py-2">
                                   <span className="text-xs text-gray-500">
                                     +{sale.items.length - 3} منتجات أخرى
                                   </span>
                                 </div>
                               )}
                             </div>

                             {/* Sale Footer */}
                             <div className="mt-3 pt-3 border-t border-gray-100">
                               <div className="flex justify-between items-center text-sm">
                                 <span className="text-gray-600">المجموع:</span>
                                 <span className="font-bold text-green-600">
                                   {sale.totalAmount.toLocaleString()} ج.م
                                 </span>
                               </div>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   )}
                 </div>
               </CardContent>
             </Card>
          </div>
        </div>
      </div>

      {/* Product Options Dialog */}
      <Dialog open={optionsDialogOpen} onOpenChange={setOptionsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>اختيار خيارات المنتج</DialogTitle>
          </DialogHeader>
          
          {selectedProductForOptions && (
            <div className="space-y-6">
               {/* Product Info */}
               <div className="text-center">
                 <div className="relative inline-block">
                   <img
                     src={selectedProductForOptions.images?.[0] || "/placeholder.svg"}
                     alt={selectedProductForOptions.name}
                     className="w-20 h-20 object-cover rounded-lg mx-auto mb-3"
                   />
                   {selectedProductForOptions.specialOffer && 
                    selectedProductForOptions.offerEndsAt && 
                    new Date(selectedProductForOptions.offerEndsAt) > new Date() && (
                     <div className="absolute -top-2 -right-2">
                       <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                         {selectedProductForOptions.discountPercentage}% خصم
                       </div>
                     </div>
                   )}
                 </div>
                 <h3 className="font-semibold text-lg">{selectedProductForOptions.name}</h3>
                 <p className="text-sm text-gray-500">{selectedProductForOptions.brand}</p>
                 
                 {/* Price Display */}
                 {selectedProductForOptions.specialOffer && 
                  selectedProductForOptions.offerEndsAt && 
                  new Date(selectedProductForOptions.offerEndsAt) > new Date() && (
                   <div className="mt-2 flex items-center justify-center gap-2">
                     <span className="text-lg font-bold text-red-600">
                                                   {formatCurrency(selectedProductForOptions.discountPrice || 
                         (selectedProductForOptions.price - selectedProductForOptions.price * (selectedProductForOptions.discountPercentage || 0) / 100))}
                     </span>
                     <span className="text-sm text-gray-500 line-through">
                                               {formatCurrency(selectedProductForOptions.price, 'جنيه')}
                     </span>
                   </div>
                 )}
               </div>

              {/* Sizes Section */}
              {selectedProductForOptions.sizes && selectedProductForOptions.sizes.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">اختر الحجم</h4>
                  <RadioGroup value={selectedSizeId || ''} onValueChange={handleSizeChange}>
                    {selectedProductForOptions.sizes.map((size) => (
                      <div key={size.id} className="flex items-center space-x-2 space-x-reverse">
                        <RadioGroupItem value={size.id} id={`size-${size.id}`} />
                        <Label htmlFor={`size-${size.id}`} className="flex-1 cursor-pointer">
                          <div className="flex justify-between items-center p-2 border rounded hover:bg-gray-50">
                            <span>{size.label}</span>
                            <span className="font-bold text-primary">{formatCurrency(size.price, 'جنيه')}</span>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {/* Addons Section */}
              {selectedProductForOptions.addons && selectedProductForOptions.addons.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">الإضافات الاختيارية</h4>
                  {selectedProductForOptions.addons.map((addon) => (
                    <div key={addon.id} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id={`addon-${addon.id}`}
                        checked={selectedAddonIds.includes(addon.id)}
                        onCheckedChange={(checked) => handleAddonToggle(addon.id, !!checked)}
                      />
                      <Label htmlFor={`addon-${addon.id}`} className="flex-1 cursor-pointer">
                        <div className="flex justify-between items-center p-2 border rounded hover:bg-gray-50">
                          <span>{addon.label}</span>
                                                      <span className="font-bold text-green-600">+{formatCurrency(addon.price_delta, 'جنيه')}</span>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              )}

              {/* Price Summary */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">السعر النهائي:</span>
                  <span className="text-xl font-bold text-primary">
                                            {formatCurrency(calculateFinalPrice(
                      selectedProductForOptions,
                      selectedSizeId,
                      selectedAddonIds
                    ))}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button onClick={handleConfirmOptions} className="flex-1">
                  إضافة للسلة
                </Button>
                <Button variant="outline" onClick={handleCancelOptions}>
                  إلغاء
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
  );
} 