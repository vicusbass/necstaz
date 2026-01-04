import {defineType, defineField} from 'sanity'
import {ImagesIcon} from '@sanity/icons'

export const galleryImage = defineType({
  name: 'galleryImage',
  title: 'Gallery Image',
  type: 'object',
  icon: ImagesIcon,
  fields: [
    defineField({
      name: 'image',
      title: 'Imagine',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Text Alternativ',
          validation: (rule) =>
            rule.required().warning('Textul alternativ este important pentru accesibilitate'),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'mobileOnly',
      title: 'Doar pe Mobil',
      type: 'boolean',
      description: 'Afișează această imagine doar pe dispozitive mobile (ascunsă pe desktop)',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'image.alt',
      media: 'image',
      mobileOnly: 'mobileOnly',
      dimensions: 'image.asset.metadata.dimensions',
    },
    prepare({title, media, mobileOnly, dimensions}) {
      const aspectRatio = dimensions
        ? (dimensions.width / dimensions.height).toFixed(2)
        : null
      const orientation =
        aspectRatio && parseFloat(aspectRatio) > 1.1 ? '📐 Rectangle' : '⬜ Square'

      return {
        title: title || 'Untitled',
        subtitle: mobileOnly ? '📱 Mobile Only' : orientation,
        media,
      }
    },
  },
})
