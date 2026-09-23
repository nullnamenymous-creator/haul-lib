'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Lock, Mail, ShieldCheck, ArrowLeft, Sparkles } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message || 'Gagal masuk. Periksa email & kata sandi Anda.');
      } else {
        router.push('/admin/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoAdmin = () => {
    // Store demo session flag in localStorage for seamless preview testing
    localStorage.setItem('admin-demo-auth', 'true');
    router.push('/admin/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-islamic-pattern p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-emerald-800 hover:text-emerald-950 transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda Publik</span>
        </Link>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-islamic-lg border border-stone-200 p-7 sm:p-9 space-y-6 relative overflow-hidden">
          {/* Top golden accent line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-800 via-amber-500 to-emerald-800" />

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-900 text-amber-300 border border-amber-500/30 flex items-center justify-center mx-auto shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-emerald-950 tracking-tight">
              Portal Pengurus Arsip
            </h1>
            <p className="text-xs text-stone-500">
              Masuk untuk mengelola dokumentasi, mengunggah berkas, dan meninjau statistik repositori.
            </p>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              label="Alamat Email Pengurus"
              placeholder="pengurus@majelis.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              type="password"
              label="Kata Sandi"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full py-2.5 bg-emerald-900 hover:bg-emerald-950 shadow-md font-semibold text-sm"
            >
              Masuk dengan Supabase Auth
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-stone-400 font-mono">
                atau mode simulasi
              </span>
            </div>
          </div>

          {/* Demo Login Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleDemoAdmin}
            icon={<Sparkles className="w-4 h-4 text-amber-500" />}
            className="w-full py-2.5 text-xs font-semibold border-amber-600/40 hover:bg-amber-50/50"
          >
            Masuk Langsung (Demo Mode)
          </Button>

          <p className="text-[11px] text-center text-stone-400 pt-1 leading-normal">
            Kredensial login admin dapat dikonfigurasi melalui menu Supabase Authentication pengguna.
          </p>
        </div>
      </div>
    </div>
  );
}
