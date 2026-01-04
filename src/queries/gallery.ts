import groq from 'groq'

export const galleryQuery = groq`
  *[_type == "galleryPage" && _id == "galleryPage"][0]{
    images[]{
      _key,
      mobileOnly,
      image {
        asset->{
          _id,
          url,
          metadata {
            lqip,
            dimensions { width, height }
          }
        },
        alt,
        hotspot,
        crop
      }
    }
  }
`
