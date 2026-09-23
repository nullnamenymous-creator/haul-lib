'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Figure, HaulEvent, MediaFile, MediaType } from '@/types/database';
import { getFigures, getHaulEvents, getMediaFiles } from '@/lib/archive-service';
import { formatBytes, formatDate } from '@/lib/utils';
import {
  Search,
  SlidersHorizontal,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Eye,
  Download,
  Calendar,
  MapPin,
  Sparkles,
  BookOpen,
  Filter,
  Check,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { checkIsAdmin } from '@/lib/auth-check';
import { useRealtimeMedia } from '@/hooks/useRealtimeMedia';
import { Tabs, TabItem } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { PhotoLightbox } from '@/components/media/PhotoLightbox';
import { VideoPlayer } from '@/components/media/VideoPlayer';
import { AudioPlayer } from '@/components/media/AudioPlayer';
import { PdfPreviewModal } from '@/components/media/PdfPreviewModal';

export default function CatalogPage() {
  const [figures, setFigures] = useState<Figure[]>([]);
  const [events, setEvents] = useState<HaulEvent[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Filters state
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFigureId, setSelectedFigureId] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  // Supabase Realtime synchronization
  const {
    mediaList,
    setMediaList,
    isLoading,
    isLiveConnected,
  } = useRealtimeMedia();

  // Previewer modals state
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [previewType, setPreviewType] = useState<MediaType | null>(null);

  // Fetch initial metadata (figures, events, admin status)
  useEffect(() => {
    async function loadMeta() {
      try {
        const [fetchedFigures, fetchedEvents, adminStatus] = await Promise.all([
          getFigures(),
          getHaulEvents(),
          checkIsAdmin(),
        ]);
        setFigures(fetchedFigures);
        setEvents(fetchedEvents);
        setIsAdmin(adminStatus);
      } catch (err) {
        console.error('Failed to load archive metadata:', err);
      }
    }
    loadMeta();
  }, []);

  // Compute years available from events
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    events.forEach((ev) => {
      if (ev.masehi_year) yearsSet.add(ev.masehi_year);
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [events]);

  // Compute filtered media
  const filteredMedia = useMemo(() => {
    return mediaList.filter((item) => {
      // Filter tab
      if (activeTab !== 'all' && item.file_type !== activeTab) {
        return false;
      }
      // Filter figure
      if (selectedFigureId !== 'all') {
        const itemFigureId = item.event?.figure_id;
        if (itemFigureId !== selectedFigureId) return false;
      }
      // Filter year
      if (selectedYear !== 'all') {
        const itemYear = item.event?.masehi_year;
        if (itemYear?.toString() !== selectedYear) return false;
      }
      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        const matchesEvent = item.event?.title.toLowerCase().includes(q);
        const matchesFigure = item.event?.figure?.name.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesEvent && !matchesFigure) {
          return false;
        }
      }
      return true;
    });
  }, [mediaList, activeTab, selectedFigureId, selectedYear, searchQuery]);

  // Tab definitions with dynamic counts
  const tabs: TabItem[] = [
    {
      id: 'all',
      label: 'Semua Arsip',
      icon: <BookOpen className="w-4 h-4" />,
      count: mediaList.length,
    },
    {
      id: 'photo',
      label: 'Foto Bersejarah',
      icon: <ImageIcon className="w-4 h-4" />,
      count: mediaList.filter((m) => m.file_type === 'photo').length,
    },
    {
      id: 'video',
      label: 'Video Dokumentasi',
      icon: <Video className="w-4 h-4" />,
      count: mediaList.filter((m) => m.file_type === 'video').length,
    },
    {
      id: 'audio',
      label: 'Rekaman Suara',
      icon: <Music className="w-4 h-4" />,
      count: mediaList.filter((m) => m.file_type === 'audio').length,
    },
    {
      id: 'document',
      label: 'Dokumen PDF',
      icon: <FileText className="w-4 h-4" />,
      count: mediaList.filter((m) => m.file_type === 'document').length,
    },
  ];

  // Open Preview Modal
  const handleOpenPreview = (item: MediaFile) => {
    setSelectedMedia(item);
    setPreviewType(item.file_type);
  };

  const handleClosePreview = () => {
    setSelectedMedia(null);
    setPreviewType(null);
  };

  // Download Trigger
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

    // Update count locally
    setMediaList((prev) =>
      prev.map((m) =>
        m.id === item.id ? { ...m, download_count: m.download_count + 1 } : m
      )
    );

    // Direct download anchor
    const a = document.createElement('a');
    a.href = item.file_url;
    a.download = item.title;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex-1 flex flex-col bg-islamic-pattern pb-16">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-islamic-dark via-emerald-islamic to-emerald-900 text-white pt-12 sm:pt-16 pb-16 sm:pb-24 border-b border-amber-600/30">
        {/* Subtle decorative pattern rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-700/20 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-medium backdrop-blur-sm shadow-sm animate-in fade-in">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Koleksi Terbuka Khazanah & Manaqib Para Kekasih Allah</span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs shadow-inner backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLiveConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isLiveConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              </span>
              <span className="font-mono text-[11px] tracking-wide text-emerald-300">
                {isLiveConnected ? 'Supabase Realtime Terhubung' : 'Sinkronisasi Realtime...'}
              </span>
            </div>
          </div>

          {/* Title with Arabic typography styling */}
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-tight">
            Repositori & Arsip Digital{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400">
              Haul & Majelis
            </span>
          </h1>

          <p className="mt-4 sm:mt-6 text-sm sm:text-base lg:text-lg text-emerald-100/90 max-w-2xl mx-auto font-normal leading-relaxed">
            Menghimpun dan memelihara dokumentasi bersejarah, lantunan maulid & qasidah, video tausiyah, serta risalah doa untuk generasi penerus pecinta ulama.
          </p>

          {/* Quick Tokoh Highlight Cards */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            {figures.map((fig) => (
              <Link
                key={fig.id}
                href={`/tokoh/${fig.id}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-700/60 hover:border-amber-400/60 text-xs text-emerald-100 hover:text-amber-300 transition shadow-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fig.avatar_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100'}
                  alt={fig.name}
                  className="w-5 h-5 rounded-full object-cover border border-amber-400/40"
                />
                <span className="font-medium">{fig.name}</span>
                <ChevronRight className="w-3 h-3 text-amber-400/80" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FILTER & SEARCH CONTROL BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 w-full">
        <div className="bg-white rounded-2xl shadow-islamic-lg border border-stone-200/90 p-4 sm:p-6 space-y-4">
          {/* Row 1: Search Input & Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center">
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari judul berkas, ulama, ceramah, atau haul..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Dropdown Tokoh */}
            <div className="md:col-span-3">
              <select
                value={selectedFigureId}
                onChange={(e) => setSelectedFigureId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700 transition cursor-pointer"
              >
                <option value="all">Semua Ulama / Tokoh</option>
                {figures.map((fig) => (
                  <option key={fig.id} value={fig.id}>
                    {fig.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dropdown Tahun */}
            <div className="md:col-span-3">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700 transition cursor-pointer"
              >
                <option value="all">Semua Tahun Peringatan</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr.toString()}>
                    Tahun {yr} M
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Media Type Tabs */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between flex-wrap gap-3">
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onChange={setActiveTab}
              className="w-full md:w-auto"
            />

            <div className="text-xs text-stone-500 font-medium hidden lg:block">
              Menampilkan <span className="font-semibold text-emerald-900">{filteredMedia.length}</span> arsip
            </div>
          </div>
        </div>
      </section>

      {/* MEDIA CARDS GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-12 w-full">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-800 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-stone-500 font-medium">Memuat koleksi arsip digital...</p>
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-stone-200 p-8 shadow-xs max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900">Arsip Tidak Ditemukan</h3>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-sm mx-auto">
              Tidak ada berkas yang sesuai dengan kriteria pencarian atau filter yang dipilih. Coba atur ulang kata kunci atau filter.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setActiveTab('all');
                setSearchQuery('');
                setSelectedFigureId('all');
                setSelectedYear('all');
              }}
              className="mt-4"
            >
              Reset Semua Filter
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {filteredMedia.map((item) => {
              const fileTypeConfig = {
                photo: {
                  icon: <ImageIcon className="w-3.5 h-3.5" />,
                  label: 'Foto',
                  color: 'bg-emerald-800 text-emerald-100',
                  previewText: 'Lihat Foto',
                },
                video: {
                  icon: <Video className="w-3.5 h-3.5" />,
                  label: 'Video',
                  color: 'bg-amber-700 text-amber-100',
                  previewText: 'Putar Video',
                },
                audio: {
                  icon: <Music className="w-3.5 h-3.5" />,
                  label: 'Audio',
                  color: 'bg-teal-800 text-teal-100',
                  previewText: 'Dengar Audio',
                },
                document: {
                  icon: <FileText className="w-3.5 h-3.5" />,
                  label: 'PDF',
                  color: 'bg-stone-800 text-stone-100',
                  previewText: 'Buka Dokumen',
                },
              }[item.file_type];

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl overflow-hidden border border-stone-200/80 shadow-sm hover:shadow-islamic transition-all duration-300 flex flex-col group"
                >
                  {/* Card Thumbnail / Header */}
                  <div
                    onClick={() => handleOpenPreview(item)}
                    className="relative aspect-[16/10] bg-stone-100 cursor-pointer overflow-hidden select-none"
                  >
                    {item.file_type === 'photo' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.file_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : item.file_type === 'video' ? (
                      <div className="w-full h-full bg-stone-900 flex flex-col items-center justify-center relative">
                        <div className="w-12 h-12 rounded-full bg-amber-500/80 group-hover:bg-amber-500 text-stone-950 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition">
                          <Video className="w-6 h-6 ml-0.5 fill-current" />
                        </div>
                        <span className="text-[11px] text-amber-200 mt-2 font-medium">Video Dokumentasi</span>
                      </div>
                    ) : item.file_type === 'audio' ? (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-950 to-emerald-900 flex flex-col items-center justify-center relative p-4 text-center">
                        <div className="w-12 h-12 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                          <Music className="w-6 h-6 fill-current" />
                        </div>
                        <span className="text-[11px] text-amber-200 mt-2 font-medium">Lantunan Manaqib & Qasidah</span>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-stone-50 border-b border-stone-200 flex flex-col items-center justify-center p-4 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-stone-200 text-emerald-950 flex items-center justify-center shadow-xs group-hover:scale-105 transition">
                          <FileText className="w-6 h-6" />
                        </div>
                        <span className="text-[11px] text-stone-600 mt-2 font-medium">Dokumen Naskah & Doa</span>
                      </div>
                    )}

                    {/* Type Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide backdrop-blur-md shadow-sm ${fileTypeConfig.color}`}>
                        {fileTypeConfig.icon}
                        <span>{fileTypeConfig.label}</span>
                      </span>
                    </div>

                    {/* File Size Badge */}
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-0.5 rounded-md bg-stone-950/70 text-white text-[11px] font-mono backdrop-blur-md">
                        {formatBytes(item.file_size)}
                      </span>
                    </div>

                    {/* Hover Overlay preview button hint */}
                    <div className="absolute inset-0 bg-emerald-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-emerald-950 font-semibold text-xs shadow-md transform -translate-y-1 group-hover:translate-y-0 transition">
                        <Eye className="w-3.5 h-3.5 text-amber-600" />
                        <span>{fileTypeConfig.previewText}</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      {/* Event Tag */}
                      <div className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold truncate">
                        <span className="truncate">
                          {item.event?.title || 'Arsip Haul'}
                        </span>
                      </div>

                      {/* Title */}
                      <h3
                        onClick={() => handleOpenPreview(item)}
                        className="font-serif font-bold text-sm sm:text-base text-stone-900 group-hover:text-emerald-900 transition line-clamp-2 cursor-pointer leading-snug"
                      >
                        {item.title}
                      </h3>

                      {/* Description */}
                      {item.description && (
                        <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Metadata Sub-row */}
                    <div className="pt-2 border-t border-stone-100 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-stone-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-emerald-700" />
                          {item.event?.masehi_year ? `${item.event.masehi_year} M` : '-'}
                        </span>
                        <span>{item.download_count} unduhan</span>
                      </div>

                      {/* Action Buttons: Preview & Unduh */}
                      {item.file_type === 'document' && !isAdmin ? (
                        <div className="space-y-1.5 pt-1">
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
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenPreview(item)}
                            icon={<Eye className="w-3.5 h-3.5 text-emerald-800" />}
                            className="w-full text-xs py-1.5 h-8 font-medium"
                          >
                            Preview
                          </Button>

                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleDownload(item)}
                            icon={<Download className="w-3.5 h-3.5 text-amber-300" />}
                            className="w-full text-xs py-1.5 h-8 font-semibold bg-emerald-900 hover:bg-emerald-950"
                          >
                            {item.file_type === 'document' ? 'Unduh (Admin)' : 'Unduh'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* IN-BROWSER PREVIEW MODALS INTEGRATION */}
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
