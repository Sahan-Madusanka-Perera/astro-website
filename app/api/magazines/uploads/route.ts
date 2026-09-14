import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { isAdminRequest, unauthorized } from '@/lib/admin-auth';
import { MAGAZINE_BUCKET } from '@/lib/magazine/shared';

/* ---------------------------------------------------------------------------
   Signed upload URLs for one issue.

   The files never pass through this server. A hosted Next.js function accepts
   a request body of a few megabytes at most, and an issue is a few hundred
   page images plus the PDF — so the browser uploads straight to Supabase
   Storage with URLs signed here, one per file.
--------------------------------------------------------------------------- */

const ALLOWED = /^(pages\/\d{4}-[tmh]\.(webp|jpg)|text\.json|issue\.pdf)$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function ensureBucket() {
  const { data } = await supabaseAdmin.storage.getBucket(MAGAZINE_BUCKET);
  if (data) return;
  const { error } = await supabaseAdmin.storage.createBucket(MAGAZINE_BUCKET, { public: true });
  if (error && !/already exists/i.test(error.message)) throw error;
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();

  try {
    const body = (await request.json()) as { id?: string; files?: string[] };
    const files = Array.isArray(body.files) ? body.files : [];
    if (files.length === 0 || files.length > 3000 || !files.every((f) => ALLOWED.test(f))) {
      return NextResponse.json({ message: 'Unexpected file list.' }, { status: 400 });
    }
    const id = body.id && UUID.test(body.id) ? body.id : crypto.randomUUID();

    await ensureBucket();
    const bucket = supabaseAdmin.storage.from(MAGAZINE_BUCKET);

    const uploads: { path: string; url: string }[] = [];
    for (let i = 0; i < files.length; i += 24) {
      const batch = await Promise.all(
        files.slice(i, i + 24).map(async (path) => {
          const { data, error } = await bucket.createSignedUploadUrl(`${id}/${path}`, { upsert: true });
          if (error || !data) throw error ?? new Error('Could not sign upload');
          return { path, url: data.signedUrl };
        })
      );
      uploads.push(...batch);
    }

    const baseUrl = bucket.getPublicUrl(id).data.publicUrl;
    return NextResponse.json({ id, baseUrl, uploads });
  } catch (error) {
    console.error('Error signing magazine uploads:', error);
    return NextResponse.json(
      { message: 'Could not prepare the upload. Check the Supabase storage settings.' },
      { status: 500 }
    );
  }
}
