import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/server';
import { isMissingTable } from '@/lib/admin-auth';
import type { MemberRole } from '@/types/club';
import { CLUB_BUCKET, MISSING_CLUB_TABLES_MESSAGE, UUID } from './shared';

/* Validation, storage and cache helpers for the board / planet admin routes. */

export class InputError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

/** Maps errors to the JSON shape the admin screens expect ({ message }). */
export function errorResponse(error: unknown, fallback: string) {
  if (error instanceof InputError) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }
  if (isMissingTable(error)) {
    return NextResponse.json({ message: MISSING_CLUB_TABLES_MESSAGE, missingTable: true }, { status: 503 });
  }
  const code = (error as { code?: string } | null)?.code;
  if (code === '23505') {
    return NextResponse.json({ message: 'That is already taken — pick another one.' }, { status: 409 });
  }
  console.error(fallback, error);
  return NextResponse.json({ message: fallback }, { status: 500 });
}

export const text = (v: unknown, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

const publicPrefix = () =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')}/storage/v1/object/public/${CLUB_BUCKET}/`;

/** Images may be files shipped in /public/images or uploads in our own bucket — nothing else,
 *  so next/image never meets a host it isn't configured for. */
export function imageUrl(v: unknown, label: string): string {
  const s = text(v, 1000);
  if (!s) return '';
  if (/^\/images\/[\w./-]+$/.test(s) && !s.includes('..')) return s;
  if (s.startsWith(publicPrefix()) && /^[\w./-]+$/.test(s.slice(publicPrefix().length))) return s;
  throw new InputError(`${label}: upload the image again.`);
}

function link(v: unknown, label: string) {
  const s = text(v, 500);
  if (!s) return '';
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error();
    return u.toString();
  } catch {
    throw new InputError(`${label} is not a valid link.`);
  }
}

function email(v: unknown, label: string) {
  const s = text(v, 200);
  if (s && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) throw new InputError(`${label} is not a valid email address.`);
  return s;
}

export function cleanMember(input: unknown, role: MemberRole, position: number, where: string) {
  const m = (input ?? {}) as Record<string, unknown>;
  const name = text(m.name, 120);
  if (!name) throw new InputError(`Every ${role} needs a name (${where}).`);
  return {
    id: typeof m.id === 'string' && UUID.test(m.id) ? m.id : null,
    role,
    name,
    image_url: imageUrl(m.image_url, `Photo of ${name}`),
    email: email(m.email, `Email of ${name}`),
    phone: text(m.phone, 40),
    linkedin: link(m.linkedin, `LinkedIn of ${name}`),
    bio: text(m.bio, 1000),
    position,
  };
}

/** Removes uploads from our bucket. Files shipped in /public are never touched. Never throws. */
export async function removeImages(urls: Iterable<string>) {
  const prefix = publicPrefix();
  const paths = [...new Set(urls)].filter((u) => u?.startsWith(prefix)).map((u) => u.slice(prefix.length));
  if (!paths.length) return;
  try {
    const { error } = await supabaseAdmin.storage.from(CLUB_BUCKET).remove(paths);
    if (error) console.error('Could not remove old images:', error);
  } catch (error) {
    console.error('Could not remove old images:', error);
  }
}

export async function ensureBucket() {
  const { data } = await supabaseAdmin.storage.getBucket(CLUB_BUCKET);
  if (data) return;
  const { error } = await supabaseAdmin.storage.createBucket(CLUB_BUCKET, {
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    fileSizeLimit: '10MB',
  });
  if (error && !/already exists/i.test(error.message)) throw error;
}

/** Every public page that shows boards or planets. */
export function revalidateClub() {
  revalidatePath('/');
  revalidatePath('/board');
  revalidatePath('/planets/[slug]', 'page');
}
