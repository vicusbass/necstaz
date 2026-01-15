import {defineType, defineField, defineArrayMember} from 'sanity'
import {BasketIcon} from '@sanity/icons'

export const shop = defineType({
  name: 'shop',
  title: 'Shop',
  type: 'document',
  icon: BasketIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Titlu pagina',
      type: 'string',
      initialValue: 'Shop',
    }),
    defineField({
      name: 'products',
      title: 'Produse',
      description: 'Drag and drop to reorder products',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'product'}],
        }),
      ],
    }),
    defineField({
      name: 'bundles',
      title: 'Pachete (Bundles)',
      type: 'array',
      validation: (rule) => rule.max(3),
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'name',
              title: 'Nume',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'slug',
              title: 'Slug',
              type: 'slug',
              options: {
                source: 'name',
                maxLength: 96,
              },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'heroName',
              title: 'Nume Hero',
              type: 'string',
              description: 'Numele care apare in sectiunea hero',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'description',
              title: 'Descriere',
              type: 'text',
              rows: 4,
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'price',
              title: 'Pret',
              type: 'number',
              description: 'Pret in LEI',
              validation: (rule) => rule.required().positive().precision(2),
            }),
          ],
          preview: {
            select: {
              title: 'name',
              price: 'price',
            },
            prepare({title, price}) {
              return {
                title,
                subtitle: `${price?.toFixed(2) || '0.00'} LEI`,
              }
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'customProductPrice',
      title: 'Pret produs personalizat',
      type: 'number',
      description: 'Pret in LEI pentru optiunea de produs personalizat',
      validation: (rule) => rule.required().positive().precision(2),
    }),
    defineField({
      name: 'subscriptionPrice',
      title: 'Pret abonament',
      type: 'number',
      description: 'Pret in LEI pentru optiunea de abonament',
      validation: (rule) => rule.required().positive().precision(2),
    }),
    defineField({
      name: 'shippingPrice',
      title: 'Cost livrare',
      type: 'number',
      description: 'Cost fix de livrare in LEI',
      validation: (rule) => rule.required().min(0).precision(2),
    }),
    defineField({
      name: 'freeShippingThreshold',
      title: 'Prag livrare gratuită',
      type: 'number',
      description: 'Suma minimă în LEI pentru livrare gratuită (fără SGR)',
      validation: (rule) => rule.required().min(0).precision(2),
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({title}) {
      return {
        title: title || 'Shop',
      }
    },
  },
})
