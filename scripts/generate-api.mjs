/**
 * Генерация axios-клиента из server/docs/swagger.json (Swagger 2.0).
 * Запуск: npm run api:generate
 */
import { spawnSync } from 'node:child_process'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const clientRoot = join(__dirname, '..')
const swaggerPath = join(clientRoot, '..', 'server', 'docs', 'swagger.json')
const outputDir = join(clientRoot, 'src', 'shared', 'api', 'generated')

const args = [
  'swagger-typescript-api',
  'generate',
  '-p',
  swaggerPath,
  '-o',
  outputDir,
  '--axios',
  '--modular',
  '--module-name-first-tag',
  '--extract-request-params',
  '--extract-request-body',
  '--sort-types',
  '--sort-routes',
  '--clean-output',
  '--silent',
]

const result = spawnSync('npx', args, {
  cwd: clientRoot,
  stdio: 'inherit',
  shell: true,
})

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

/** Vite/Rolldown: интерфейсы из data-contracts должны импортироваться как type-only. */
function patchGeneratedImports() {
  const runtimeFromHttpClient = new Set(['HttpClient', 'ContentType'])

  for (const name of readdirSync(outputDir)) {
    if (!name.endsWith('.ts') || name === 'data-contracts.ts' || name === 'http-client.ts') continue

    const filePath = join(outputDir, name)
    let content = readFileSync(filePath, 'utf8')

    content = content.replace(
      /import\s+\{([^}]+)\}\s+from\s+["']\.\/data-contracts["'];?/g,
      'import type {$1} from "./data-contracts";',
    )

    content = content.replace(
      /import\s+\{([^}]+)\}\s+from\s+["']\.\/http-client["'];?/g,
      (_match, inner) => {
        const parts = inner
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
        const runtime = []
        const types = []
        for (const part of parts) {
          const id = part.replace(/^type\s+/, '')
          if (runtimeFromHttpClient.has(id)) runtime.push(id)
          else types.push(id)
        }
        const chunks = []
        if (runtime.length) chunks.push(runtime.join(', '))
        if (types.length) chunks.push(`type ${types.join(', type ')}`)
        return `import { ${chunks.join(', ')} } from "./http-client";`
      },
    )

    writeFileSync(filePath, content)
  }
}

patchGeneratedImports()
