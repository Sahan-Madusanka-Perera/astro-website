import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/server';
import {
  isAdminRequest,
  isMissingTable,
  MISSING_TABLE_MESSAGE,
  unauthorized,
} from '@/lib/admin-auth';
import { LIST_COLUMNS } from '@/lib/magazine/queries';
import { MAGAZINE_BUCKET, PDF_PATH, slugify } from '@/lib/magazine/shared';
import type { MagazineOutlineItem, MagazinePage } from '@/types/magazine';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const admin = isAdminRequest(request);
  let query = supabaseAdmin
    .from('magazines')
    .select(LIST_COLUMNS)
    .order('published_at', { ascending: false });
  if (!admin) query = query.eq('is_published', true);

  const { data, error } = await query;
  if (error) {
    if (isMissingTable(error)) {
      return NextResponse.json({ message: MISSING_TABLE_MESSAGE, missingTable: true }, { status: 503 });
    }
    console.error('Error fetching magazines:', error);
    return NextResponse.json({ message: 'Failed to fetch magazines' }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title);
  const { data } = await supabaseAdmin.from('magazines').select('slug').like('slug', `${base}%`);
  const taken = new Set((data ?? []).map((r: { slug: string }) => r.slug));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

/** Called once every file is in storage: records the issue. */
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();

  try {
    const body = await request.json();
    const title = String(body.title ?? '').trim();
    const pages = body.pages as MagazinePage[];
    if (!UUID.test(body.id ?? '') || !title || !Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json({ message: 'The issue is missing its title or pages.' }, { status: 400 });
    }

    const bucket = supabaseAdmin.storage.from(MAGAZINE_BUCKET);
    const base_url = bucket.getPublicUrl(body.id).data.publicUrl;
    const hasPdf = body.has_pdf === true;

    const row = {
      id: body.id as string,
      slug: await uniqueSlug(title),
      title,
      edition: String(body.edition ?? '').trim() || null,
      description: String(body.description ?? '').trim() || null,
      base_url,
      image_ext: body.image_ext === 'jpg' ? 'jpg' : 'webp',
      page_count: pages.length,
      pages,
      outline: (Array.isArray(body.outline) ? body.outline : []) as MagazineOutlineItem[],
      has_text: body.has_text === true,
      pdf_url: hasPdf ? `${base_url}/${PDF_PATH}` : null,
      allow_download: hasPdf && body.allow_download !== false,
      is_published: body.is_published !== false,
    };

    const { data, error } = await supabaseAdmin.from('magazines').insert([row]).select(LIST_COLUMNS).single();
    if (error) {
      if (isMissingTable(error)) {
        return NextResponse.json({ message: MISSING_TABLE_MESSAGE }, { status: 503 });
      }
      throw error;
    }

    revalidatePath('/magazine');
    revalidatePath('/');
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating magazine:', error);
    return NextResponse.json({ message: 'Could not save the issue.' }, { status: 500 });
  }
}
