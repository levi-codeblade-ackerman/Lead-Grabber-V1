import { PUBLIC_POCKETBASE_URL } from '$env/static/public'
import PocketBase from 'pocketbase'

export function createInstance() {
  return new PocketBase(PUBLIC_POCKETBASE_URL)
}

export const pb = createInstance()

/**
 * Get the full URL for a PocketBase file
 * @param record The record containing the file
 * @param filename The filename from the record field
 * @returns Full URL to the file or null if no filename provided
 */
export function getFileUrl(record: { collectionId: string; id: string }, filename: string | null | undefined): string | null {
  if (!filename) return null;
  return `${PUBLIC_POCKETBASE_URL}api/files/${record.collectionId}/${record.id}/${filename}`;
}