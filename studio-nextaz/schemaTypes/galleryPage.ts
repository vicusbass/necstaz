import {defineType, defineField, defineArrayMember} from 'sanity'
import {ImagesIcon} from '@sanity/icons'

export const galleryPage = defineType({
  name: 'galleryPage',
  title: 'Pagină Galerie',
  type: 'document',
  icon: ImagesIcon,
  fields: [
    defineField({
      name: 'images',
      title: 'Imagini Galerie',
      type: 'array',
      description:
        'Imaginile dreptunghiulare se afișează pe toată lățimea pe desktop. Imaginile pătrate se afișează câte două pe rând. Folosește "Doar pe Mobil" pentru versiuni pătrate ale imaginilor dreptunghiulare.',
      of: [defineArrayMember({type: 'galleryImage'})],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Galerie',
      }
    },
  },
})
