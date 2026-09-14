/* ---------------------------------------------------------------------------
   Straight to Supabase Storage, with honest progress.

   fetch() cannot report upload progress, and a 40MB PDF on a campus
   connection is exactly the file that needs it — so each file goes up over
   XMLHttpRequest to a URL the server signed. Four at a time, three tries each.
--------------------------------------------------------------------------- */

export interface UploadItem {
  path: string;
  blob: Blob;
  /** When true a failure is reported instead of aborting the whole upload. */
  optional?: boolean;
}

export interface SignedUploads {
  id: string;
  baseUrl: string;
  urls: Map<string, string>;
}

export async function signUploads(paths: string[], id?: string): Promise<SignedUploads> {
  const res = await fetch('/api/magazines/uploads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, files: paths }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || 'Could not prepare the upload.');
  return {
    id: body.id,
    baseUrl: body.baseUrl,
    urls: new Map((body.uploads as { path: string; url: string }[]).map((u) => [u.path, u.url])),
  };
}

function put(url: string, blob: Blob, onBytes: (loaded: number) => void, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('x-upsert', 'true');
    xhr.upload.onprogress = (e) => onBytes(e.loaded);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else {
        let message = `Upload failed (${xhr.status})`;
        try {
          message = JSON.parse(xhr.responseText).message || message;
        } catch {
          /* not JSON */
        }
        const err = new Error(message) as Error & { status?: number };
        err.status = xhr.status;
        reject(err);
      }
    };
    xhr.onerror = () => reject(new Error('Network error while uploading'));
    xhr.onabort = () => reject(new DOMException('Cancelled', 'AbortError'));
    signal?.addEventListener('abort', () => xhr.abort(), { once: true });

    // The same body storage-js sends to a signed URL. Files are immutable —
    // each issue has its own folder — so they may be cached for a year.
    const form = new FormData();
    form.append('cacheControl', '31536000');
    form.append('', blob);
    xhr.send(form);
  });
}

export async function uploadAll(
  items: UploadItem[],
  signed: SignedUploads,
  opts: { onProgress?: (fraction: number) => void; signal?: AbortSignal } = {}
): Promise<{ failedOptional: string[] }> {
  const total = items.reduce((n, i) => n + i.blob.size, 0) || 1;
  const loaded = new Map<string, number>();
  const report = () => {
    let sum = 0;
    loaded.forEach((v) => (sum += v));
    opts.onProgress?.(Math.min(1, sum / total));
  };

  const failedOptional: string[] = [];
  const queue = [...items].sort((a, b) => Number(!!a.optional) - Number(!!b.optional));
  let cursor = 0;

  const worker = async () => {
    while (cursor < queue.length) {
      const item = queue[cursor++];
      const url = signed.urls.get(item.path);
      if (!url) throw new Error(`No upload URL for ${item.path}`);

      for (let attempt = 1; ; attempt++) {
        try {
          await put(url, item.blob, (b) => { loaded.set(item.path, b); report(); }, opts.signal);
          loaded.set(item.path, item.blob.size);
          report();
          break;
        } catch (err) {
          const status = (err as { status?: number }).status;
          const fatal =
            (err as Error).name === 'AbortError' || status === 413 || status === 400 || attempt >= 3;
          if (fatal) {
            if (item.optional && (err as Error).name !== 'AbortError') {
              failedOptional.push(item.path);
              loaded.set(item.path, item.blob.size);
              report();
              break;
            }
            throw err;
          }
          await new Promise((r) => setTimeout(r, 600 * attempt));
        }
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(4, queue.length) }, worker));
  return { failedOptional };
}
