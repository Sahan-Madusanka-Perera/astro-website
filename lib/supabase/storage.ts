import { supabase } from './client';

export const STORAGE_BUCKETS = {
  EVENTS: 'events',
  GALLERY: 'gallery',
} as const;

export async function uploadImage(
  bucket: string,
  file: File,
  path?: string
): Promise<{ url: string; error: Error | null }> {
  try {
    const fileName = `${Date.now()}-${file.name.replace(/\s/g, '-')}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      return { url: '', error };
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return { url: urlData.publicUrl, error: null };
  } catch (error) {
    return { url: '', error: error as Error };
  }
}

export async function deleteImage(
  bucket: string,
  path: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    return { error };
  } catch (error) {
    return { error: error as Error };
  }
}

export function getImageUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
