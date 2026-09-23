import React from 'react';
import Link from 'next/link';
import { Heart, ShieldCheck, Sparkles, BookOpen } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-emerald-islamic-dark text-emerald-100 border-t border-emerald-900/60 mt-auto">
      {/* Golden decorative separator */}
      <div className="h-0.5 bg-gradient-to-r from-emerald-900 via-amber-500/50 to-emerald-900" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Column 1: Identity & Mission */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-serif font-bold text-lg">
                ح
              </div>
              <h3 className="font-serif text-lg font-bold text-white tracking-wide">
                Arsip Haul & Majelis Digital
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-emerald-200/80 leading-relaxed max-w-md">
              Platform repositori digital khidmat untuk mendokumentasikan, merawat, dan mempublikasikan warisan sejarah, manaqib, rekaman tausiyah, dan dokumentasi peringatan haul para habaib dan ulama nusantara.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-amber-300/90">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Dikelola dengan sanad cinta & khidmah untuk ummat.</span>
            </div>
          </div>

          {/* Column 2: Kategori Arsip */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
              Kategori Media
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-emerald-200/80">
              <li>
                <Link href="/?type=photo" className="hover:text-amber-300 transition">
                  • Arsip Galeri Foto
                </Link>
              </li>
              <li>
                <Link href="/?type=video" className="hover:text-amber-300 transition">
                  • Video Dokumentasi & Ceramah
                </Link>
              </li>
              <li>
                <Link href="/?type=audio" className="hover:text-amber-300 transition">
                  • Rekaman Audio & Qasidah
                </Link>
              </li>
              <li>
                <Link href="/?type=document" className="hover:text-amber-300 transition">
                  • Risalah Manaqib (PDF)
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Akses Cepat & Admin */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
              Akses Majelis
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-emerald-200/80">
              <li>
                <Link href="/tokoh/a1111111-1111-1111-1111-111111111111" className="hover:text-amber-300 transition">
                  • Profil Tokoh Ulama
                </Link>
              </li>
              <li>
                <Link href="/haul/b1111111-1111-1111-1111-111111111111" className="hover:text-amber-300 transition">
                  • Info Haul Akbar Terkini
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-amber-300 transition flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Portal Khusus Pengurus</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Line */}
        <div className="mt-12 pt-6 border-t border-emerald-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-emerald-300/70">
          <p>© {new Date().getFullYear()} Repositori Haul & Majelis Digital. Terbuka untuk umum & nirlaba.</p>
          <p className="flex items-center gap-1.5">
            <span>Dibuat dengan rasa ta&apos;zhim</span>
            <Heart className="w-3.5 h-3.5 text-amber-400 fill-current" />
            <span>untuk para guru dan sesepuh.</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
