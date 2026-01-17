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
              name: 'bottleCount',
              title: 'Numar sticle',
              type: 'number',
              description: 'Numarul minim de sticle pentru acest pachet (ex: 60, 120, 180)',
              validation: (rule) => rule.required().positive().integer(),
            }),
            defineField({
              name: 'wineDiscounts',
              title: 'Reduceri pe vin',
              type: 'array',
              description: 'Procentul de reducere pentru fiecare vin din catalog',
              validation: (rule) => rule.required(),
              of: [
                defineArrayMember({
                  type: 'object',
                  fields: [
                    defineField({
                      name: 'product',
                      title: 'Produs (Vin)',
                      type: 'reference',
                      to: [{type: 'product'}],
                      options: {
                        filter: 'productType == "single"',
                      },
                      validation: (rule) => rule.required(),
                    }),
                    defineField({
                      name: 'discountPercent',
                      title: 'Procent reducere (%)',
                      type: 'number',
                      description: 'Procentul de reducere (ex: 10 pentru 10%)',
                      validation: (rule) => rule.required().min(0).max(100),
                    }),
                  ],
                  preview: {
                    select: {
                      productName: 'product.name',
                      discount: 'discountPercent',
                    },
                    prepare({productName, discount}) {
                      return {
                        title: productName || 'Vin neselectat',
                        subtitle: `${discount || 0}% reducere`,
                      }
                    },
                  },
                }),
              ],
            }),
          ],
          preview: {
            select: {
              title: 'name',
              bottleCount: 'bottleCount',
            },
            prepare({title, bottleCount}) {
              return {
                title,
                subtitle: `${bottleCount || 0} sticle`,
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
