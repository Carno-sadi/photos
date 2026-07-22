import { openDB } from 'idb'

const DB_NAME = 'intimate-db'
const DB_VERSION = 1

let dbPromise = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('media_items')) {
          const store = db.createObjectStore('media_items', { keyPath: 'id' })
          store.createIndex('entityId', 'entityId')
          store.createIndex('tags', 'tags', { multiEntry: true })
          store.createIndex('createdAt', 'createdAt')
        }
        if (!db.objectStoreNames.contains('playlists')) {
          db.createObjectStore('playlists', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('session_config')) {
          db.createObjectStore('session_config', { keyPath: 'key' })
        }
      },
    })
  }
  return dbPromise
}

export async function addMediaItem(item) {
  const db = await getDb()
  return db.add('media_items', item)
}

export async function putMediaItem(item) {
  const db = await getDb()
  return db.put('media_items', item)
}

export async function getAllMedia(entityId = 'default') {
  const db = await getDb()
  return db.getAllFromIndex('media_items', 'entityId', entityId)
}

export async function getMediaById(id) {
  const db = await getDb()
  return db.get('media_items', id)
}

export async function deleteMedia(id) {
  const db = await getDb()
  return db.delete('media_items', id)
}

export async function updateMediaTags(id, tags) {
  const db = await getDb()
  const item = await db.get('media_items', id)
  if (item) {
    item.tags = tags
    return db.put('media_items', item)
  }
}

export async function getRandomMedia(entityId = 'default') {
  const db = await getDb()
  const all = await db.getAllFromIndex('media_items', 'entityId', entityId)
  if (all.length === 0) return null
  return all[Math.floor(Math.random() * all.length)]
}

export async function fetchImageAsBlob(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Failed to fetch image')
  return response.blob()
}

export async function importFromUrl(url, name, tags = [], entityId = 'default') {
  const blobData = await fetchImageAsBlob(url)
  const id = crypto.randomUUID()
  const item = {
    id,
    entityId,
    blobData,
    mimeType: blob.type,
    tags,
    name,
    createdAt: Date.now(),
  }
  await addMediaItem(item)
  return id
}

export async function savePlaylist(playlist) {
  const db = await getDb()
  return db.put('playlists', playlist)
}

export async function getPlaylists() {
  const db = await getDb()
  return db.getAll('playlists')
}

export async function deletePlaylist(id) {
  const db = await getDb()
  return db.delete('playlists', id)
}

export async function getSessionConfig(key) {
  const db = await getDb()
  const result = await db.get('session_config', key)
  return result ? result.value : null
}

export async function setSessionConfig(key, value) {
  const db = await getDb()
  return db.put('session_config', { key, value })
}
