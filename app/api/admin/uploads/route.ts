import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { isAdminRequest, unauthorized } from '@/lib/admin-auth';
import { ensureBucket, errorResponse } from '@/lib/club/admin';
import { CLUB_BUCKET, CLUB_UPLOAD_FOLDERS, type ClubUploadFolder } from '@/lib/club/shared';

/* A signed URL for one board photo, member portrait or planet logo. As with the
   magazine, the browser uploads straight to Supabase Storage, so photos never
   hit the hosting platform's request-size limit. */

const EXTENSIONS = ['webp', 'jpg', 'png', 'gif'] as const;

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const body = (await request.json().catch(() => ({}))) as { folder?: string; ext?: string };
    const folder = body.folder as ClubUploadFolder;
    const ext = body.ext as (typeof EXTENSIONS)[number];
    if (!CLUB_UPLOAD_FOLDERS.includes(folder) || !EXTENSIONS.includes(ext)) {
      return NextResponse.json({ message: 'Unexpected upload.' }, { status: 400 });
    }

    await ensureBucket();
    const bucket = supabaseAdmin.storage.from(CLUB_BUCKET);
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const { data, error } = await bucket.createSignedUploadUrl(path);
    if (error || !data) throw error ?? new Error('Could not sign upload');

    return NextResponse.json({
      path,
      token: data.token,
      publicUrl: bucket.getPublicUrl(path).data.publicUrl,
    });
  } catch (error) {
    return errorResponse(error, 'Could not prepare the upload. Check the Supabase storage settings.');
  }
}
