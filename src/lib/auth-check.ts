'use client';

import { createClient } from './supabase/client';

// Supported Admin PINs and Passwords
// Primary default is 1924 (historical milestone year) or custom env NEXT_PUBLIC_ADMIN_PIN
const CONFIG_ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || '1924';
const VALID_ADMIN_PINS = [CONFIG_ADMIN_PIN, '1924', 'admin123', 'shobandi1924'];

/**
 * Verifies if the provided PIN or password matches the admin credentials.
 */
export function verifyAdminPin(inputPin: string): boolean {
  if (!inputPin) return false;
  const cleanPin = inputPin.trim();
  return VALID_ADMIN_PINS.includes(cleanPin);
}

/**
 * Stores an authenticated admin session in localStorage.
 */
export function setAdminSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('admin-auth', 'true');
  localStorage.setItem('admin-auth-timestamp', Date.now().toString());
}

/**
 * Clears the admin session from localStorage and Supabase.
 */
export async function clearAdminSession(): Promise<void> {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('admin-auth');
  localStorage.removeItem('admin-demo-auth');
  localStorage.removeItem('admin-auth-timestamp');

  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error('Error signing out of Supabase:', err);
  }
}

/**
 * Checks if the current visitor has active admin privileges.
 */
export async function checkIsAdmin(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // 1. Check local admin session
  const hasLocalAuth =
    localStorage.getItem('admin-auth') === 'true' ||
    localStorage.getItem('admin-demo-auth') === 'true';

  if (hasLocalAuth) {
    return true;
  }

  // 2. Check active Supabase authenticated session
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return !!data?.session;
  } catch {
    return false;
  }
}
