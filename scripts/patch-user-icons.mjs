import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '../src/shared/mocks/data')

const ROLE_ICON = {
  admin: '/static/images/users/admin.svg',
  inventory_manager: '/static/images/users/inventory.svg',
  laborant: '/static/images/users/laborant.svg',
  user: '/static/images/users/user.svg',
}

const users = JSON.parse(readFileSync(join(dataDir, 'users.json'), 'utf8'))
for (const u of users) {
  u.img = ROLE_ICON[u.role] ?? ROLE_ICON.user
  delete u.img_url
}
writeFileSync(join(dataDir, 'users.json'), `${JSON.stringify(users, null, 2)}\n`, 'utf8')
console.log(`Patched ${users.length} users`)
