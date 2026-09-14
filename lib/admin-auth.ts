import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/* The admin session is the cookie /api/auth sets on sign-in. Magazine routes
   hand out signed upload URLs and delete whole folders, so unlike the older
   routes they refuse to act without it. */

export function isAdminRequest(request: NextRequest): boolean {
  return request.cookies.get('admin-session')?.value === 'authenticated';
}

export function unauthorized() {
  return NextResponse.json({ message: 'Sign in to the admin first.' }, { status: 401 });
}

/** PostgREST reports a table that was never created in two different ways
 *  depending on version. Either way the fix is the same SQL file. */
export function isMissingTable(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null;
  return (
    e?.code === '42P01' ||
    e?.code === 'PGRST205' ||
    /could not find the table|relation .* does not exist/i.test(e?.message ?? '')
  );
}

export const MISSING_TABLE_MESSAGE =
  'The magazines table does not exist yet. Run supabase/magazines.sql in the Supabase SQL editor, then try again.';
