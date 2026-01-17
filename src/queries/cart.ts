import groq from 'groq';

// Query to validate cart items and fetch current prices from Sanity
export const cartValidationQuery = groq`{
  "products": *[_type == "product" && _id in $productIds]{
    _id,
    name,
    price
  },
  "shop": *[_type == "shop" && _id == "shop"][0]{
    "bundles": bundles[slug.current in $bundleSlugs]{
      "id": slug.current,
      name,
      bottleCount,
      wineDiscounts[]{
        "productId": product->_id,
        "productName": product->name,
        "basePrice": product->price,
        discountPercent
      }
    },
    subscriptionPrice
  }
}`;
