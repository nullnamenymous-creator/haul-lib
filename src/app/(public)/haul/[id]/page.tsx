'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { HaulEvent, MediaFile, MediaType } from '@/types/database';
import { getHaulEventById, getMediaFiles } from '@/lib/archive-service';
import { formatBytes, formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  Eye,
  Download,
  Lock,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
} from 'lucide-react';
import { checkIsAdmin } from '@/lib/auth-check';
import { Button } from '@/components/ui/Button';
import { PhotoLightbox } from '@/components/media/PhotoLightbox';
import { VideoPlayer } from '@/components/media/VideoPlayer';
import { AudioPlayer } from '@/components/media/AudioPlayer';
import { PdfPreviewModal } from '@/components/media/PdfPreviewModal';

export default function HaulDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [event, setEvent] = useState<HaulEvent | null>(null);
  const [mediaList, setMediaList] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Preview modals
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [previewType, setPreviewType] = useState<MediaType | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [ev, allMedia, adminStatus] = await Promise.all([
          getHaulEventById(id),
          getMediaFiles(),
          checkIsAdmin(),
        ]);
        setEvent(ev);
        setMediaList(allMedia.filter((m) => m.event_id === id));
        setIsAdmin(adminStatus);
      } finally {
        setIsLoading(false);
      }
    }
    if (id) {
      loadData();
    }
  }, [id]);

  const handleOpenPreview = (item: MediaFile) => {
    setSelectedMedia(item);
    setPreviewType(item.file_type);
  };

  const handleClosePreview = () => {
    setSelectedMedia(null);
    setPreviewType(null);
  };

  const handleDownload = (item: MediaFile) => {
    if (item.file_type === 'document' && !isAdmin) {
      alert('Akses berkas dilindungi. Unduhan naskah dokumen hanya dapat dilakukan oleh Pengurus Majelis / Admin.');
      return;
    }

    fetch('/api/increment-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId: item.id }),
    }).catch(() => {});

    setMediaList((prev) =>
      prev.map((m) =>
        m.id === item.id ? { ...m, download_count: m.download_count + 1 } : m
      )
    );

    const a = document.createElement('a');
    a.href = item.file_url;
    a.download = item.title;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-emerald-300 border-t-emerald-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex-1 max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-800">Acara Haul Tidak Ditemukan</h2>
        <p className="text-sm text-stone-500">
          Data perhelatan haul yang Anda tuju tidak tercatat dalam repositori.
        </p>
        <Link href="/">
          <Button variant="primary">Kembali ke Katalog</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-islamic-pattern pb-20">
      {/* Event Banner */}
      <section className="bg-gradient-to-b from-emerald-islamic-dark via-emerald-islamic to-emerald-900 text-white pt-8 pb-16 border-b border-amber-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-emerald-200 hover:text-amber-300 transition mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>

          <div className="space-y-4 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-semibold">
                Haul Akbar {event.masehi_year} M
              </span>
              {event.hijri_year && (
                <span className="px-3 py-1 rounded-full bg-emerald-950/70 text-emerald-200 border border-emerald-700/60 text-xs">
                  {event.hijri_year}
                </span>
              )}
            </div>

            <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
              {event.title}
            </h1>

            {/* Event Meta Details */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-emerald-100/90 pt-2">
              {event.figure && (
                <Link
                  href={`/tokoh/${event.figure_id}`}
                  className="flex items-center gap-2 hover:text-amber-300 transition"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold underline underline-offset-4">
                    Tokoh: {event.figure.name}
                  </span>
                </Link>
              )}
              {event.event_date && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>{formatDate(event.event_date)}</span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>{event.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* MEDIA GRID OF THIS EVENT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-emerald-950">
              Dokumentasi & Berkas Haul
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Kumpulan arsip foto, video ceramah, audio manaqib, dan susunan doa
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-emerald-100 text-emerald-900 rounded-lg">
            {mediaList.length} Berkas
          </span>
        </div>

        {mediaList.length === 0 ? (
          <p className="text-sm text-stone-500 py-12 text-center">
            Belum ada berkas arsip yang diunggah untuk perhelatan haul ini.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 mt-8">
            {mediaList.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl overflow-hidden border border-stone-200/90 shadow-sm hover:shadow-islamic transition flex flex-col group"
              >
                <div
                  onClick={() => handleOpenPreview(item)}
                  className="aspect-[16/10] bg-stone-100 relative cursor-pointer overflow-hidden"
                >
                  {item.file_type === 'photo' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.file_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  ) : (
                    <div className="w-full h-full bg-stone-900 flex items-center justify-center text-amber-300">
                      {item.file_type === 'video' ? (
                        <Video className="w-10 h-10" />
                      ) : item.file_type === 'audio' ? (
                        <Music className="w-10 h-10" />
                      ) : (
                        <FileText className="w-10 h-10 text-stone-200" />
                      )}
                    </div>
                  )}

                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-stone-950/70 text-white backdrop-blur-md">
                    {item.file_type}
                  </span>
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-mono bg-stone-950/70 text-white backdrop-blur-md">
                    {formatBytes(item.file_size)}
                  </span>
                </div>

                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3
                      onClick={() => handleOpenPreview(item)}
                      className="font-serif font-bold text-sm sm:text-base text-stone-900 hover:text-emerald-900 cursor-pointer line-clamp-2"
                    >
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-stone-500 line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {item.file_type === 'document' && !isAdmin ? (
                    <div className="space-y-1.5 pt-2 border-t border-stone-100">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleOpenPreview(item)}
                        icon={<Eye className="w-3.5 h-3.5 text-amber-300" />}
                        className="w-full text-xs py-1.5 h-8 font-semibold bg-emerald-900 hover:bg-emerald-950"
                      >
                        Buka Dokumen (Preview)
                      </Button>
                      <div className="flex items-center justify-center gap-1.5 text-[10px] text-amber-800 font-medium bg-amber-50/80 border border-amber-200/50 py-0.5 rounded-md">
                        <Lock className="w-2.5 h-2.5 text-amber-600" />
                        <span>Unduh berkas dibatasi untuk pengurus</span>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-stone-100 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenPreview(item)}
                        icon={<Eye className="w-3.5 h-3.5" />}
                        className="flex-1 text-xs py-1.5 h-8"
                      >
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleDownload(item)}
                        icon={<Download className="w-3.5 h-3.5 text-amber-300" />}
                        className="flex-1 text-xs py-1.5 h-8 bg-emerald-900 hover:bg-emerald-950"
                      >
                        {item.file_type === 'document' ? 'Unduh (Admin)' : 'Unduh'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MODALS */}
      {previewType === 'photo' && (
        <PhotoLightbox
          media={selectedMedia}
          isOpen={true}
          onClose={handleClosePreview}
          onDownload={handleDownload}
        />
      )}
      {previewType === 'video' && (
        <VideoPlayer
          media={selectedMedia}
          isOpen={true}
          onClose={handleClosePreview}
          onDownload={handleDownload}
        />
      )}
      {previewType === 'audio' && (
        <AudioPlayer
          media={selectedMedia}
          isOpen={true}
          onClose={handleClosePreview}
          onDownload={handleDownload}
        />
      )}
      {previewType === 'document' && (
        <PdfPreviewModal
          media={selectedMedia}
          isOpen={true}
          onClose={handleClosePreview}
          onDownload={handleDownload}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
