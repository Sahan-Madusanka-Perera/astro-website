import { supabaseAdmin } from '@/lib/supabase/server';
import { isMissingTable } from '@/lib/admin-auth';
import type { Magazine } from '@/types/magazine';

/* Server-side reads for the public pages. A missing table or an unreachable
   database renders as "no issues yet" rather than taking the page down — the
   rest of the site must not depend on the magazine existing. */

export const LIST_COLUMNS =
  'id,slug,title,edition,description,base_url,image_ext,page_count,pages,has_text,pdf_url,allow_download,is_published,published_at,created_at,updated_at';

export type MagazineSummary = Omit<Magazine, 'outline'>;

export async function getPublishedIssues(): Promise<MagazineSummary[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('magazines')
      .select(LIST_COLUMNS)
      .eq('is_published', true)
      .order('published_at', { ascending: false });
    if (error) {
      if (!isMissingTable(error)) console.error('Error fetching magazines:', error);
      return [];
    }
    return (data ?? []) as MagazineSummary[];
  } catch (error) {
    console.error('Error fetching magazines:', error);
    return [];
  }
}

export async function getIssueBySlug(slug: string): Promise<Magazine | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('magazines')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();
    if (error) {
      if (!isMissingTable(error)) console.error('Error fetching magazine:', error);
      return null;
    }
    return data as Magazine | null;
  } catch (error) {
    console.error('Error fetching magazine:', error);
    return null;
  }
}
