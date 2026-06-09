import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = join(root, 'src/shared/mocks/data')

const CATEGORY_ICON_BY_ID = Object.fromEntries(
  Array.from({ length: 20 }, (_, i) => {
    const id = i + 1
    const slug = [
      'noutbuki',
      'sistemnye-bloki',
      'monitory',
      'printery-mfu',
      'setevoe-oborudovanie',
      'proektory',
      'servery',
      'ibp',
      'periferiya',
      'planshety',
      'skanery',
      'kamery',
      'audiotehnika',
      'interaktivnye-doski',
      'laboratornye-stendy',
      'izmeritelnye-pribory',
      'kabeli',
      'kartridzhi',
      'nositeli',
      'kancelyariya',
    ][i]
    return [id, `/static/images/category-icons/category-${String(id).padStart(2, '0')}-${slug}.svg`]
  }),
)

function loadJson(name) {
  return JSON.parse(readFileSync(join(dataDir, name), 'utf8'))
}

function saveJson(name, data) {
  writeFileSync(join(dataDir, name), `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

const types = loadJson('types.json')
for (const t of types) {
  t.img = CATEGORY_ICON_BY_ID[t.id] ?? ''
}
saveJson('types.json', types)

const models = loadJson('models.json')
for (const m of models) {
  m.img = CATEGORY_ICON_BY_ID[m.type_id] ?? ''
}
saveJson('models.json', models)

const modelTypeById = Object.fromEntries(models.map((m) => [m.id, m.type_id]))
const instances = loadJson('instances.json')
for (const i of instances) {
  const typeId = modelTypeById[i.model_id]
  i.img = typeId != null ? (CATEGORY_ICON_BY_ID[typeId] ?? '') : ''
}
saveJson('instances.json', instances)

console.log(`Patched ${types.length} types, ${models.length} models, ${instances.length} instances`)
