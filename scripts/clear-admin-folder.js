import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map((l) => {
      const [k, ...v] = l.split('=')
      return [k.trim(), v.join('=').trim()]
    })
)

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_KEY)
const BUCKET = 'photos'
const PREFIX = 'photos/admin'

const { data: files, error } = await supabase.storage.from(BUCKET).list(PREFIX)
if (error) {
  console.error('Failed to list files:', error.message)
  process.exit(1)
}

if (!files || files.length === 0) {
  console.log('No files found in photos/admin. Nothing to delete.')
  process.exit(0)
}

const paths = files.map((f) => `${PREFIX}/${f.name}`)
console.log(`Deleting ${paths.length} file(s) from ${PREFIX}...`)

const { error: removeError } = await supabase.storage.from(BUCKET).remove(paths)
if (removeError) {
  console.error('Failed to delete files:', removeError.message)
  process.exit(1)
}

console.log(`Successfully deleted ${paths.length} file(s).`)
paths.forEach((p) => console.log(`  - ${p}`))
