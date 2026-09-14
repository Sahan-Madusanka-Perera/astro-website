import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/server';
import { isAdminRequest, unauthorized } from '@/lib/admin-auth';
import { LIST_COLUMNS } from '@/lib/magazine/queries';
import { MAGAZINE_BUCKET } from '@/lib/magazine/shared';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  if (!isAdminRequest(request)) return unauthorized();
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ message: 'Unknown issue.' }, { status: 404 });

  try {
    const body = await request.json();
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (typeof body.title === 'string') {
      const title = body.title.trim();
      if (!title) return NextResponse.json({ message: 'An issue needs a title.' }, { status: 400 });
      patch.title = title;
    }
    if (typeof body.edition === 'string') patch.edition = body.edition.trim() || null;
    if (typeof body.description === 'string') patch.description = body.description.trim() || null;
    if (typeof body.is_published === 'boolean') {
      patch.is_published = body.is_published;
      // Publishing a draft puts it at the top of the shelf.
      if (body.is_published) patch.published_at = new Date().toISOString();
    }
    if (typeof body.allow_download === 'boolean') patch.allow_download = body.allow_download;

    const { data, error } = await supabaseAdmin
      .from('magazines')
      .update(patch)
      .eq('id', id)
      .select(LIST_COLUMNS)
      .single();
    if (error) throw error;

    // A download switch is meaningless for an issue whose PDF was not kept.
    if (data && !data.pdf_url && data.allow_download) {
      await supabaseAdmin.from('magazines').update({ allow_download: false }).eq('id', id);
      data.allow_download = false;
    }

    revalidatePath('/magazine');
    revalidatePath(`/magazine/${data.slug}`);
    revalidatePath('/');
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating magazine:', error);
    return NextResponse.json({ message: 'Could not update the issue.' }, { status: 500 });
  }
}

/** Removes the row and every file in the issue's folder. Also used to clear
 *  out the files of an upload that failed before the row was written. */
export async function DELETE(request: NextRequest, { params }: Ctx) {
  if (!isAdminRequest(request)) return unauthorized();
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ message: 'Unknown issue.' }, { status: 404 });

  try {
    const bucket = supabaseAdmin.storage.from(MAGAZINE_BUCKET);
    const paths: string[] = [];
    for (const folder of [id, `${id}/pages`]) {
      let offset = 0;
      for (;;) {
        const { data, error } = await bucket.list(folder, { limit: 1000, offset });
        if (error || !data || data.length === 0) break;
        // Folders come back as entries without an id.
        paths.push(...data.filter((f) => f.id).map((f) => `${folder}/${f.name}`));
        if (data.length < 1000) break;
        offset += 1000;
      }
    }
    for (let i = 0; i < paths.length; i += 500) {
      await bucket.remove(paths.slice(i, i + 500));
    }

    const { data: row } = await supabaseAdmin
      .from('magazines')
      .delete()
      .eq('id', id)
      .select('slug')
      .maybeSingle();

    revalidatePath('/magazine');
    if (row?.slug) revalidatePath(`/magazine/${row.slug}`);
    revalidatePath('/');
    return NextResponse.json({ message: 'Issue deleted' });
  } catch (error) {
    console.error('Error deleting magazine:', error);
    return NextResponse.json({ message: 'Could not delete the issue.' }, { status: 500 });
  }
}
