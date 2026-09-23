import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hfozhafprvtnvzqlglge.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_vQpaZlfxJn4tWOGoC2PaKA_9jbD7vC-';

  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
}
