'use client';

import React, { useState } from 'react';
import { MediaFile } from '@/types/database';
import { formatBytes } from '@/lib/utils';
import { FileText, Download, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface PdfPreviewModalProps {
  media: MediaFile | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (media: MediaFile) => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  media,
  isOpen,
  onClose,
  onDownload,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !media) return null;

  const handleDownloadClick = async () => {
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
            <a
              href={media.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-900 transition hidden sm:inline-flex items-center gap-1.5 text-xs"
              title="Buka di tab baru"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Tab Baru</span>
            </a>

            <Button
              size="sm"
              variant="secondary"
              onClick={handleDownloadClick}
              isLoading={isDownloading}
              icon={<Download className="w-3.5 h-3.5" />}
              className="text-xs py-1.5 h-8 bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold"
            >
              Unduh PDF
            </Button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-rose-950/60 transition"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Frame / Embed Container */}
        <div className="flex-1 bg-stone-100 relative">
          <iframe
            src={`${media.file_url}#toolbar=1&navpanes=0`}
            className="w-full h-full border-none"
            title={media.title}
          />
        </div>

        {/* Description info footer */}
        {media.description && (
          <div className="px-5 py-2.5 bg-stone-50 border-t border-stone-200 text-xs text-stone-600 flex items-center justify-between">
            <p className="truncate max-w-3xl">{media.description}</p>
            <span className="shrink-0 text-stone-400">
              {media.download_count} unduhan
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
