import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

const prefixes = ['photos/admin', 'muskan', 'random']

export async function listAllPhotos() {
  const results = await Promise.allSettled(
    prefixes.map((p) => supabase.storage.from('photos').list(p))
  )

  const photos = []
  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    if (result.status === 'rejected') continue
    const { data, error } = result.value
    if (error) continue
    const prefix = prefixes[i]
    for (const f of data || []) {
      if (f.metadata?.mimetype?.startsWith('image/')) {
        photos.push({
          id: `${prefix}/${f.name}`,
          name: f.name,
          url: supabase.storage.from('photos').getPublicUrl(`${prefix}/${f.name}`).data.publicUrl,
          created_at: f.created_at,
          prefix,
        })
      }
    }
  }
  photos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  return photos
}

export async function deletePhoto(id) {
  const { error } = await supabase.storage.from('photos').remove([id])
  return { error }
}

const INTIMATE_PREFIX = 'intimate'

export async function listIntimatePhotos() {
  const { data, error } = await supabase.storage.from('photos').list(INTIMATE_PREFIX)
  if (error) return []
  const photos = data
    .filter((f) => f.metadata?.mimetype?.startsWith('image/'))
    .map((f) => ({
      id: `${INTIMATE_PREFIX}/${f.name}`,
      name: f.name,
      url: supabase.storage.from('photos').getPublicUrl(`${INTIMATE_PREFIX}/${f.name}`).data.publicUrl,
      created_at: f.created_at,
    }))
  photos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  return photos
}

export async function uploadToIntimate(file) {
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const { error } = await supabase.storage.from('photos').upload(`${INTIMATE_PREFIX}/${fileName}`, file, {
    upsert: false,
  })
  if (error) throw error
  return `intimate/${fileName}`
}

export async function deleteIntimatePhoto(filePath) {
  const { error } = await supabase.storage.from('photos').remove([filePath])
  return { error }
}

export async function copyFromGalleryToIntimate(galleryPath) {
  const { data, error } = await supabase.storage.from('photos').download(galleryPath)
  if (error) throw error
  const fileName = galleryPath.split('/').pop()
  const file = new File([data], fileName, { type: data.type })
  return uploadToIntimate(file)
}
