import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  './packages/select/vite.config.ts',
  './packages/react-select/vite.config.ts',
  './packages/solid-select/vite.config.ts',
])
