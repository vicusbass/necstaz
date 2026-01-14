// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import sanity from '@sanity/astro';
import react from '@astrojs/react';
import svelte from '@astrojs/svelte';

import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: 'https://nextaz.vercel.app',

  vite: {
    plugins: [tailwindcss()],
    
  },

  integrations: [sanity({
    projectId: 'vrxix2id',
    dataset: 'production',
    useCdn: false
  }), react(), svelte()],

  adapter: vercel()
});