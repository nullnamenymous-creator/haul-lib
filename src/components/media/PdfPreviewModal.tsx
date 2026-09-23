'use client';

import React, { useState, useEffect } from 'react';
import { MediaFile } from '@/types/database';
import { formatBytes } from '@/lib/utils';
import { checkIsAdmin } from '@/lib/auth-check';
import { FileText, Download, X, Lock, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface PdfPreviewModalProps {
  media: MediaFile | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (media: MediaFile) => void;
  isAdmin?: boolean;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  media,
  isOpen,
  onClose,
  onDownload,
  isAdmin: propIsAdmin,
}) => {
  const [isAdmin, setIsAdmin] = useState(propIsAdmin ?? false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (propIsAdmin === undefined) {
      checkIsAdmin().then(setIsAdmin);
    } else {
      setIsAdmin(propIsAdmin);
    }
  }, [propIsAdmin, isOpen]);

  if (!isOpen || !media) return null;

  const handleDownloadClick = async () => {
    if (!isAdmin) {
      alert('Akses unduhan dokumen risalah/naskah dibatasi khusus untuk Pengurus Majelis.');
      return;
    }

    try {
      setIsDownloading(true);
      if (onDownload) {
        onDownload(media);
      } else {
        fetch('/api/increment-download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId: media.id }),
        }).catch(() => {});

        const a = document.createElement('a');
        a.href = media.file_url;
        a.download = media.title || 'dokumen-haul.pdf';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[88vh] bg-white rounded-2xl overflow-hidden shadow-2xl border border-stone-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-emerald-950 text-white border-b border-emerald-900 z-10">
          <div className="flex items-center gap-3 truncate pr-2">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h3 className="text-sm sm:text-base font-semibold text-stone-100 truncate">
                {media.title}
              </h3>
              <p className="text-xs text-emerald-200/80 truncate">
                {media.event?.title || 'Dokumen PDF'} • {formatBytes(media.file_size)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Restricted Download Logic: Only Admin can download */}
            {isAdmin ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleDownloadClick}
                isLoading={isDownloading}
                icon={<Download className="w-3.5 h-3.5" />}
                className="text-xs py-1.5 h-8 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold"
              >
                Unduh PDF (Admin)
              </Button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-medium">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Hanya Baca</span> (Unduh Khusus Pengurus)
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-rose-950/60 transition ml-1"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Frame / Embed Container */}
        <div className="flex-1 bg-stone-100 relative">
          <iframe
            src={`${media.file_url}#toolbar=0&navpanes=0`}
            className="w-full h-full border-none"
            title={media.title}
          />
        </div>

        {/* Description info footer */}
        <div className="px-5 py-2.5 bg-stone-50 border-t border-stone-200 text-xs text-stone-600 flex flex-wrap items-center justify-between gap-2">
          <p className="truncate max-w-xl">
            {media.description || 'Naskah dan dokumen resmi perhelatan haul.'}
          </p>
          {!isAdmin && (
            <span className="flex items-center gap-1 text-[11px] text-amber-800 font-medium">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>Untuk mengunduh dokumen asli, silakan login melalui portal pengurus.</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
