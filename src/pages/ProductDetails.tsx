import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { Product, ProductSize, ProductAddon } from "@/types/product";
import { ProductCard } from "@/components/ProductCard";
import { ProductModal } from "@/components/ProductModal";
import { ProductOptions } from "@/components/ProductOptions";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Share2,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  Heart,
  Star,
  Truck,
  Shield,
  RotateCcw,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import { formatCurrency } from "@/utils/format";
import { commonColors, getColorByName } from "@/constants/colors";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<ProductAddon[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [finalPrice, setFinalPrice] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  const products = useStore((state) => state.products);
  const cart = useStore((state) => state.cart);
  const addToCart = useStore((state) => state.addToCart);
  const removeFromCart = useStore((state) => state.removeFromCart);
  const updateCartItemQuantity = useStore(
    (state) => state.updateCartItemQuantity
  );
  const getCartTotal = useStore((state) => state.getCartTotal);
  const getCartItemPrice = useStore((state) => state.getCartItemPrice);
  const updateProductQuantity = useStore((state) => state.updateProductQuantity);

  // Find current product
  const product = products.find((p) => p.id === id);

  // Parse available colors and create color-image mapping
  const availableColors = product?.color ? product.color.split(',').map(c => c.trim()) : [];
  
  // Create mapping between colors and images
  const colorImageMapping = useMemo(() => {
    const mapping: { [key: string]: string } = {};
    availableColors.forEach((color, index) => {
      if (product?.images && product.images[index]) {
        mapping[color] = product.images[index];
      }
    });
    return mapping;
  }, [availableColors, product?.images]);
  
  // Get current image based on selected color
  const currentImage = selectedColor && colorImageMapping[selectedColor] 
    ? colorImageMapping[selectedColor] 
    : product?.images[selectedImage] || product?.images[0];

  // Check if product is in cart (considering selected size and color)
  const cartItem = cart.find((item) => 
    item.product.id === id && 
    (selectedSize ? item.selectedSize?.id === selectedSize.id : !item.selectedSize) &&
    (selectedColor ? item.selectedColor === selectedColor : !item.selectedColor)
  );

  // Find suggested products (same category, excluding current product)
  const suggestedProducts = products
    .filter(
      (p) =>
        p.category === product?.category &&
        p.id !== product?.id &&
        !p.isArchived
    )
    .slice(0, 4);

  useEffect(() => {
    if (!product) {
      navigate("/products");
    } else {
      // Initialize final price with base price or first size price
      let basePrice = product.price;
      if (product.sizes && product.sizes.length > 0) {
        basePrice = product.sizes[0].price;
      }
      
      // Use discount price as recorded in admin if available, otherwise calculate
      let finalPrice = basePrice;
      if (product.specialOffer && 
          product.offerEndsAt &&
          new Date(product.offerEndsAt) > new Date()) {
        if (product.discountPrice) {
          finalPrice = product.discountPrice;
        } else if (product.discountPercentage) {
          const discountAmount = (basePrice * product.discountPercentage) / 100;
          finalPrice = basePrice - discountAmount;
        }
      }
      
      setFinalPrice(finalPrice);
      
      // Set first color as default if available
      if (availableColors.length > 0 && !selectedColor) {
        setSelectedColor(availableColors[0]);
      }
    }
  }, [product, navigate, availableColors, selectedColor]);

  // Handle selection changes from ProductOptions component
  const handleSelectionChange = useCallback((
    newSelectedSize: ProductSize | null,
    newSelectedAddons: ProductAddon[],
    newFinalPrice: number
  ) => {
    setSelectedSize(newSelectedSize);
    setSelectedAddons(newSelectedAddons);
    setFinalPrice(newFinalPrice);
  }, []);

  if (!product) {
    return null;
  }

  const handleAddToCart = async () => {
    // Check if product is out of stock
    const availableQuantity = product.wholesaleInfo?.quantity || 0;
    if (availableQuantity <= 0) {
      toast.error("المنتج غير متوفر حالياً", {
        description: "تم نفاد الكمية المتاحة لهذا المنتج",
      });
      return;
    }

    // Validate required selections
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast.error("يرجى اختيار حجم المنتج أولاً");
      return;
    }

    if (availableColors.length > 0 && !selectedColor) {
      toast.error("يرجى اختيار لون المنتج أولاً");
      return;
    }

         try {
       // Use the updated addToCart function with options (quantity = 1)
       await addToCart(product, 1, selectedSize, selectedAddons, selectedColor);
      
      toast.success(
        `${t("cart.productAdded")}: ${product.name}${selectedSize ? ` - ${selectedSize.label}` : ''}${selectedColor ? ` - ${getColorByName(selectedColor).name}` : ''}`,
        {
          duration: 5000,
          dismissible: true,
        }
      );
    } catch (error) {
      toast.error("خطأ في إضافة المنتج", {
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
      });
    }
  };

  const handleUpdateQuantity = async (newQuantity: number) => {
    if (newQuantity === 0) {
      try {
        removeFromCart(product.id);
        toast.success(`${t("cart.productRemoved")}: ${product.name}`, {
          duration: 5000,
          dismissible: true,
        });
      } catch (error) {
        toast.error("خطأ في حذف المنتج", {
          description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        });
      }
    } else {
      try {
        const cartItem = cart.find(item => item.product.id === product.id);
        if (!cartItem) return;

        updateCartItemQuantity(product.id, newQuantity);
      } catch (error) {
        toast.error("خطأ في تحديث الكمية", {
          description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        });
      }
    }
  };

  const handleShare = () => {
    const productUrl = `${window.location.origin}/products/${product.id}`;

    // Build selection info
    const selectionInfo = [];
    if (selectedSize) {
      selectionInfo.push(`📐 الحجم: ${selectedSize.label}`);
    }
    if (selectedColor) {
      selectionInfo.push(`🎨 اللون: ${getColorByName(selectedColor).name}`);
    }
    if (selectedAddons.length > 0) {
      selectionInfo.push(`➕ الإضافات: ${selectedAddons.map(addon => addon.label).join(', ')}`);
    }

    const message = [
      `🛍️ *${product.name}*`,
      `🏷️ ${t("products.brand")}: ${product.brand}`,
      ...selectionInfo,
      `💰 السعر النهائي: ${formatCurrency(finalPrice, 'جنيه')}`,
      product.specialOffer &&
      new Date(product.offerEndsAt as string) > new Date()
        ? `🎉 ${t("products.specialOffer")}`
        : null,
      product.description
        ? `📝 ${t("products.description")}: ${product.description.replace(/<[^>]*>/g, '').substring(0, 100)}...`
        : null,
      product.category
        ? `📦 ${t("products.category")}: ${product.category}`
        : null,
      `\n🔗 ${t("common.viewProduct")}: ${productUrl}`,
    ]
      .filter(Boolean)
      .join("\n");

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
  };

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast.success(isWishlisted ? "تم إزالة المنتج من المفضلة" : "تم إضافة المنتج إلى المفضلة");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto py-8 px-4 md:px-8">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Breadcrumb>
            <BreadcrumbList className="flex items-center text-sm">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    to="/"
                    className="flex items-center text-muted-foreground hover:text-primary transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-1"
                    >
                      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    {t("navigation.home")}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>

              <span className="mx-2 text-muted-foreground">&lt;</span>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    to="/products"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {t("navigation.products")}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>

              <span className="mx-2 text-muted-foreground">&lt;</span>
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium text-primary">
                  {product.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </motion.div>

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Product Images */}
          <div className="space-y-6">
            {/* Main Image */}
            <div className="aspect-[4/5] w-full rounded-2xl overflow-hidden relative group bg-white shadow-lg">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImage}
                  src={currentImage}
                  alt={product.name}
                  className="h-full w-full object-contain"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                />
              </AnimatePresence>
              
              {/* Wishlist Button */}
              <button
                onClick={toggleWishlist}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-all duration-200"
              >
                <Heart 
                  className={`h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
                />
              </button>

              {/* Navigation arrows */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setSelectedImage((prev) =>
                        prev > 0 ? prev - 1 : product.images.length - 1
                      )
                    }
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 backdrop-blur-sm p-3 text-gray-700 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-white shadow-lg"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() =>
                      setSelectedImage((prev) =>
                        prev < product.images.length - 1 ? prev + 1 : 0
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 backdrop-blur-sm p-3 text-gray-700 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-white shadow-lg"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>
            
            {/* Thumbnails - Show only images for available colors */}
            {availableColors.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {availableColors.map((color, index) => {
                  const image = colorImageMapping[color];
                  if (!image) return null;
                  
                  return (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                        selectedColor === color
                          ? "border-primary "
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} - ${getColorByName(color).name}`}
                        className="h-full w-full object-contain"
                      />
                      {/* Color indicator overlay */}
                      <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm"
                           style={{ backgroundColor: color }} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            {/* Product Header */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Badge variant="secondary" className="text-xs">
                    {product.category}
                  </Badge>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {product.name}
                  </h1>
                  <p className="text-lg text-gray-600">
                    {product.brand}
                  </p>
                </div>
                
                {/* Rating */}
                <div className="flex items-center gap-1">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">(4.8)</span>
                </div>
              </div>

              {/* Price */}
              <div className="space-y-2">
                {product.specialOffer &&
                new Date(product.offerEndsAt as string) > new Date() ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-bold text-red-600">
                        {formatCurrency(finalPrice, 'جنيه')}
                      </span>
                      <span className="text-xl line-through text-gray-400">
                        {formatCurrency(product.price, 'جنيه')}
                      </span>
                      <Badge variant="destructive" className="text-sm">
                        {product.discountPercentage}% خصم
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="animate-pulse"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <p>
                        ينتهي العرض في {new Date(product.offerEndsAt as string).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <span className="text-3xl font-bold text-gray-900">
                    {formatCurrency(finalPrice, 'جنيه')}
                  </span>
                )}
              </div>
            </div>

            <Separator />

                         {/* Color Selection */}
             {availableColors.length > 0 && (
               <div className="space-y-4">
                 <div className="flex items-center justify-between">
                   <h3 className="text-lg font-semibold text-gray-900">اختر اللون</h3>
                   <span className="text-sm text-gray-500">
                     {selectedColor ? getColorByName(selectedColor).name : 'اختر لوناً'}
                   </span>
                 </div>
                 <div className="flex gap-3">
                   {availableColors.map((color) => {
                     const colorInfo = getColorByName(color);
                     
                     return (
                       <button
                         key={color}
                         onClick={() => setSelectedColor(color)}
                         className={`relative group ${
                           selectedColor === color 
                             ? 'ring-2 ring-primary ring-offset-2' 
                             : 'ring-1 ring-gray-200 hover:ring-gray-300'
                         } rounded-full p-1 transition-all duration-200`}
                         title={colorInfo.name}
                       >
                         <div
                           className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                           style={{ backgroundColor: color }}
                         />
                         {selectedColor === color && (
                           <div className="absolute inset-0 flex items-center justify-center">
                             <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                           </div>
                         )}
                       </button>
                     );
                   })}
                 </div>
               </div>
             )}

                           {/* Available Quantity Display */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">الكمية المتاحة</h3>
                    <p className="text-sm text-gray-500">المخزون الحالي</p>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {product.wholesaleInfo?.quantity || 0}
                    </div>
                    <div className="text-sm text-blue-700">
                      قطعة متاحة
                    </div>
                  </div>
                </div>
              </div>

            {/* Product Options */}
            <ProductOptions 
              product={product} 
              onSelectionChange={handleSelectionChange}
            />

            <Separator />



                         {/* Action Buttons */}
             <div className="space-y-4">
               {cartItem ? (
                 <div className="space-y-4">
                   <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                     <div className="flex items-center gap-3">
                       <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                       <span className="text-sm font-medium text-green-800">
                         تم إضافة المنتج إلى السلة
                       </span>
                     </div>
                     <div className="flex items-center gap-2">
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => handleUpdateQuantity(cartItem.quantity - 1)}
                         disabled={cartItem.quantity <= 1}
                       >
                         <Minus className="h-4 w-4" />
                       </Button>
                       <span className="w-12 text-center font-bold text-lg text-gray-900">
                         {cartItem.quantity}
                       </span>
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => handleUpdateQuantity(cartItem.quantity + 1)}
                         disabled={cartItem.quantity >= (product.wholesaleInfo?.quantity || 999)}
                       >
                         <Plus className="h-4 w-4" />
                       </Button>
                     </div>
                   </div>
                   
                   <div className="flex gap-3">
                     <Button
                       size="lg"
                       className="flex-1 bg-primary hover:bg-primary/90"
                       onClick={() => navigate("/cart")}
                     >
                       <ShoppingCart className="mr-2 h-5 w-5" />
                       الذهاب إلى السلة ({cartItem.quantity})
                     </Button>
                     <Button
                       size="lg"
                       variant="outline"
                       onClick={handleShare}
                     >
                       <Share2 className="mr-2 h-5 w-5" />
                       مشاركة
                     </Button>
                   </div>
                 </div>
               ) : (
                 <div className="space-y-4">
                                       <Button
                      size="lg"
                      className="w-full h-14 text-lg bg-primary hover:bg-primary/90"
                      onClick={handleAddToCart}
                      disabled={!selectedColor && availableColors.length > 0}
                    >
                      <ShoppingCart className="mr-2 h-6 w-6" />
                      إضافة إلى السلة
                    </Button>
                   
                   <div className="flex gap-3">
                     <Button
                       size="lg"
                       variant="outline"
                       className="flex-1"
                       onClick={handleShare}
                     >
                       <Share2 className="mr-2 h-5 w-5" />
                       مشاركة
                     </Button>
                     <Button
                       size="lg"
                       variant="outline"
                       onClick={toggleWishlist}
                     >
                       <Heart className={`mr-2 h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                       المفضلة
                     </Button>
                   </div>
                 </div>
               )}
             </div>

            {/* Product Features */}
            <div className="grid grid-cols-2 gap-4 pt-6">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Truck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">شحن مجاني</p>
                  <p className="text-xs text-gray-500">للطلبات فوق 500 ج.م</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">ضمان الجودة</p>
                  <p className="text-xs text-gray-500">استرجاع مجاني</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <RotateCcw className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">استبدال سريع</p>
                  <p className="text-xs text-gray-500">خلال 7 أيام</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Star className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">جودة عالية</p>
                  <p className="text-xs text-gray-500">منتجات أصلية</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Product Description */}
        {product.description && (
          <div className="mb-16">
            <Separator className="mb-8" />
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">وصف المنتج</h2>
              <div
                className="prose prose-lg max-w-none
                prose-headings:font-semibold
                prose-p:leading-relaxed
                prose-ul:list-disc prose-ul:pl-4
                prose-ol:list-decimal prose-ol:pl-4
                prose-li:my-1
                prose-strong:text-foreground
                prose-em:text-foreground/80
                prose-ul:marker:text-foreground
                prose-ol:marker:text-foreground"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          </div>
        )}

        {/* Suggested Products */}
        <div className="mb-16">
          <Separator className="mb-8" />
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              منتجات مشابهة
            </h2>
            <p className="text-gray-600">
              اكتشف المزيد من المنتجات المميزة
            </p>
          </div>
          
          {suggestedProducts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {suggestedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onView={() => {
                    setSelectedProduct(product);
                    setModalOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      <ProductModal
        product={selectedProduct}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
};

export default ProductDetails; 