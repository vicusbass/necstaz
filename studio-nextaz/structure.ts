import type {StructureResolver} from 'sanity/structure'
import {BasketIcon, ImagesIcon} from '@sanity/icons'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      // Shop singleton
      S.listItem()
        .title('Shop')
        .icon(BasketIcon)
        .child(S.document().schemaType('shop').documentId('shop')),

      // Gallery singleton
      S.listItem()
        .title('Galerie')
        .icon(ImagesIcon)
        .child(S.document().schemaType('galleryPage').documentId('galleryPage')),

      S.divider(),

      // Products list
      ...S.documentTypeListItems().filter(
        (listItem) => !['shop', 'galleryPage'].includes(listItem.getId() ?? '')
      ),
    ])
