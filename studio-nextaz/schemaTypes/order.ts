import {defineType, defineField} from 'sanity'

export const order = defineType({
  name: 'order',
  title: 'Comandă',
  type: 'document',
  fields: [
    defineField({
      name: 'orderId',
      title: 'ID Comandă',
      type: 'string',
      validation: (rule) => rule.required(),
      readOnly: true,
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'În așteptare', value: 'pending'},
          {title: 'Plătită', value: 'paid'},
          {title: 'Eșuată', value: 'failed'},
          {title: 'Anulată', value: 'cancelled'},
        ],
        layout: 'radio',
      },
      initialValue: 'pending',
    }),
    defineField({
      name: 'customerType',
      title: 'Tip client',
      type: 'string',
      options: {
        list: [
          {title: 'Persoană fizică', value: 'person'},
          {title: 'Persoană juridică', value: 'company'},
        ],
      },
    }),
    defineField({
      name: 'customer',
      title: 'Date client',
      type: 'object',
      fields: [
        defineField({
          name: 'email',
          title: 'Email',
          type: 'string',
        }),
        defineField({
          name: 'phone',
          title: 'Telefon',
          type: 'string',
        }),
        defineField({
          name: 'firstName',
          title: 'Prenume',
          type: 'string',
        }),
        defineField({
          name: 'lastName',
          title: 'Nume',
          type: 'string',
        }),
        defineField({
          name: 'companyName',
          title: 'Denumire firmă',
          type: 'string',
        }),
        defineField({
          name: 'cui',
          title: 'CUI',
          type: 'string',
        }),
        defineField({
          name: 'contactPerson',
          title: 'Persoană de contact',
          type: 'string',
        }),
        defineField({
          name: 'deliveryAddress',
          title: 'Adresa de livrare',
          type: 'object',
          fields: [
            {name: 'street', title: 'Stradă', type: 'string'},
            {name: 'city', title: 'Oraș', type: 'string'},
            {name: 'county', title: 'Județ', type: 'string'},
            {name: 'postalCode', title: 'Cod poștal', type: 'string'},
            {name: 'country', title: 'Țară', type: 'string'},
          ],
        }),
        defineField({
          name: 'billingAddress',
          title: 'Adresa de facturare',
          type: 'object',
          fields: [
            {name: 'street', title: 'Stradă', type: 'string'},
            {name: 'city', title: 'Oraș', type: 'string'},
            {name: 'county', title: 'Județ', type: 'string'},
            {name: 'postalCode', title: 'Cod poștal', type: 'string'},
            {name: 'country', title: 'Țară', type: 'string'},
          ],
        }),
      ],
    }),
    defineField({
      name: 'items',
      title: 'Produse',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {name: 'id', title: 'ID Produs', type: 'string'},
            {
              name: 'type',
              title: 'Tip',
              type: 'string',
              options: {list: ['product', 'bundle', 'subscription']},
            },
            {name: 'name', title: 'Nume', type: 'string'},
            {name: 'price', title: 'Preț', type: 'number'},
            {name: 'quantity', title: 'Cantitate', type: 'number'},
          ],
          preview: {
            select: {
              title: 'name',
              quantity: 'quantity',
              price: 'price',
            },
            prepare({title, quantity, price}) {
              return {
                title: title || 'Produs',
                subtitle: `${quantity}x - ${price?.toFixed(2)} lei`,
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'total',
      title: 'Total',
      type: 'number',
      validation: (rule) => rule.required().min(0),
    }),
    defineField({
      name: 'netopiaId',
      title: 'Netopia Transaction ID',
      type: 'string',
    }),
    defineField({
      name: 'createdAt',
      title: 'Data creării',
      type: 'datetime',
      readOnly: true,
    }),
    defineField({
      name: 'notes',
      title: 'Note',
      type: 'text',
    }),
  ],
  preview: {
    select: {
      orderId: 'orderId',
      status: 'status',
      total: 'total',
      customerEmail: 'customer.email',
    },
    prepare({orderId, status, total, customerEmail}) {
      const statusLabels: Record<string, string> = {
        pending: '⏳ În așteptare',
        paid: '✓ Plătită',
        failed: '✗ Eșuată',
        cancelled: '⊘ Anulată',
      }
      return {
        title: `#${orderId || 'New'}`,
        subtitle: `${statusLabels[status] || status} - ${total?.toFixed(2)} lei - ${customerEmail || 'No email'}`,
      }
    },
  },
  orderings: [
    {
      title: 'Data (cele mai recente)',
      name: 'createdAtDesc',
      by: [{field: 'createdAt', direction: 'desc'}],
    },
    {
      title: 'Status',
      name: 'statusAsc',
      by: [{field: 'status', direction: 'asc'}],
    },
  ],
})
