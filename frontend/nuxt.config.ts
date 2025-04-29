import { defineNuxtConfig } from 'nuxt/config';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  
  // Runtime Config
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'https://financialliteracy.onrender.com/api' // Default to Render URL
    }
  },
  
  // API proxy configuration
  nitro: {
    devProxy: {
      '/api': {
        target: 'https://financialliteracy.onrender.com/api/',
        changeOrigin: true,
        prependPath: false
      }
    }
  },
  
  // CSS configuration
  css: ['~/assets/css/main.css'],
  
  // PostCSS configuration removed - handled by @nuxtjs/tailwindcss
  // postcss: {
  //   plugins: {
  //     tailwindcss: {},
  //     autoprefixer: {}
  //   }
  // },
  
  // App config
  app: {
    head: {
      title: 'Financial Literacy',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'A financial literacy application to help you learn about stocks and investing.' }
      ]
    }
  }
})
