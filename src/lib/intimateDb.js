import { openDB } from 'idb'

const DB_NAME = 'intimate-db'
const DB_VERSION = 2

let dbPromise = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('metatags')) {
          const store = db.createObjectStore('metatags', { keyPath: 'id' })
          store.createIndex('tag', 'tags', { multiEntry: true })
        }
        if (!db.objectStoreNames.contains('playlists')) {
          db.createObjectStore('playlists', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('session_config')) {
          db.createObjectStore('session_config', { keyPath: 'key' })
        }
        if (db.objectStoreNames.contains('media_items')) {
          db.deleteObjectStore('media_items')
        }
      },
    })
  }
  return dbPromise
}

export async function getTags(id) {
  const db = await getDb()
  const entry = await db.get('metatags', id)
  return entry ? entry.tags : []
}

export async function setTags(id, tags) {
  const db = await getDb()
  return db.put('metatags', { id, tags })
}

export async function getAllTags() {
  const db = await getDb()
  const all = await db.getAll('metatags')
  const tagSet = new Set()
  all.forEach((entry) => (entry.tags || []).forEach((t) => tagSet.add(t)))
  return Array.from(tagSet).sort()
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
