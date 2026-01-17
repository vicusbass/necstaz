// Cart item types
export type CartItemType = 'product' | 'bundle' | 'subscription';

export interface CartItem {
  id: string; // Sanity _id for products, slug for bundles
  type: CartItemType;
  name: string;
  price: number; // Client-side price (display only - NOT used for payment)
  quantity: number;
  image?: string; // Optional image URL for cart display
}

// Wine selection within a configured bundle
export interface BundleWineSelection {
  productId: string; // Sanity _id of the wine product
  productName: string;
  basePrice: number; // Original wine price
  discountPercent: number; // Discount from bundle config
  discountedPrice: number; // Calculated: basePrice * (1 - discountPercent/100)
  quantity: number; // Number of bottles selected
  image?: string;
}

// Bundle configuration from Sanity
export interface BundleConfig {
  slug: string; // bundle-1, bundle-2, bundle-3
  name: string;
  heroName: string;
  description: string;
  bottleCount: number; // Required total bottles (60, 120, 180)
  wineDiscounts: Array<{
    productId: string;
    productName: string;
    basePrice: number;
    discountPercent: number;
    image?: string;
  }>;
}

// Configured bundle item in cart
export interface BundleCartItem {
  id: string; // Unique ID for this cart item
  type: 'bundle';
  bundleSlug: string; // bundle-1, bundle-2, bundle-3
  name: string; // Bundle display name
  bottleCount: number; // Total bottles in this bundle
  selections: BundleWineSelection[]; // Only wines with quantity > 0
  totalPrice: number; // Calculated sum of discounted prices * quantities
}

// Union type for all cart item types
export type AnyCartItem = CartItem | BundleCartItem;

export interface CartState {
  items: AnyCartItem[];
  lastUpdated: number;
}

// Validated cart item (server-side)
export interface ValidatedCartItem extends CartItem {
  validatedPrice: number; // Server-verified price from Sanity
  isValid: boolean;
  error?: string;
}

// Checkout types
export type CustomerType = 'person' | 'company';

export interface Address {
  street: string;
  city: string;
  county: string;
  postalCode: string;
  country: string; // Default: 'Romania'
}

export interface PersonCustomer {
  type: 'person';
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  deliveryAddress: Address;
  billingAddress: Address;
  sameAddress: boolean;
}

export interface CompanyCustomer {
  type: 'company';
  email: string;
  phone: string;
  companyName: string;
  cui: string; // Romanian Tax ID
  contactPerson: string;
  deliveryAddress: Address;
  billingAddress: Address;
  sameAddress: boolean;
}

export type Customer = PersonCustomer | CompanyCustomer;

// Note: Order types (OrderStatus, OrderItem, Order) are now in src/lib/database.types.ts

// Payment types
export interface PaymentInitRequest {
  customer: Customer;
  cartItems: CartItem[];
  orderNotes?: string;
}

export interface PaymentInitResponse {
  success: boolean;
  paymentUrl?: string;
  orderNumber?: string;
  error?: string;
}

// Romanian counties for dropdown
export const ROMANIAN_COUNTIES = [
  'Alba',
  'Arad',
  'Argeș',
  'Bacău',
  'Bihor',
  'Bistrița-Năsăud',
  'Botoșani',
  'Brașov',
  'Brăila',
  'București',
  'Buzău',
  'Caraș-Severin',
  'Călărași',
  'Cluj',
  'Constanța',
  'Covasna',
  'Dâmbovița',
  'Dolj',
  'Galați',
  'Giurgiu',
  'Gorj',
  'Harghita',
  'Hunedoara',
  'Ialomița',
  'Iași',
  'Ilfov',
  'Maramureș',
  'Mehedinți',
  'Mureș',
  'Neamț',
  'Olt',
  'Prahova',
  'Satu Mare',
  'Sălaj',
  'Sibiu',
  'Suceava',
  'Teleorman',
  'Timiș',
  'Tulcea',
  'Vaslui',
  'Vâlcea',
  'Vrancea',
] as const;

export type RomanianCounty = (typeof ROMANIAN_COUNTIES)[number];
