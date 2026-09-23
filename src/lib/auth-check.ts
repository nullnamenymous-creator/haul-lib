'use client';

import { createClient } from './supabase/client';

export async function checkIsAdmin(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // Check demo admin flag in storage
  if (localStorage.getItem('admin-demo-auth') === 'true') {
    return true;
  }

  // Check active Supabase authenticated session
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return !!data?.session;
  } catch {
    return false;
  }
}
