'use client';

import React, { useState } from 'react';
import { MediaFile } from '@/types/database';
import { formatBytes, formatDate } from '@/lib/utils';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Calendar,
  MapPin,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface PhotoLightboxProps {
  media: MediaFile | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (media: MediaFile) => void;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  media,
  isOpen,
  onClose,
  onDownload,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !media) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  const handleDownloadClick = async () => {
    try {
      setIsDownloading(true);
      if (onDownload) {
        onDownload(media);
      } else {
        // Trigger download counter API
        fetch('/api/increment-download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId: media.id }),
        }).catch(() => {});

        // Direct anchor download
        const a = document.createElement('a');
        a.href = media.file_url;
        a.download = media.title || 'arsip-foto.jpg';
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
    <div className="fixed inset-0 z-50 flex flex-col bg-stone-950/95 backdrop-blur-md text-white animate-in fade-in duration-200">
      {/* Top Bar Controls */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-stone-800 bg-stone-900/80 z-20">
        <div className="flex items-center gap-3 overflow-hidden pr-2">
          <div className="p-2 rounded-lg bg-emerald-900/80 text-amber-300">
            <Eye className="w-4 h-4" />
          </div>
          <div className="truncate">
            <h2 className="text-sm sm:text-base font-semibold text-stone-100 truncate">
              {media.title}
            </h2>
            <p className="text-xs text-stone-400 truncate">
              {media.event?.title || 'Arsip Foto Haul'} • {formatBytes(media.file_size)}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={handleZoomOut}
            title="Perkecil"
            className="p-2 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 transition"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-stone-400 w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            title="Perbesar"
            className="p-2 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 transition"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            title="Reset Zoom"
            className="p-2 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-stone-700 mx-1" />

          <Button
            size="sm"
            variant="secondary"
            onClick={handleDownloadClick}
            isLoading={isDownloading}
            icon={<Download className="w-3.5 h-3.5" />}
            className="shadow-none text-xs"
          >
            Unduh Berkas
          </Button>

          <button
            onClick={onClose}
            title="Tutup Preview"
            className="p-2 ml-1 rounded-lg text-stone-400 hover:text-white hover:bg-rose-950/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Viewport */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto select-none relative">
        <div
          className="transition-transform duration-150 ease-out max-h-full max-w-full flex items-center justify-center"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={media.file_url}
            alt={media.title}
            className="max-h-[75vh] max-w-[90vw] object-contain rounded-lg shadow-2xl border border-stone-800"
          />
        </div>
      </div>

      {/* Bottom Metadata Bar */}
      <div className="px-6 py-3.5 bg-stone-900/90 border-t border-stone-800 text-xs text-stone-300 flex flex-wrap items-center justify-between gap-3 z-20">
        <div className="space-y-0.5 max-w-xl">
          {media.description && (
            <p className="text-stone-300 leading-relaxed">{media.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-stone-400 pt-1">
            {media.event?.event_date && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                {formatDate(media.event.event_date)}
              </span>
            )}
            {media.event?.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                {media.event.location}
              </span>
            )}
            <span>Format: {media.mime_type}</span>
          </div>
        </div>

        <div className="text-stone-400 text-right">
          <span className="text-amber-400 font-semibold">{media.download_count}</span> kali diunduh
        </div>
      </div>
    </div>
  );
};
