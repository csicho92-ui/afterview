/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// SINGLE=1 빌드는 미리보기용 단일 HTML 파일을 만든다.
const single = process.env.SINGLE === '1'

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), ...(single ? [viteSingleFile()] : [])],
  build: single ? { outDir: 'dist-single' } : undefined,
  test: { include: ['tests/**/*.test.{ts,tsx}'] },
})
