export interface GalleryImage {
  _key: string
  mobileOnly: boolean
  image: {
    asset: {
      _id: string
      url: string
      metadata: {
        lqip?: string
        dimensions: {
          width: number
          height: number
        }
      }
    }
    alt: string
    hotspot?: any
    crop?: any
  }
}

export interface CategorizedImage extends GalleryImage {
  isSquare: boolean
  isRectangle: boolean
}

export function categorizeGalleryImages(images: GalleryImage[]): CategorizedImage[] {
  return images.map((item) => {
    const {width, height} = item.image.asset.metadata.dimensions
    const aspectRatio = width / height
    // Allow small tolerance for "square" detection (0.9 - 1.1)
    const isSquare = aspectRatio >= 0.9 && aspectRatio <= 1.1

    return {
      ...item,
      isSquare,
      isRectangle: !isSquare,
    }
  })
}

export function layoutGalleryImages(images: CategorizedImage[]) {
  // Desktop: all images except mobile-only
  const desktop = images.filter((img) => !img.mobileOnly)
  // Mobile: only squares and mobile-only images (no rectangles unless tagged mobile-only)
  const mobile = images.filter((img) => img.isSquare || img.mobileOnly)

  return {desktop, mobile}
}
