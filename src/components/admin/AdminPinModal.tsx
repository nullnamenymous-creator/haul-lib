'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, KeyRound, Eye, EyeOff, ShieldAlert, CheckCircle2, ArrowRight, X, Sparkles } from 'lucide-react';
import { verifyAdminPin, setAdminSession } from '@/lib/auth-check';
import { Button } from '@/components/ui/Button';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMsg('');
      setIsSuccess(false);
      setIsVerifying(false);
      // Auto focus input
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setErrorMsg('Silakan masukkan PIN atau kata sandi admin.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg('');

    // Check PIN verification
    const isValid = verifyAdminPin(pin);

    setTimeout(() => {
      if (isValid) {
        setAdminSession();
        setIsSuccess(true);
        setIsVerifying(false);

        // Redirect after brief pleasant feedback
        setTimeout(() => {
          onClose();
          if (onSuccess) {
            onSuccess();
          } else {
            router.push('/admin/dashboard');
          }
        }, 600);
      } else {
        setIsVerifying(false);
        setErrorMsg('PIN atau Kata Sandi salah! Akses khusus pengurus & admin.');
        inputRef.current?.select();
      }
    }, 300);
  };

  const handleUseDefaultPin = () => {
    setPin('1924');
    setErrorMsg('');
    inputRef.current?.focus();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-emerald-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Box */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-emerald-900/20 overflow-hidden z-10 my-auto animate-in zoom-in-95 duration-200"
      >
        {/* Top Gold Gradient Bar */}
        <div className="h-1.5 bg-gradient-to-r from-emerald-800 via-amber-400 to-emerald-800 w-full" />

        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Tutup dialog"
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header & Icon */}
          <div className="text-center space-y-3">
            <div className="relative inline-flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-900 to-emerald-950 text-amber-300 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-emerald-950/20">
                {isSuccess ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-in zoom-in duration-300" />
                ) : (
                  <Lock className="w-8 h-8 text-amber-300" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center shadow-sm border-2 border-white">
                <KeyRound className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <span className="inline-block text-[11px] font-mono tracking-wider uppercase font-semibold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-300/60 mb-1.5">
                Area Terbatas Pengurus
              </span>
              <h2 className="font-serif text-2xl font-bold text-emerald-950 tracking-tight">
                Verifikasi Akses Admin
              </h2>
              <p className="text-xs text-stone-600 mt-1 max-w-xs mx-auto leading-relaxed">
                Halaman kelola arsip hanya dapat diakses oleh admin repositori. Silakan masukkan PIN atau Kata Sandi Anda.
              </p>
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5 animate-in slide-in-from-top-1 duration-200">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="leading-snug">
                <p className="font-semibold">Akses Ditolak</p>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}

          {isSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5 animate-in slide-in-from-top-1 duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="font-medium">Otorisasi Berhasil! Mengalihkan ke Dasbor...</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700">
                PIN atau Kata Sandi Admin
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Masukkan PIN (cth: 1924)"
                  disabled={isVerifying || isSuccess}
                  className="w-full pl-4 pr-12 py-3 bg-stone-50 border border-stone-300 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 rounded-xl text-stone-900 placeholder:text-stone-400 text-center tracking-widest font-mono text-lg transition disabled:opacity-50"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-stone-600 transition"
                  aria-label={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick PIN Helper Tag */}
            <div className="flex items-center justify-between text-[11px] text-stone-500 pt-0.5">
              <span>PIN Bawaan Pengurus:</span>
              <button
                type="button"
                onClick={handleUseDefaultPin}
                className="inline-flex items-center gap-1 font-mono font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300/50 transition cursor-pointer"
                title="Gunakan PIN default 1924"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>1924 (Klik untuk pakai)</span>
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={isVerifying}
              disabled={isSuccess}
              className="w-full py-3 bg-emerald-900 hover:bg-emerald-950 text-white font-semibold text-sm shadow-md rounded-xl flex items-center justify-center gap-2"
            >
              <span>{isSuccess ? 'Membuka Dasbor...' : 'Buka Dasbor Kelola Arsip'}</span>
              {!isSuccess && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>

          {/* Alternative: Supabase Full Login */}
          <div className="pt-2 border-t border-stone-100 text-center">
            <p className="text-[11px] text-stone-500">
              Memiliki akun pengurus resmi?{' '}
              <Link
                href="/admin/login"
                onClick={onClose}
                className="font-semibold text-emerald-800 hover:text-emerald-950 underline underline-offset-2 transition"
              >
                Masuk dengan Email Supabase
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
