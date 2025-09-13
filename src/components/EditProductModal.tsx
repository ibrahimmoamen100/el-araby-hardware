import { useState, useEffect } from "react";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, X, Calendar as CalendarIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ar } from "date-fns/locale";
import { formatPrice } from "@/utils/format";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "@/styles/quill-custom.css";
import { commonColors, getColorByName } from "@/constants/colors";

// Common size options
const commonSizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "One Size"];

interface EditProductModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (product: Product) => void;
}

export function EditProductModal({
  product,
  open,
  onOpenChange,
  onSave,
}: EditProductModalProps) {
  const { products } = useStore();
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Product | null>(null);
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [offerEndDate, setOfferEndDate] = useState<Date | undefined>(undefined);
  const [customBrand, setCustomBrand] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [customSubcategory, setCustomSubcategory] = useState("");
  const [showCustomBrand, setShowCustomBrand] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [showCustomSubcategory, setShowCustomSubcategory] = useState(false);
  const [discountPrice, setDiscountPrice] = useState("");
  const [showWholesaleInfo, setShowWholesaleInfo] = useState(false);

  // Functions to manage sizes
  const addSize = () => {
    if (!formData) return;
    const newSize = {
      id: crypto.randomUUID(),
      label: "",
      price: 0,
    };
    setFormData({
      ...formData,
      sizes: [...(formData.sizes || []), newSize]
    });
  };

  const updateSize = (index: number, field: 'label' | 'price', value: string | number) => {
    if (!formData) return;
    setFormData({
      ...formData,
      sizes: (formData.sizes || []).map((size, i) => 
        i === index ? { ...size, [field]: value } : size
      )
    });
  };

  const removeSize = (index: number) => {
    if (!formData) return;
    setFormData({
      ...formData,
      sizes: (formData.sizes || []).filter((_, i) => i !== index)
    });
  };

  // Functions to manage addons
  const addAddon = () => {
    if (!formData) return;
    const newAddon = {
      id: crypto.randomUUID(),
      label: "",
      price_delta: 0,
    };
    setFormData({
      ...formData,
      addons: [...(formData.addons || []), newAddon]
    });
  };

  const updateAddon = (index: number, field: 'label' | 'price_delta', value: string | number) => {
    if (!formData) return;
    setFormData({
      ...formData,
      addons: (formData.addons || []).map((addon, i) => 
        i === index ? { ...addon, [field]: value } : addon
      )
    });
  };

  const removeAddon = (index: number) => {
    if (!formData) return;
    setFormData({
      ...formData,
      addons: (formData.addons || []).filter((_, i) => i !== index)
    });
  };

  // Get unique brands and categories from existing products
  const getUniqueBrands = () => {
    const brands = products.map((product) => product.brand).filter(Boolean);
    return [...new Set(brands)].sort();
  };

  const getUniqueCategories = () => {
    const categories = products
      .map((product) => product.category)
      .filter(Boolean);
    return [...new Set(categories)].sort();
  };

  const getUniqueSubcategories = (category: string) => {
    const subcategories = products
      .filter((product) => product.category === category)
      .map((product) => product.subcategory)
      .filter(Boolean);
    return [...new Set(subcategories)].sort();
  };

  const uniqueBrands = getUniqueBrands();
  const uniqueCategories = getUniqueCategories();
  const uniqueSubcategories = formData?.category
    ? getUniqueSubcategories(formData.category)
    : [];

  useEffect(() => {
    if (product) {
      // Reset all form state
      setFormData({
        ...product,
        wholesaleInfo: product.wholesaleInfo
          ? {
              ...product.wholesaleInfo,
              supplierLocation: product.wholesaleInfo.supplierLocation || "",
            }
          : undefined,
      });
      setColors(product.color ? product.color.split(",") : []);
      setSizes(product.size ? product.size.split(",") : []);
      setOfferEndDate(
        product.offerEndsAt ? new Date(product.offerEndsAt) : undefined
      );
      setCustomBrand("");
      setCustomCategory("");
      setCustomSubcategory("");
      setShowCustomBrand(false);
      setShowCustomCategory(false);
      setShowCustomSubcategory(false);
      setShowWholesaleInfo(!!product.wholesaleInfo);

      if (product.specialOffer && product.discountPrice) {
        setDiscountPrice(product.discountPrice.toString());
      } else if (product.specialOffer && product.discountPercentage) {
        // Fallback for old products without discountPrice field
        const originalPrice = product.price;
        const discountPercentage = product.discountPercentage;
        const calculatedDiscountPrice =
          originalPrice - (originalPrice * discountPercentage) / 100;
        setDiscountPrice(calculatedDiscountPrice.toString());
      } else {
        setDiscountPrice("");
      }
    } else {
      // Reset all form state when modal is closed
      setFormData(null);
      setColors([]);
      setSizes([]);
      setOfferEndDate(undefined);
      setCustomBrand("");
      setCustomCategory("");
      setCustomSubcategory("");
      setShowCustomBrand(false);
      setShowCustomCategory(false);
      setShowCustomSubcategory(false);
      setShowWholesaleInfo(false);
      setDiscountPrice("");
    }
  }, [product]);

  const addColor = (colorValue: string) => {
    if (!colors.includes(colorValue)) {
      setColors([...colors, colorValue]);
    }
  };

  const removeColor = (colorToRemove: string) => {
    setColors(colors.filter((color) => color !== colorToRemove));
  };

  const addOldSize = (size: string) => {
    if (!sizes.includes(size)) {
      setSizes([...sizes, size]);
    }
  };

  const removeOldSize = (sizeToRemove: string) => {
    setSizes(sizes.filter((size) => size !== sizeToRemove));
  };

  const addImageUrl = () => {
    if (imageUrl && formData && !formData.images.includes(imageUrl)) {
      setFormData({ ...formData, images: [...formData.images, imageUrl] });
      setImageUrl("");
    }
  };

  const removeImage = (urlToRemove: string) => {
    if (formData) {
      setFormData({
        ...formData,
        images: formData.images.filter((url) => url !== urlToRemove),
      });
    }
  };

  // Calculate discount percentage based on price and discount price
  const calculateDiscountPercentage = (
    price: number,
    discountPrice: number
  ) => {
    if (!price || !discountPrice) return "";
    const percentage = ((price - discountPrice) / price) * 100;
    return percentage.toFixed(0);
  };

  // Update form data when discount price changes
  const handleDiscountPriceChange = (value: string) => {
    setDiscountPrice(value);
    if (formData) {
      const price = Number(formData.price);
      const discountPriceNum = Number(value);
      if (price && discountPriceNum) {
        const percentage = calculateDiscountPercentage(price, discountPriceNum);
        setFormData({
          ...formData,
          discountPercentage: Number(percentage),
          discountPrice: Number(value),
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    // Use custom values if they exist, otherwise use selected values
    const finalBrand = showCustomBrand ? customBrand : formData.brand;
    const finalCategory = showCustomCategory
      ? customCategory
      : formData.category;
    const finalSubcategory = showCustomSubcategory
      ? customSubcategory
      : formData.subcategory;

    if (!formData.name || !finalBrand || !formData.price || !finalCategory) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate special offer fields if special offer is enabled
    if (formData.specialOffer) {
      if (!formData.discountPercentage) {
        toast.error("Please enter a discount percentage for the special offer");
        return;
      }
      if (!offerEndDate) {
        toast.error("Please select an end date for the special offer");
        return;
      }
    }

    try {
      const updatedProduct = {
        ...formData,
        brand: finalBrand,
        category: finalCategory,
        subcategory: finalSubcategory,
        color: colors.length > 0 ? colors.join(",") : "",
        size: sizes.length > 0 ? sizes.join(",") : "",
        discountPercentage: formData.specialOffer && formData.discountPercentage
          ? Number(formData.discountPercentage)
          : null,
        discountPrice: formData.specialOffer && formData.discountPrice
          ? Number(formData.discountPrice)
          : null,
        offerEndsAt:
          formData.specialOffer && offerEndDate
            ? offerEndDate.toISOString()
            : null,
        createdAt: product?.createdAt || new Date().toISOString(),
      };

      await onSave(updatedProduct);
      onOpenChange(false);
      toast.success("Product updated successfully");
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    }
  };

  if (!formData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[70vw] max-w-[90vw]">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Make changes to the product details here. Click save when you're
            done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <Input
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Brand *</label>
              {!showCustomBrand ? (
                <div className="space-y-2">
                  <Select
                    value={formData.brand}
                    onValueChange={(value) => {
                      if (value === "add-new") {
                        setShowCustomBrand(true);
                        setFormData({ ...formData, brand: "" });
                      } else {
                        setFormData({ ...formData, brand: value });
                      }
                    }}
                  >
                    <SelectTrigger className="shrink-0">
                      <SelectValue placeholder="Select a brand" />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4}>
                      {uniqueBrands.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                      <SelectItem
                        value="add-new"
                        className="text-blue-600 font-medium"
                      >
                        + Add New Brand
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    required
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    placeholder="Enter new brand name"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowCustomBrand(false);
                      setCustomBrand("");
                    }}
                  >
                    Back to Selection
                  </Button>
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Price *</label>
              <Input
                required
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: Number(e.target.value) })
                }
              />
              {formData.price && (
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(Number(formData.price))} جنيه
                  </p>
                  {formData.specialOffer && formData.discountPrice && (
                    <p className="text-sm text-red-600">
                      بعد الخصم:{" "}
                      {formatPrice(Number(formData.discountPrice))}{" "}
                      جنيه
                    </p>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Category *</label>
              {!showCustomCategory ? (
                <div className="space-y-2">
                  <Select
                    value={formData.category}
                    onValueChange={(value) => {
                      if (value === "add-new") {
                        setShowCustomCategory(true);
                        setFormData({ ...formData, category: "" });
                      } else {
                        setFormData({ ...formData, category: value });
                      }
                    }}
                  >
                    <SelectTrigger className="shrink-0">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4}>
                      {uniqueCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                      <SelectItem
                        value="add-new"
                        className="text-blue-600 font-medium"
                      >
                        + Add New Category
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    required
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Enter new category name"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowCustomCategory(false);
                      setCustomCategory("");
                    }}
                  >
                    Back to Selection
                  </Button>
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Subcategory *</label>
              {!showCustomSubcategory ? (
                <div className="space-y-2">
                  <Select
                    value={formData.subcategory}
                    onValueChange={(value) => {
                      if (value === "add-new") {
                        setShowCustomSubcategory(true);
                        setFormData({ ...formData, subcategory: "" });
                      } else {
                        setFormData({ ...formData, subcategory: value });
                      }
                    }}
                  >
                    <SelectTrigger className="shrink-0">
                      <SelectValue placeholder="Select a subcategory" />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4}>
                      {uniqueSubcategories.map((subcategory) => (
                        <SelectItem key={subcategory} value={subcategory}>
                          {subcategory}
                        </SelectItem>
                      ))}
                      <SelectItem
                        value="add-new"
                        className="text-blue-600 font-medium"
                      >
                        + Add New Subcategory
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    required
                    value={customSubcategory}
                    onChange={(e) => setCustomSubcategory(e.target.value)}
                    placeholder="Enter new subcategory name"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowCustomSubcategory(false);
                      setCustomSubcategory("");
                    }}
                  >
                    Back to Selection
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Special Offer Section */}
          <div className="rounded-md border p-4 space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="special-offer"
                checked={formData.specialOffer}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, specialOffer: checked })
                }
              />
              <Label htmlFor="special-offer" className="font-medium">
                Special Offer
              </Label>
            </div>

            {formData.specialOffer && (
              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                <div>
                  <label className="text-sm font-medium">
                    Discount Price *
                  </label>
                  <div className="flex items-center">
                    <Input
                      type="number"
                      min="1"
                      value={discountPrice}
                      onChange={(e) =>
                        handleDiscountPriceChange(e.target.value)
                      }
                      className="flex-1"
                      placeholder="Enter discount price"
                    />
                    <span className="ms-2 text-lg">EGP</span>
                  </div>
                  {formData.price && discountPrice && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Discount: {formData.discountPercentage}%
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Offer End Date *
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !offerEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {offerEndDate ? (
                          format(offerEndDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={offerEndDate}
                        onSelect={setOfferEndDate}
                        initialFocus
                        disabled={(date) => date < new Date()}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </div>

          {/* Color section */}
          <div>
            <label className="text-sm font-medium mb-3 block">الألوان المتاحة *</label>
            <div className="space-y-4">
              {/* Color Categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Colors */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">الألوان الأساسية</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {commonColors.filter(color => color.category === "basic").map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => addColor(color.value)}
                        disabled={colors.includes(color.value)}
                        className={cn(
                          "relative h-10 w-10 rounded-full border-2 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed",
                          colors.includes(color.value) 
                            ? "border-primary ring-2 ring-primary/20" 
                            : "border-gray-300 hover:border-gray-400"
                        )}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      >
                        {colors.includes(color.value) && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-3 h-3 bg-white rounded-full shadow-sm"></div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Warm Colors */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">الألوان الدافئة</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {commonColors.filter(color => color.category === "warm").map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => addColor(color.value)}
                        disabled={colors.includes(color.value)}
                        className={cn(
                          "relative h-10 w-10 rounded-full border-2 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed",
                          colors.includes(color.value) 
                            ? "border-primary ring-2 ring-primary/20" 
                            : "border-gray-300 hover:border-gray-400"
                        )}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      >
                        {colors.includes(color.value) && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-3 h-3 bg-white rounded-full shadow-sm"></div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cool Colors */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">الألوان الباردة</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {commonColors.filter(color => color.category === "cool").map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => addColor(color.value)}
                        disabled={colors.includes(color.value)}
                        className={cn(
                          "relative h-10 w-10 rounded-full border-2 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed",
                          colors.includes(color.value) 
                            ? "border-primary ring-2 ring-primary/20" 
                            : "border-gray-300 hover:border-gray-400"
                        )}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      >
                        {colors.includes(color.value) && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-3 h-3 bg-white rounded-full shadow-sm"></div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fashion Colors */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">ألوان الموضة</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {commonColors.filter(color => color.category === "fashion").map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => addColor(color.value)}
                        disabled={colors.includes(color.value)}
                        className={cn(
                          "relative h-10 w-10 rounded-full border-2 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed",
                          colors.includes(color.value) 
                            ? "border-primary ring-2 ring-primary/20" 
                            : "border-gray-300 hover:border-gray-400"
                        )}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      >
                        {colors.includes(color.value) && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-3 h-3 bg-white rounded-full shadow-sm"></div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Selected Colors Display */}
              {colors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    الألوان المختارة ({colors.length})
                  </h4>
                  <div className="flex flex-wrap gap-3 p-3 bg-muted/30 rounded-lg border">
                    {colors.map((color, index) => {
                      const colorInfo = getColorByName(color);
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-2 bg-background rounded-full px-3 py-2 border shadow-sm"
                        >
                          <div
                            className="h-6 w-6 rounded-full border-2 border-gray-300"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-sm font-medium">{colorInfo.name}</span>
                          <button
                            type="button"
                            onClick={() => removeColor(color)}
                            className="ml-1 p-1 rounded-full hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quick Color Picker */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  اختيار سريع للألوان الشائعة
                </h4>
                <div className="flex flex-wrap gap-2">
                  {commonColors.slice(0, 12).map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => addColor(color.value)}
                      disabled={colors.includes(color.value)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-full border text-sm transition-all hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed",
                        colors.includes(color.value) 
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "bg-background hover:border-primary/50"
                      )}
                    >
                      <div
                        className="h-4 w-4 rounded-full border"
                        style={{ backgroundColor: color.value }}
                      />
                      {color.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* sizes  */}
          {/* <div>
            <label className="text-sm font-medium">Sizes *</label>
            <div className="space-y-2">
              <Select onValueChange={addOldSize}>
                <SelectTrigger className="w-full shrink-0">
                  <SelectValue placeholder="Select a size" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  {commonSizes.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2 mt-2">
                {sizes.map((size, index) => (
                  <div
                    key={index}
                    className="relative inline-flex items-center rounded-md border bg-background px-3 py-1"
                  >
                    {size}
                    <button
                      type="button"
                      onClick={() => removeOldSize(size)}
                      className="ml-2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div> */}

          <div>
            <label className="text-sm font-medium">Images</label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Enter image URL"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={addImageUrl}
                  variant="outline"
                  className="flex gap-1 items-center"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add
                </Button>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {formData.images.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Product ${index + 1}`}
                      className="aspect-square rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(url)}
                      className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="space-y-2">
              <Label htmlFor="description">{t("products.description")}</Label>
              <div
                className="prose prose-sm max-w-none dark:prose-invert
                prose-headings:font-semibold
                prose-p:leading-relaxed
                prose-ul:list-disc prose-ul:pl-4
                prose-ol:list-decimal prose-ol:pl-4
                prose-li:my-1
                prose-strong:text-foreground
                prose-em:text-foreground/80
                prose-ul:marker:text-foreground
                prose-ol:marker:text-foreground"
              >
                <div className="quill-container">
                  <ReactQuill
                    theme="snow"
                    value={formData.description}
                    onChange={(value) =>
                      setFormData({ ...formData, description: value })
                    }
                    modules={{
                      toolbar: [
                        [{ header: [1, 2, 3, false] }],
                        ["bold", "italic", "underline", "strike"],
                        [{ list: "ordered" }, { list: "bullet" }],
                        ["clean"],
                      ],
                    }}
                    className="rtl-quill"
                    style={{
                      height: "auto",
                      minHeight: "200px",
                    }}
                    formats={[
                      "header",
                      "bold",
                      "italic",
                      "underline",
                      "strike",
                      "list",
                      "bullet",
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Archive Status */}
          <div className="rounded-md border p-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="archive-status"
                checked={formData.isArchived}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isArchived: checked })
                }
              />
              <Label htmlFor="archive-status" className="font-medium">
                Archive Product
              </Label>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Archived products will not be visible to customers
            </p>
          </div>

          {/* Wholesale Information */}
          <div className="rounded-md border p-4 space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="wholesale-info"
                checked={showWholesaleInfo}
                onCheckedChange={(checked) => {
                  setShowWholesaleInfo(checked);
                  if (!checked) {
                    setFormData({
                      ...formData,
                      wholesaleInfo: undefined,
                    });
                  } else if (!formData.wholesaleInfo) {
                    setFormData({
                      ...formData,
                      wholesaleInfo: {
                        supplierName: "",
                        supplierPhone: "",
                        supplierEmail: "",
                        supplierLocation: "",
                        purchasePrice: 0,
                        minimumOrderQuantity: 1,
                        notes: "",
                      },
                    });
                  }
                }}
              />
              <Label htmlFor="wholesale-info" className="font-medium">
                Wholesale Information
              </Label>
            </div>

            {showWholesaleInfo && formData.wholesaleInfo && (
              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                <div>
                  <label className="text-sm font-medium">Supplier Name *</label>
                  <Input
                    required
                    value={formData.wholesaleInfo.supplierName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        wholesaleInfo: {
                          ...formData.wholesaleInfo!,
                          supplierName: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Supplier Phone *
                  </label>
                  <Input
                    required
                    value={formData.wholesaleInfo.supplierPhone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        wholesaleInfo: {
                          ...formData.wholesaleInfo!,
                          supplierPhone: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Supplier User *</label>
                  <Input
                    required
                    type="text"
                    value={formData.wholesaleInfo.supplierEmail}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        wholesaleInfo: {
                          ...formData.wholesaleInfo!,
                          supplierEmail: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Supplier Location *
                  </label>
                  <Input
                    required
                    type="text"
                    value={formData.wholesaleInfo.supplierLocation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        wholesaleInfo: {
                          ...formData.wholesaleInfo!,
                          supplierLocation: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Purchase Price *
                  </label>
                  <Input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.wholesaleInfo.purchasePrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        wholesaleInfo: {
                          ...formData.wholesaleInfo!,
                          purchasePrice: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    الكمية التي تم شراؤها *
                  </label>
                  <Input
                    required
                    type="number"
                    min="0"
                    value={formData.wholesaleInfo?.purchasedQuantity || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        wholesaleInfo: {
                          ...formData.wholesaleInfo!,
                          purchasedQuantity: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea
                    value={formData.wholesaleInfo.notes || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        wholesaleInfo: {
                          ...formData.wholesaleInfo!,
                          notes: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* Expiration Date Section */}
          <div className="rounded-md border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">تاريخ انتهاء الصلاحية</h3>
              <Switch
                id="expiration-date"
                checked={!!formData.expirationDate}
                onCheckedChange={(checked) => {
                  if (checked) {
                    // Set default expiration date to 30 days from now if not set
                    const defaultDate = new Date();
                    defaultDate.setDate(defaultDate.getDate() + 30);
                    setFormData({
                      ...formData,
                      expirationDate: defaultDate.toISOString(),
                    });
                  } else {
                    setFormData({ ...formData, expirationDate: undefined });
                  }
                }}
              />
            </div>
            {formData.expirationDate && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.expirationDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.expirationDate ? (
                      format(new Date(formData.expirationDate), "PPP", {
                        locale: ar,
                      })
                    ) : (
                      <span>اختر تاريخ انتهاء الصلاحية</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      formData.expirationDate
                        ? new Date(formData.expirationDate)
                        : undefined
                    }
                    onSelect={(date) => {
                      if (date) {
                        setFormData({
                          ...formData,
                          expirationDate: date.toISOString(),
                        });
                      }
                    }}
                    initialFocus
                    locale={ar}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            )}
            <p className="text-sm text-muted-foreground">
              عند انتهاء الصلاحية، سيتم أرشفة المنتج تلقائياً ولن يظهر للعملاء
            </p>
          </div>

          {/* Product Sizes Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-medium">أحجام المنتج (اختياري)</h3>
                <p className="text-sm text-muted-foreground">
                  إضافة أحجام مختلفة للمنتج مع أسعارها المحددة
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSize}
                className="flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                إضافة حجم
              </Button>
            </div>

            {formData?.sizes && formData.sizes.length > 0 && (
              <div className="space-y-3">
                {formData.sizes.map((size, index) => (
                  <div key={size.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 border rounded-lg">
                    <div>
                      <label className="text-sm font-medium">اسم الحجم *</label>
                      <Input
                        placeholder="مثال: 16GB RAM"
                        value={size.label}
                        onChange={(e) => updateSize(index, 'label', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">السعر (ج.م) *</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={size.price}
                        onChange={(e) => updateSize(index, 'price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeSize(index)}
                        className="w-full"
                      >
                        <X className="h-4 w-4 mr-2" />
                        حذف
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Addons Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-medium">الإضافات الاختيارية</h3>
                <p className="text-sm text-muted-foreground">
                  إضافة خصائص اختيارية يمكن للعميل اختيارها
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAddon}
                className="flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                إضافة إضافة
              </Button>
            </div>

            {formData?.addons && formData.addons.length > 0 && (
              <div className="space-y-3">
                {formData.addons.map((addon, index) => (
                  <div key={addon.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 border rounded-lg">
                    <div>
                      <label className="text-sm font-medium">اسم الإضافة *</label>
                      <Input
                        placeholder="مثال: SSD 1TB"
                        value={addon.label}
                        onChange={(e) => updateAddon(index, 'label', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">السعر الإضافي (ج.م) *</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={addon.price_delta}
                        onChange={(e) => updateAddon(index, 'price_delta', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeAddon(index)}
                        className="w-full"
                      >
                        <X className="h-4 w-4 mr-2" />
                        حذف
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Base Cost Section */}
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-medium">التكلفة الأساسية (اختياري)</h3>
              <p className="text-sm text-muted-foreground">
                التكلفة الأساسية للمنتج لحساب الأرباح
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">التكلفة الأساسية (ج.م)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData?.costs?.base_cost || 0}
                onChange={(e) => setFormData(formData ? {
                  ...formData,
                  costs: { base_cost: parseFloat(e.target.value) || 0 }
                } : null)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              Save Changes
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
