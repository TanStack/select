import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateReferenceDocs } from '@tanstack/config/typedoc'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

/** @type {import('@tanstack/config/typedoc').Package[]} */
const packages = [
  {
    name: 'select',
    entryPoints: [resolve(__dirname, '../packages/select/src/index.ts')],
    tsconfig: resolve(__dirname, '../packages/select/tsconfig.docs.json'),
    outputDir: resolve(__dirname, '../docs/reference'),
  },
  {
    name: 'react-select',
    entryPoints: [resolve(__dirname, '../packages/react-select/src/index.ts')],
    tsconfig: resolve(__dirname, '../packages/react-select/tsconfig.docs.json'),
    outputDir: resolve(__dirname, '../docs/framework/react/reference'),
    exclude: ['packages/select/**/*'],
  },
  {
    name: 'solid-select',
    entryPoints: [resolve(__dirname, '../packages/solid-select/src/index.ts')],
    tsconfig: resolve(__dirname, '../packages/solid-select/tsconfig.docs.json'),
    outputDir: resolve(__dirname, '../docs/framework/solid/reference'),
    exclude: ['packages/select/**/*'],
  },
]

await generateReferenceDocs({ packages })

process.exit(0)
