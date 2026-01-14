import { atom, computed } from 'nanostores';
import type { CartItem, CartState } from '../types/cart';

const CART_STORAGE_KEY = 'necstaz_cart';

// Load initial state from localStorage
function loadCartFromStorage(): CartState {
  if (typeof window === 'undefined') {
    return { items: [], lastUpdated: Date.now() };
  }

  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as CartState;
      if (Array.isArray(parsed.items)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load cart from storage:', e);
  }

  return { items: [], lastUpdated: Date.now() };
}

// Save to localStorage
function saveCartToStorage(state: CartState): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save cart to storage:', e);
  }
}

// Main cart atom - initialized lazily on client
export const cartState = atom<CartState>({ items: [], lastUpdated: Date.now() });

// Initialize cart from localStorage when on client
export function initializeCart(): void {
  if (typeof window !== 'undefined') {
    const stored = loadCartFromStorage();
    cartState.set(stored);
  }
}

// Subscribe to changes and persist
let isSubscribed = false;
export function subscribeToCartChanges(): void {
  if (isSubscribed || typeof window === 'undefined') return;
  isSubscribed = true;

  cartState.subscribe((state) => {
    saveCartToStorage(state);
  });
}

// Computed: cart items array
export const cartItems = computed(cartState, (state) => state.items);

// Computed: total item count
export const cartCount = computed(cartState, (state) =>
  state.items.reduce((sum, item) => sum + item.quantity, 0)
);

// Computed: total price (client-side, for display only)
export const cartTotal = computed(cartState, (state) =>
  state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

// Computed: is cart empty
export const isCartEmpty = computed(cartState, (state) => state.items.length === 0);

// Actions
export function addToCart(item: Omit<CartItem, 'quantity'>, quantity = 1): void {
  const current = cartState.get();
  const existingIndex = current.items.findIndex(
    (i) => i.id === item.id && i.type === item.type
  );

  let newItems: CartItem[];

  if (existingIndex >= 0) {
    // Update quantity
    newItems = current.items.map((i, idx) =>
      idx === existingIndex ? { ...i, quantity: i.quantity + quantity } : i
    );
  } else {
    // Add new item
    newItems = [...current.items, { ...item, quantity }];
  }

  cartState.set({ items: newItems, lastUpdated: Date.now() });
}

export function removeFromCart(id: string, type: CartItem['type']): void {
  const current = cartState.get();
  const newItems = current.items.filter((i) => !(i.id === id && i.type === type));
  cartState.set({ items: newItems, lastUpdated: Date.now() });
}

export function updateQuantity(id: string, type: CartItem['type'], quantity: number): void {
  if (quantity <= 0) {
    removeFromCart(id, type);
    return;
  }

  const current = cartState.get();
  const newItems = current.items.map((i) =>
    i.id === id && i.type === type ? { ...i, quantity } : i
  );
  cartState.set({ items: newItems, lastUpdated: Date.now() });
}

export function clearCart(): void {
  cartState.set({ items: [], lastUpdated: Date.now() });
}

// Toast notification state
export const toastMessage = atom<string | null>(null);
export const toastVisible = atom<boolean>(false);

let toastTimeout: ReturnType<typeof setTimeout> | null = null;

export function showToast(message: string, duration = 3000): void {
  // Clear any existing timeout
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  toastMessage.set(message);
  toastVisible.set(true);

  toastTimeout = setTimeout(() => {
    toastVisible.set(false);
    // Clear message after fade out animation
    setTimeout(() => {
      toastMessage.set(null);
    }, 300);
  }, duration);
}

export function hideToast(): void {
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }
  toastVisible.set(false);
  setTimeout(() => {
    toastMessage.set(null);
  }, 300);
}

// Format price for display (Romanian format)
export function formatPrice(price: number): string {
  return price.toFixed(2).replace('.', ',') + ' lei';
}
