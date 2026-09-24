'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { verifyAdminPin, setAdminSession, checkIsAdmin } from '@/lib/auth-check';
import {
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  ShieldAlert,
  Cpu,
  Mail,
  Zap,
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

  // Clock state for hacker HUD
  const [timestamp, setTimestamp] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimestamp(
        now.toLocaleTimeString('id-ID', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle PIN verification
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!pin.trim()) {
      setErrorMessage('PIN KOSONG! Masukkan kode PIN untuk otorisasi dekripsi.');
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
        }, 600);
      } else {
        setIsVerifyingPin(false);
        setErrorMessage('AKSES DITOLAK! PIN Otorisasi tidak cocok dengan kunci enkripsi.');
      }
    }, 400);
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
        setErrorMessage(error.message || 'Kredensial salah! Akses pengurus gagal diverifikasi.');
      } else {
        setAdminSession();
        setPinSuccess(true);
        setTimeout(() => {
          router.push('/admin/dashboard');
        }, 500);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gangguan koneksi terminal keamanan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 sm:p-6 bg-[#020905] text-stone-200 overflow-hidden font-sans selection:bg-emerald-500 selection:text-black">
      {/* BACKGROUND MATRIX / ISLAMIC CYBER OVERLAY */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/40 via-[#020a06] to-[#010402] pointer-events-none" />

      {/* Cyber Grid Pattern */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #00ff8815 1px, transparent 1px), linear-gradient(to bottom, #00ff8815 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />

      {/* Subtle Scanlines effect */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, #000000 3px, #000000 4px)',
        }}
      />

      {/* Ambient Cyber Neon Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse duration-1000" />
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* MAIN CONTAINER */}
      <div className="w-full max-w-lg relative z-10 space-y-4">
        {/* TOP TERMINAL HUD STATUS */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-black/60 border border-emerald-500/20 text-[11px] font-mono text-emerald-400/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="tracking-wider">VAULT_SECURITY: ONLINE</span>
          </div>
          <div className="flex items-center gap-3 text-stone-400">
            <span className="hidden sm:inline">CIPHER: AES-256</span>
            <span className="text-amber-400 font-bold">{timestamp || '00:00:00'}</span>
          </div>
        </div>

        {/* HACKER VAULT CARD */}
        <div className="relative rounded-3xl bg-[#03130a]/90 backdrop-blur-xl border border-emerald-500/30 p-6 sm:p-9 shadow-[0_0_50px_rgba(0,255,136,0.12)] overflow-hidden">
          {/* Top Neon Cyber Edge Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500 animate-pulse" />

          {/* Decorative Corner Cyber Brackets */}
          <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-emerald-400" />
          <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-emerald-400" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-emerald-400" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-emerald-400" />

          {/* ISLAMIC HACKER HEADER */}
          <div className="text-center space-y-3 pt-1">
            {/* Sacred Bismillah in Cyber Glow */}
            <p className="font-serif text-amber-300/90 text-lg sm:text-xl tracking-widest drop-shadow-[0_0_10px_rgba(251,191,36,0.4)]">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>

            {/* Glowing Logo Frame */}
            <div className="relative inline-flex items-center justify-center my-1">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-900/80 via-black to-emerald-950 p-2 border-2 border-emerald-400/60 shadow-[0_0_30px_rgba(16,185,129,0.35)] flex items-center justify-center overflow-hidden">
                <Image
                  src="/icons/logo-haol.png"
                  alt="Logo Haul & Majelis"
                  width={68}
                  height={68}
                  className="w-full h-full object-contain drop-shadow"
                  priority
                />
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-black border border-emerald-300 shadow-[0_0_10px_rgba(0,255,136,0.8)]">
                <Lock className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-mono tracking-widest text-emerald-300 uppercase mb-1">
                <Cpu className="w-3 h-3 text-emerald-400" />
                <span>BRANKAS ARSIP DIGITAL • SHOBANDI HERITAGE</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight drop-shadow-md">
                Gudang Arsip & Dokumen
              </h1>
            </div>
          </div>

          {/* HACKER WARNING BANNER */}
          <div className="mt-5 p-3.5 sm:p-4 rounded-2xl bg-black/60 border border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)] flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 border border-amber-500/40 mt-0.5">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1 text-left">
              <p className="font-mono text-xs font-bold text-amber-300 tracking-wide flex items-center gap-1.5 uppercase">
                <span>[ PERINGATAN SISTEM : AREA TERBATAS ]</span>
              </p>
              <p className="text-xs text-amber-100/90 leading-relaxed">
                Akses menuju gudang arsip dokumen, rekaman manaqib, dan risalah hanya diizinkan untuk pemegang otorisasi.
              </p>
              <p className="text-[11px] font-mono text-emerald-400/90 pt-0.5">
                &gt; Masukkan PIN untuk mendeskripsi &amp; membuka kunci repositori.
              </p>
            </div>
          </div>

          {/* MODE TABS (PIN vs EMAIL) */}
          <div className="grid grid-cols-2 p-1 bg-black/60 border border-emerald-500/20 rounded-xl text-xs font-mono font-semibold mt-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('pin');
                setErrorMessage('');
              }}
              className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'pin'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(0,255,136,0.2)]'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>PIN OTORISASI</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('email');
                setErrorMessage('');
              }}
              className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'email'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(0,255,136,0.2)]'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>LOGIN EMAIL</span>
            </button>
          </div>

          {/* ERROR ALERT */}
          {errorMessage && (
            <div className="mt-4 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/60 text-xs text-rose-300 flex items-start gap-2.5 font-mono shadow-[0_0_15px_rgba(244,63,94,0.25)] animate-in fade-in">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* SUCCESS ALERT */}
          {pinSuccess && (
            <div className="mt-4 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-400 text-xs text-emerald-300 flex items-center gap-2.5 font-mono shadow-[0_0_20px_rgba(0,255,136,0.4)] animate-in zoom-in-95">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 animate-bounce" />
              <p className="font-bold tracking-wide">
                [ OTORISASI SUKSES ] MEMBUKA KUBAH ARSIP DOKUMEN...
              </p>
            </div>
          )}

          {/* TAB 1: PIN FORM */}
          {activeTab === 'pin' && (
            <form onSubmit={handlePinSubmit} className="space-y-5 mt-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-emerald-400/90">
                  <label className="flex items-center gap-1.5 font-bold tracking-wider uppercase">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>PIN / KATA SANDI ENKRIPSI</span>
                  </label>
                  <span className="text-[10px] text-stone-500 font-mono">AUTH_REQUIRED</span>
                </div>

                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="••••••••"
                    disabled={isVerifyingPin || pinSuccess}
                    className="w-full pl-4 pr-12 py-3.5 bg-black/80 border border-emerald-500/40 focus:border-emerald-400 focus:shadow-[0_0_25px_rgba(0,255,136,0.35)] focus:outline-none rounded-xl text-emerald-300 placeholder:text-emerald-900/50 text-center tracking-[0.4em] font-mono text-xl transition disabled:opacity-50"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-emerald-400/60 hover:text-emerald-300 transition"
                    aria-label={showPin ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <button
                type="submit"
                disabled={isVerifyingPin || pinSuccess}
                className="w-full py-3.5 px-6 rounded-xl font-mono font-bold text-sm tracking-wider uppercase bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-400 text-black shadow-[0_0_30px_rgba(0,255,136,0.45)] hover:shadow-[0_0_40px_rgba(0,255,136,0.65)] active:scale-[0.99] transition transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {pinSuccess ? (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>AKSES DIBERIKAN...</span>
                  </>
                ) : isVerifyingPin ? (
                  <>
                    <Cpu className="w-4 h-4 animate-spin" />
                    <span>MENDEKRIPSI KUNCI...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current" />
                    <span>BUKA GUDANG ARSIP DOKUMEN</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: EMAIL FORM */}
          {activeTab === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-4 mt-5 font-mono">
              <div className="space-y-1 text-left">
                <label className="text-xs text-emerald-400 font-semibold uppercase">
                  ALAMAT EMAIL PENGURUS
                </label>
                <input
                  type="email"
                  placeholder="pengurus@haul-lib.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/80 border border-emerald-500/40 focus:border-emerald-400 focus:outline-none rounded-xl text-emerald-300 text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs text-emerald-400 font-semibold uppercase">
                  KATA SANDI
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/80 border border-emerald-500/40 focus:border-emerald-400 focus:outline-none rounded-xl text-emerald-300 text-xs font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || pinSuccess}
                className="w-full py-3 rounded-xl font-mono font-bold text-xs tracking-wider uppercase bg-emerald-600 hover:bg-emerald-500 text-black shadow-[0_0_20px_rgba(0,255,136,0.35)] transition flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isLoading ? 'VERIFIKASI AKUN...' : 'OTORISASI VIA SUPABASE AUTH'}
              </button>
            </form>
          )}

          {/* TERMINAL FOOTER LOG */}
          <div className="mt-6 pt-4 border-t border-emerald-500/20 text-[10px] font-mono text-stone-500 flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left">
            <span className="text-emerald-400/70">&gt; REPOSITORY_NODE: MUALIM-AHMAD-SHOBANDI</span>
            <span>SECURE VAULT v2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
