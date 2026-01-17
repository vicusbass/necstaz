import { atom, computed } from 'nanostores';
import type { BundleConfig, BundleWineSelection, BundleCartItem } from '../types/cart';

export interface BundleConfiguratorState {
  isOpen: boolean;
  bundleConfig: BundleConfig | null;
  selections: Record<string, number>; // productId -> quantity
  editingBundleId: string | null; // If editing existing bundle in cart
}

// Main configurator state
export const configuratorState = atom<BundleConfiguratorState>({
  isOpen: false,
  bundleConfig: null,
  selections: {},
  editingBundleId: null,
});

// Open configurator for new bundle
export function openConfigurator(bundleConfig: BundleConfig): void {
  // Initialize all wines with 0 quantity
  const initialSelections: Record<string, number> = {};
  bundleConfig.wineDiscounts.forEach((wine) => {
    initialSelections[wine.productId] = 0;
  });

  configuratorState.set({
    isOpen: true,
    bundleConfig,
    selections: initialSelections,
    editingBundleId: null,
  });
}

// Open configurator to edit existing bundle in cart
export function editBundle(
  bundleId: string,
  bundleConfig: BundleConfig,
  existingSelections: BundleWineSelection[]
): void {
  // Initialize with existing selections
  const selections: Record<string, number> = {};

  // First set all wines to 0
  bundleConfig.wineDiscounts.forEach((wine) => {
    selections[wine.productId] = 0;
  });

  // Then populate with existing selections
  existingSelections.forEach((sel) => {
    selections[sel.productId] = sel.quantity;
  });

  configuratorState.set({
    isOpen: true,
    bundleConfig,
    selections,
    editingBundleId: bundleId,
  });
}

// Close configurator without saving
export function closeConfigurator(): void {
  configuratorState.set({
    isOpen: false,
    bundleConfig: null,
    selections: {},
    editingBundleId: null,
  });
}

// Update wine quantity
export function setWineQuantity(productId: string, quantity: number): void {
  const current = configuratorState.get();
  configuratorState.set({
    ...current,
    selections: {
      ...current.selections,
      [productId]: Math.max(0, quantity),
    },
  });
}

// Increment wine quantity
export function incrementWineQuantity(productId: string): void {
  const current = configuratorState.get();
  const currentQty = current.selections[productId] || 0;
  setWineQuantity(productId, currentQty + 1);
}

// Decrement wine quantity
export function decrementWineQuantity(productId: string): void {
  const current = configuratorState.get();
  const currentQty = current.selections[productId] || 0;
  if (currentQty > 0) {
    setWineQuantity(productId, currentQty - 1);
  }
}

// Computed: total bottles selected
export const totalBottlesSelected = computed(configuratorState, (state) =>
  Object.values(state.selections).reduce((sum, qty) => sum + qty, 0)
);

// Computed: is configuration valid (meets bottle requirement)
export const isConfigurationValid = computed(configuratorState, (state) => {
  if (!state.bundleConfig) return false;
  const total = Object.values(state.selections).reduce((sum, qty) => sum + qty, 0);
  return total === state.bundleConfig.bottleCount;
});

// Computed: bottles remaining to reach target
export const bottlesRemaining = computed(configuratorState, (state) => {
  if (!state.bundleConfig) return 0;
  const total = Object.values(state.selections).reduce((sum, qty) => sum + qty, 0);
  return Math.max(0, state.bundleConfig.bottleCount - total);
});

// Computed: total price of current selection
export const selectionTotalPrice = computed(configuratorState, (state) => {
  if (!state.bundleConfig) return 0;

  return state.bundleConfig.wineDiscounts.reduce((sum, wine) => {
    const quantity = state.selections[wine.productId] || 0;
    const discountedPrice = wine.basePrice * (1 - wine.discountPercent / 100);
    return sum + discountedPrice * quantity;
  }, 0);
});

// Build BundleCartItem from current selections
export function buildBundleCartItem(): BundleCartItem | null {
  const state = configuratorState.get();
  if (!state.bundleConfig) return null;

  const selections: BundleWineSelection[] = state.bundleConfig.wineDiscounts
    .filter((wine) => (state.selections[wine.productId] || 0) > 0)
    .map((wine) => ({
      productId: wine.productId,
      productName: wine.productName,
      basePrice: wine.basePrice,
      discountPercent: wine.discountPercent,
      discountedPrice: wine.basePrice * (1 - wine.discountPercent / 100),
      quantity: state.selections[wine.productId],
      image: wine.image,
    }));

  const totalPrice = selections.reduce((sum, sel) => sum + sel.discountedPrice * sel.quantity, 0);
  const bottleCount = selections.reduce((sum, sel) => sum + sel.quantity, 0);

  // Generate unique ID - use existing if editing, otherwise create new
  const id = state.editingBundleId || `${state.bundleConfig.slug}-${Date.now()}`;

  return {
    id,
    type: 'bundle',
    bundleSlug: state.bundleConfig.slug,
    name: state.bundleConfig.name,
    bottleCount,
    selections,
    totalPrice,
  };
}
