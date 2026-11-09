import {defineConfig} from 'vite';
export default defineConfig({base:'./',publicDir:'public',build:{outDir:'dist',rollupOptions:{input:{main:'index.html',standalone:'energyhub.html'}}}});
