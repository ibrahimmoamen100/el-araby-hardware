import { z } from "zod";

// Size schema for products
export const ProductSizeSchema = z.object({
  id: z.string(),
  label: z.string(),
  price: z.number(),
});

// Addon schema for products
export const ProductAddonSchema = z.object({
  id: z.string(),
  label: z.string(),
  price_delta: z.number(), // Additional price to add to base price
});

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  brand: z.string(),
  price: z.number(), // Base price when no sizes are defined
  category: z.string(),
  subcategory: z.string().optional(),
  merchant: z.string().optional(),
  color: z.string(),
  size: z.string(),
  images: z.array(z.string()),
  description: z.string(),
  specialOffer: z.boolean().optional().default(false),
  discountPercentage: z.number().optional(),
  discountPrice: z.number().optional(),
  offerEndsAt: z.string().optional(),
  isArchived: z.boolean(),
  createdAt: z
    .string()
    .optional()
    .default(() => new Date().toISOString()),
  expirationDate: z.string().optional(),
  // New fields for sizes and addons
  sizes: z.array(ProductSizeSchema).optional().default([]),
  addons: z.array(ProductAddonSchema).optional().default([]),
  costs: z.object({
    base_cost: z.number().optional(), // Base cost for profit calculation
  }).optional(),
  wholesaleInfo: z
    .object({
      supplierName: z.string(),
      supplierPhone: z.string(),
      supplierEmail: z.string(),
      supplierLocation: z.string(),
      purchasePrice: z.number(),
      purchasedQuantity: z.number(), // Changed from minimumOrderQuantity
      quantity: z.number(),
      notes: z.string().optional(),
    })
    .optional(),
});

export type Product = z.infer<typeof ProductSchema>;
export type ProductSize = z.infer<typeof ProductSizeSchema>;
export type ProductAddon = z.infer<typeof ProductAddonSchema>;

export const FilterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  supplier: z.string().optional(),
  sortBy: z
    .enum(["price-asc", "price-desc", "name-asc", "name-desc"])
    .optional(),
});

export type Filter = z.infer<typeof FilterSchema>;

// Cart item with selected options
export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: ProductSize; // Selected size option
  selectedAddons: ProductAddon[]; // Selected addons
  selectedColor?: string; // Selected color
  unitFinalPrice: number; // Final calculated price per unit
  totalPrice: number; // Final total price (unitFinalPrice * quantity)
}
