'use client';

import { supabase } from '@/lib/supabase/client';
import { CLUB_BUCKET, type ClubUploadFolder } from './shared';

/* ---------------------------------------------------------------------------
   Photos straight from a phone or camera are 5–15 MB. They're scaled down in
   the browser first (longest side capped per use) and re-encoded as WebP, then
   uploaded directly to Supabase Storage with a URL the server signed.
--------------------------------------------------------------------------- */

export const MAX_SIDE: Record<ClubUploadFolder, number> = {
  boards: 2400, // group photos are viewed large
  members: 800,
  planets: 800,
};

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

async function prepare(file: File, maxSide: number): Promise<{ blob: Blob; ext: string }> {
  if (!file.type.startsWith('image/')) throw new Error(`${file.name} isn’t an image.`);
  if (file.type === 'image/gif') return { blob: file, ext: 'gif' }; // keep animation

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error(`${file.name} can’t be read by this browser — save it as JPG or PNG and try again.`);
  }
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const webp = await toBlob(canvas, 'image/webp', 0.86);
  if (webp && webp.type === 'image/webp') return { blob: webp, ext: 'webp' };
  const jpg = await toBlob(canvas, 'image/jpeg', 0.88);
  if (!jpg) throw new Error(`Could not process ${file.name}.`);
  return { blob: jpg, ext: 'jpg' };
}

/** Resizes and uploads one image, returning its public URL. */
export async function uploadClubImage(file: File, folder: ClubUploadFolder): Promise<string> {
  const { blob, ext } = await prepare(file, MAX_SIDE[folder]);

  const res = await fetch('/api/admin/uploads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder, ext }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || 'Could not prepare the upload.');

  const { error } = await supabase.storage
    .from(CLUB_BUCKET)
    .uploadToSignedUrl(body.path, body.token, blob, { contentType: blob.type, cacheControl: '31536000' });
  if (error) throw new Error(error.message || 'Upload failed.');
  return body.publicUrl as string;
}
