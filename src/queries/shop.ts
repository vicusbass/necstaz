import groq from 'groq';

export const shopQuery = groq`
  *[_type == "shop" && _id == "shop"][0]{
    title,
    products[]->{
      _id,
      name,
      slug,
      productType,
      image,
      description,
      price
    },
    bundles[]{
      name,
      slug,
      heroName,
      description,
      bottleCount,
      wineDiscounts[]{
        "productId": product->_id,
        "productName": product->name,
        "basePrice": product->price,
        "image": product->image,
        discountPercent
      }
    },
    customProductPrice
  }
`;
