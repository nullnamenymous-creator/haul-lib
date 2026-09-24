'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { checkIsAdmin } from '@/lib/auth-check';
import { AdminPinModal } from '@/components/admin/AdminPinModal';
import {
  BookOpen,
  Users,
  Calendar,
  Lock,
  Menu,
  X,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Katalog Arsip', icon: <BookOpen className="w-4 h-4" /> },
    { href: '/tokoh/a1111111-1111-1111-1111-111111111111', label: "Mu'alim Ahmad Shobandi", icon: <Users className="w-4 h-4" /> },
    { href: '/haul/b1111111-1111-1111-1111-111111111111', label: 'Haul Terkini', icon: <Calendar className="w-4 h-4" /> },
    { href: '/admin/dashboard', label: 'Kelola Arsip', icon: <Lock className="w-4 h-4" /> },
  ];

  const handleLinkClick = async (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href === '/admin/dashboard') {
      e.preventDefault();
      const isAdmin = await checkIsAdmin();
      if (isAdmin) {
        router.push('/admin/dashboard');
      } else {
        setIsPinModalOpen(true);
      }
    }
  };

  const handleMobileLinkClick = async (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setMobileMenuOpen(false);
    if (href === '/admin/dashboard') {
      e.preventDefault();
      const isAdmin = await checkIsAdmin();
      if (isAdmin) {
        router.push('/admin/dashboard');
      } else {
        setIsPinModalOpen(true);
      }
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-emerald-islamic/95 backdrop-blur-md border-b border-emerald-800/80 shadow-sm text-white">
        {/* Golden top decorative bar */}
        <div className="h-1 bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 w-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo & Brand Title */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-md group-hover:scale-105 transition transform shrink-0 overflow-hidden">
                <div className="w-full h-full bg-emerald-950 rounded-[10px] flex items-center justify-center p-0.5 overflow-hidden">
                  <Image
                    src="/icons/logo-haol.png"
                    alt="Logo Haul & Majelis"
                    width={44}
                    height={44}
                    className="w-full h-full object-contain rounded-lg"
                    priority
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-serif font-bold text-base sm:text-lg tracking-wide text-white group-hover:text-amber-300 transition">
                    Arsip Haul & Majelis
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    PWA
                  </span>
                </div>
                <p className="text-[11px] text-emerald-200/80 font-light -mt-0.5">
                  Digital Heritage Repository & Manaqib Ulama
                </p>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link.href)}
                    className={cn(
                      'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition duration-150',
                      isActive
                        ? 'bg-emerald-900 text-amber-300 shadow-inner border border-emerald-700/60'
                        : 'text-emerald-100 hover:text-white hover:bg-emerald-800/60'
                    )}
                  >
                    <span className={isActive ? 'text-amber-300' : 'text-emerald-300'}>
                      {link.icon}
                    </span>
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-emerald-100 hover:text-white hover:bg-emerald-800/80 transition"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-emerald-950 border-b border-emerald-800 px-4 pt-2 pb-6 space-y-2 animate-in slide-in-from-top-2 duration-150">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleMobileLinkClick(e, link.href)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition',
                    isActive
                      ? 'bg-emerald-900 text-amber-300 border border-emerald-700/60'
                      : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
                  )}
                >
                  <span className={isActive ? 'text-amber-300' : 'text-emerald-300'}>
                    {link.icon}
                  </span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Admin PIN Verification Modal */}
      <AdminPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
      />
    </>
  );
};
