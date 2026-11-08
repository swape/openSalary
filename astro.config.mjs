import { defineConfig, fontProviders } from 'astro/config'

export default defineConfig({
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'DM Sans',
      cssVariable: '--font-dm-sans',
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'IBM Plex Mono',
      cssVariable: '--font-ibm-plex-mono',
      weights: [400, 500],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['monospace'],
    },
    {
      provider: fontProviders.googleicons(),
      name: 'Material Symbols Rounded',
      cssVariable: '--font-material-symbols-rounded',
      weights: [400],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['sans-serif'],
      options: {
        experimental: {
          glyphs: ['zoom_in', 'zoom_out', 'restart_alt', 'keyboard_arrow_down'],
        },
      },
    },
  ],
})
