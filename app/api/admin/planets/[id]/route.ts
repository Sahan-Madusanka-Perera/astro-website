import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { isAdminRequest, unauthorized } from '@/lib/admin-auth';
import { errorResponse, imageUrl, InputError, removeImages, revalidateClub, text } from '@/lib/club/admin';
import { slugify, UUID } from '@/lib/club/shared';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Ctx) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const { id } = await params;
    if (!UUID.test(id)) throw new InputError('Unknown planet.', 404);
    const body = await request.json().catch(() => null);
    if (!body) throw new InputError('Nothing to save.');

    const name = text(body.name, 120);
    if (!name) throw new InputError('Give the planet a name.');
    const slug = slugify(text(body.slug, 60) || name);
    if (!slug) throw new InputError('The web address needs letters or numbers.');
    const responsibilities = (Array.isArray(body.responsibilities) ? body.responsibilities : [])
      .map((r: unknown) => text(r, 300))
      .filter(Boolean)
      .slice(0, 30);

    const { data: before } = await supabaseAdmin.from('club_planets').select('icon_url').eq('id', id).maybeSingle();
    if (!before) throw new InputError('Unknown planet.', 404);

    const icon_url = imageUrl(body.icon_url, 'Planet logo');
    const { data, error } = await supabaseAdmin
      .from('club_planets')
      .update({
        name,
        slug,
        description: text(body.description, 2000),
        icon_url,
        responsibilities,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      if (error.code === '23505') throw new InputError(`Another planet already uses the address /planets/${slug}.`, 409);
      throw error;
    }
    if (before.icon_url && before.icon_url !== icon_url) await removeImages([before.icon_url]);

    revalidateClub();
    return NextResponse.json(data);
  } catch (error) {
    return errorResponse(error, 'Could not save the planet.');
  }
}

/** Removes the planet and its people in every year. */
export async function DELETE(request: NextRequest, { params }: Ctx) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const { id } = await params;
    if (!UUID.test(id)) throw new InputError('Unknown planet.', 404);
    const [planet, members] = await Promise.all([
      supabaseAdmin.from('club_planets').select('icon_url').eq('id', id).maybeSingle(),
      supabaseAdmin.from('club_members').select('image_url').eq('planet_id', id),
    ]);
    const { error } = await supabaseAdmin.from('club_planets').delete().eq('id', id);
    if (error) throw error;
    await removeImages([planet.data?.icon_url ?? '', ...(members.data ?? []).map((m) => m.image_url)]);
    revalidateClub();
    return NextResponse.json({ message: 'Planet deleted' });
  } catch (error) {
    return errorResponse(error, 'Could not delete the planet.');
  }
}
