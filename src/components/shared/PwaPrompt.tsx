'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PwaPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    const dismissed = sessionStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!isDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isDismissed]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
    setIsDismissed(true);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-stone-900 text-white rounded-2xl p-4 sm:p-5 shadow-2xl border border-amber-500/40 relative overflow-hidden backdrop-blur-md">
        {/* Decorative blur */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-start gap-3.5 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-inner">
            <Smartphone className="w-5 h-5" />
          </div>

          <div className="flex-1 pr-6 space-y-1">
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-bold text-white tracking-wide">
                Pasang Aplikasi Arsip
              </h4>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-xs text-emerald-200/90 leading-relaxed">
              Akses cepat galeri foto, rekaman audio, dan video haul langsung dari layar utama perangkat Anda secara offline.
            </p>

            <div className="pt-2.5 flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleInstallClick}
                icon={<Download className="w-3.5 h-3.5" />}
                className="text-xs py-1.5 h-8 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold"
              >
                Pasang Sekarang
              </Button>
              <button
                type="button"
                onClick={handleDismiss}
                className="text-xs text-emerald-300 hover:text-white px-2 py-1 transition"
              >
                Nanti Saja
              </button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/60 transition"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
