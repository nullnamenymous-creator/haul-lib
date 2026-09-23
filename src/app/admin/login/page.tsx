'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { verifyAdminPin, setAdminSession } from '@/lib/auth-check';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Lock,
  Mail,
  ShieldCheck,
  ArrowLeft,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'pin' | 'email'>('pin');

  // PIN state
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [pinSuccess, setPinSuccess] = useState(false);

  // Email state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Error Message
  const [errorMessage, setErrorMessage] = useState('');

  // Handle PIN verification
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!pin.trim()) {
      setErrorMessage('Silakan masukkan PIN atau kata sandi admin.');
      return;
    }

    setIsVerifyingPin(true);

    const isValid = verifyAdminPin(pin);

    setTimeout(() => {
      if (isValid) {
        setAdminSession();
        setPinSuccess(true);
        setIsVerifyingPin(false);
        setTimeout(() => {
          router.push('/admin/dashboard');
        }, 500);
      } else {
        setIsVerifyingPin(false);
        setErrorMessage('PIN atau Kata Sandi admin salah! Akses ditolak.');
      }
    }, 300);
  };

  // Handle Supabase Email & Password Login
  const handleEmailLogin = async (e: React.FormEvent) => {
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
        setAdminSession();
        router.push('/admin/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setIsLoading(false);
    }
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
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-900 to-emerald-950 text-amber-300 border border-amber-500/40 flex items-center justify-center mx-auto shadow-md">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-emerald-950 tracking-tight">
              Portal Pengurus Arsip
            </h1>
            <p className="text-xs text-stone-500">
              Hanya admin & pengurus yang berhak mengakses dasbor repositori dan mengelola arsip.
            </p>
          </div>

          {/* Authentication Mode Tabs */}
          <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('pin');
                setErrorMessage('');
              }}
              className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'pin'
                  ? 'bg-white text-emerald-950 shadow-sm border border-stone-200'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-500" />
              <span>PIN Admin</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('email');
                setErrorMessage('');
              }}
              className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'email'
                  ? 'bg-white text-emerald-950 shadow-sm border border-stone-200'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-emerald-600" />
              <span>Akun Email</span>
            </button>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Notice */}
          {pinSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="font-medium">Otorisasi Berhasil! Mengalihkan ke Dasbor...</p>
            </div>
          )}

          {/* Mode 1: PIN Admin Entry */}
          {activeTab === 'pin' && (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700">
                  PIN atau Kata Sandi Admin
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Masukkan PIN (cth: 1924)"
                    disabled={isVerifyingPin || pinSuccess}
                    className="w-full pl-4 pr-12 py-3 bg-stone-50 border border-stone-300 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 rounded-xl text-stone-900 placeholder:text-stone-400 text-center tracking-widest font-mono text-lg transition disabled:opacity-50"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-stone-600 transition"
                    aria-label={showPin ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick default PIN hint */}
              <div className="flex items-center justify-between text-[11px] text-stone-500 pt-0.5">
                <span>PIN Bawaan Pengurus:</span>
                <button
                  type="button"
                  onClick={() => {
                    setPin('1924');
                    setErrorMessage('');
                  }}
                  className="inline-flex items-center gap-1 font-mono font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300/50 transition cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>1924 (Gunakan PIN)</span>
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                isLoading={isVerifyingPin}
                disabled={pinSuccess}
                className="w-full py-3 bg-emerald-900 hover:bg-emerald-950 text-white font-semibold text-sm shadow-md rounded-xl"
              >
                {pinSuccess ? 'Membuka Dasbor...' : 'Verifikasi PIN & Masuk'}
              </Button>
            </form>
          )}

          {/* Mode 2: Supabase Email & Password Login */}
          {activeTab === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
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
                className="w-full py-2.5 bg-emerald-900 hover:bg-emerald-950 shadow-md font-semibold text-sm rounded-xl"
              >
                Masuk dengan Supabase Auth
              </Button>
            </form>
          )}

          <p className="text-[11px] text-center text-stone-400 pt-1 leading-normal">
            Akses kelola arsip terenkripsi dan dilindungi. Hubungi ketua panitia majelis jika lupa PIN pengurus.
          </p>
        </div>
      </div>
    </div>
  );
}
