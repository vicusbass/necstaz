// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import sanity from '@sanity/astro';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    
  },

  integrations: [sanity({
    projectId: 'b7hk81le',
    dataset: 'production',
    useCdn: false
  }), react()]
});