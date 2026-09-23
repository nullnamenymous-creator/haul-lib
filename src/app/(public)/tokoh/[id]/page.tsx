'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Figure, HaulEvent, MediaFile, MediaType } from '@/types/database';
import { getFigureById, getHaulEvents, getMediaFiles } from '@/lib/archive-service';
import { formatBytes } from '@/lib/utils';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Sparkles,
  BookOpen,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Eye,
  Download,
  Lock,
} from 'lucide-react';
import { checkIsAdmin } from '@/lib/auth-check';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { PhotoLightbox } from '@/components/media/PhotoLightbox';
import { VideoPlayer } from '@/components/media/VideoPlayer';
import { AudioPlayer } from '@/components/media/AudioPlayer';
import { PdfPreviewModal } from '@/components/media/PdfPreviewModal';

export default function TokohDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [figure, setFigure] = useState<Figure | null>(null);
  const [events, setEvents] = useState<HaulEvent[]>([]);
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
        const [fig, allEvents, allMedia, adminStatus] = await Promise.all([
          getFigureById(id),
          getHaulEvents(),
          getMediaFiles(),
          checkIsAdmin(),
        ]);
        setFigure(fig);
        setEvents(allEvents.filter((e) => e.figure_id === id));
        setMediaList(allMedia.filter((m) => m.event?.figure_id === id));
        setIsAdmin(adminStatus);
      } finally {
        setIsLoading(false);
      }
    }
    if (id) {
      loadData();
    }
  }, [id]);

  // Realtime updates for media under this figure
  useEffect(() => {
    if (!id) return;
    const supabase = createClient();
    const channelName = `realtime-tokoh-${id}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'media_files' },
        async () => {
          const allMedia = await getMediaFiles();
          setMediaList(allMedia.filter((m) => m.event?.figure_id === id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  if (!figure) {
    return (
      <div className="flex-1 max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-800">Tokoh Tidak Ditemukan</h2>
        <p className="text-sm text-stone-500">
          Data ulama atau tokoh yang Anda tuju tidak tercatat dalam repositori.
        </p>
        <Link href="/">
          <Button variant="primary">Kembali ke Katalog</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-islamic-pattern pb-20">
      {/* Header Profile Section */}
      <section className="bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-800 text-white pt-8 pb-16 border-b border-amber-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-emerald-200 hover:text-amber-300 transition mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
            {/* Avatar */}
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl p-1 bg-gradient-to-tr from-amber-400 to-amber-200 shrink-0 shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={figure.avatar_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600'}
                alt={figure.name}
                className="w-full h-full object-cover rounded-[22px]"
              />
            </div>

            {/* Info */}
            <div className="space-y-3 text-center md:text-left flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ulama & Guru Pembimbing</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-white">
                {figure.name}
              </h1>
              {figure.title && (
                <p className="text-sm sm:text-base text-amber-200/90 font-medium">
                  {figure.title}
                </p>
              )}
              {figure.bio && (
                <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-3xl pt-1">
                  {figure.bio}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* HAUL EVENTS LIST */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-emerald-950">
              Riwayat & Perhelatan Haul
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Dokumentasi peringatan haul yang tersimpan dalam arsip digital
            </p>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-lg">
            {events.length} Perhelatan
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {events.map((ev) => (
            <Link
              key={ev.id}
              href={`/haul/${ev.id}`}
              className="p-5 rounded-2xl bg-white border border-stone-200/90 hover:border-amber-500 shadow-sm hover:shadow-islamic transition flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-amber-700 font-semibold">
                  <span>{ev.hijri_year || `${ev.masehi_year} M`}</span>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/60 text-[11px]">
                    Tahun {ev.masehi_year}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-base text-stone-900 group-hover:text-emerald-900 transition">
                  {ev.title}
                </h3>
                {ev.location && (
                  <p className="text-xs text-stone-500 flex items-center gap-1.5 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="truncate">{ev.location}</span>
                  </p>
                )}
              </div>
              <div className="pt-2 border-t border-stone-100 text-xs text-emerald-800 font-medium flex items-center justify-between">
                <span>Buka Galeri Media & Arsip</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* TOKOH'S MEDIA ARCHIVE GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-emerald-950">
              Koleksi Berkas & Media Terkait
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Foto, rekaman suara, video dokumentasi, dan risalah PDF
            </p>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg">
            {mediaList.length} Berkas
          </span>
        </div>

        {mediaList.length === 0 ? (
          <p className="text-sm text-stone-500 py-10 text-center">
            Belum ada berkas media khusus untuk tokoh ini.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
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

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h4
                      onClick={() => handleOpenPreview(item)}
                      className="font-serif font-bold text-sm text-stone-900 hover:text-emerald-900 cursor-pointer line-clamp-2"
                    >
                      {item.title}
                    </h4>
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
