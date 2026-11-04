import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { isAdminRequest, unauthorized } from '@/lib/admin-auth';
import { errorResponse, InputError, revalidateClub, text } from '@/lib/club/admin';
import { slugify, UUID } from '@/lib/club/shared';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const { data, error } = await supabaseAdmin.from('club_planets').select('*').order('position');
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (error) {
    return errorResponse(error, 'Could not load the planets.');
  }
}

/** Adds a planet at the end of the orbit. */
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const body = await request.json().catch(() => ({}));
    const name = text(body.name, 120);
    if (!name) throw new InputError('Give the planet a name.');
    const slug = slugify(text(body.slug, 60) || name);
    if (!slug) throw new InputError('The planet needs a name with letters or numbers in it.');

    const { data: last } = await supabaseAdmin
      .from('club_planets')
      .select('position')
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data, error } = await supabaseAdmin
      .from('club_planets')
      .insert([{ name, slug, position: (last?.position ?? 0) + 1 }])
      .select()
      .single();
    if (error) {
      if (error.code === '23505') throw new InputError(`Another planet already uses the address /planets/${slug}.`, 409);
      throw error;
    }
    revalidateClub();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Could not add the planet.');
  }
}

/** Saves the order of the planets: { order: [id, id, …] }. */
export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const body = await request.json().catch(() => ({}));
    const order = Array.isArray(body.order) ? body.order.filter((id: unknown) => typeof id === 'string' && UUID.test(id)) : [];
    if (!order.length) throw new InputError('Nothing to reorder.');
    const results = await Promise.all(
      order.map((id: string, i: number) => supabaseAdmin.from('club_planets').update({ position: i + 1 }).eq('id', id))
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) throw failed.error;
    revalidateClub();
    return NextResponse.json({ message: 'Order saved' });
  } catch (error) {
    return errorResponse(error, 'Could not save the order.');
  }
}
