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

export interface CartState {
  items: CartItem[];
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

// Order types (for Sanity)
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled';

export interface OrderItem {
  id: string;
  type: CartItemType;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  orderId: string;
  status: OrderStatus;
  customer: Customer;
  items: OrderItem[];
  total: number;
  netopiaId?: string;
  createdAt: string;
}

// Payment types
export interface PaymentInitRequest {
  customer: Customer;
  cartItems: CartItem[];
  orderNotes?: string;
}

export interface PaymentInitResponse {
  success: boolean;
  paymentUrl?: string;
  orderId?: string;
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
