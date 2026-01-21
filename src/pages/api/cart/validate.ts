import type { APIRoute } from 'astro';

export const prerender = false;

import { loadQuery } from '../../../utils/loadQuery';
import { cartValidationQuery } from '../../../queries/cart';
import type { CartItem, ValidatedCartItem } from '../../../types/cart';

interface SanityProduct {
  _id: string;
  name: string;
  price: number;
}

interface SanityBundle {
  id: string;
  name: string;
  price: number;
}

interface CartValidationResult {
  products: SanityProduct[];
  shop: {
    bundles: SanityBundle[];
  };
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const items: CartItem[] = body.items || [];

    if (!Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Coșul este gol',
          validatedItems: [],
          total: 0,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Extract IDs for products and slugs for bundles
    const productIds = items.filter((i) => i.type === 'product').map((i) => i.id);
    const bundleSlugs = items.filter((i) => i.type === 'bundle').map((i) => i.id);

    // Fetch current prices from Sanity
    const { data } = await loadQuery<CartValidationResult>({
      query: cartValidationQuery,
      params: {
        productIds: productIds.length > 0 ? productIds : ['__none__'],
        bundleSlugs: bundleSlugs.length > 0 ? bundleSlugs : ['__none__'],
      },
    });

    const validatedItems: ValidatedCartItem[] = [];
    const errors: string[] = [];
    let total = 0;

    for (const item of items) {
      let validatedPrice: number | null = null;
      let isValid = false;
      let error: string | undefined;

      if (item.type === 'product') {
        const sanityProduct = data?.products?.find((p) => p._id === item.id);
        if (sanityProduct) {
          validatedPrice = sanityProduct.price;
          isValid = true;
        } else {
          error = `Produsul "${item.name}" nu a fost găsit`;
          errors.push(error);
        }
      } else if (item.type === 'bundle') {
        const sanityBundle = data?.shop?.bundles?.find((b) => b.id === item.id);
        if (sanityBundle) {
          validatedPrice = sanityBundle.price;
          isValid = true;
        } else {
          error = `Pachetul "${item.name}" nu a fost găsit`;
          errors.push(error);
        }
      }

      const validatedItem: ValidatedCartItem = {
        ...item,
        validatedPrice: validatedPrice ?? item.price,
        isValid,
        error,
      };

      validatedItems.push(validatedItem);

      if (isValid && validatedPrice != null) {
        total += validatedPrice * item.quantity;
      }
    }

    return new Response(
      JSON.stringify({
        success: errors.length === 0,
        validatedItems,
        total,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Cart validation error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Eroare la validarea coșului',
        validatedItems: [],
        total: 0,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
