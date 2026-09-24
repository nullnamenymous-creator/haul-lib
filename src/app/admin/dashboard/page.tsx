'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  getFigures,
  getHaulEvents,
  getMediaFiles,
  updateMediaMetadata,
  deleteMediaArchive,
  createHaulEvent,
  updateHaulEvent,
  deleteHaulEvent,
} from '@/lib/archive-service';
import { MediaFile, Figure, HaulEvent } from '@/types/database';
import { formatBytes, formatDate } from '@/lib/utils';
import {
  Upload,
  Trash2,
  Edit,
  Search,
  ExternalLink,
  LogOut,
  FolderOpen,
  ArrowDownToLine,
  Users,
  Calendar,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  AlertTriangle,
  CheckCircle,
  Plus,
  MapPin,
  CalendarDays,
} from 'lucide-react';
import { checkIsAdmin, clearAdminSession } from '@/lib/auth-check';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea, Select } from '@/components/ui/Input';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [mediaList, setMediaList] = useState<MediaFile[]>([]);
  const [figures, setFigures] = useState<Figure[]>([]);
  const [events, setEvents] = useState<HaulEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tab State: 'media' (Berkas Arsip) or 'events' (Perhelatan Haul)
  const [activeTab, setActiveTab] = useState<'media' | 'events'>('media');

  // Search Queries
  const [searchQuery, setSearchQuery] = useState('');
  const [eventSearchQuery, setEventSearchQuery] = useState('');

  // Media Edit Modal State
  const [editingMedia, setEditingMedia] = useState<MediaFile | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editEventId, setEditEventId] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Media Delete Modal State
  const [deletingMedia, setDeletingMedia] = useState<MediaFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Haul Event Form Modal State (Tambah / Ubah)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<HaulEvent | null>(null);
  const [eventFormTitle, setEventFormTitle] = useState('');
  const [eventFormFigureId, setEventFormFigureId] = useState('');
  const [eventFormMasehiYear, setEventFormMasehiYear] = useState<number>(new Date().getFullYear());
  const [eventFormHijriYear, setEventFormHijriYear] = useState('');
  const [eventFormDate, setEventFormDate] = useState('');
  const [eventFormLocation, setEventFormLocation] = useState('');
  const [isSavingEvent, setIsSavingEvent] = useState(false);

  // Haul Event Delete Modal State
  const [deletingEvent, setDeletingEvent] = useState<HaulEvent | null>(null);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);

  // Notification Banner
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  useEffect(() => {
    async function checkAuthAndLoad() {
      const isAdmin = await checkIsAdmin();
      if (!isAdmin) {
        router.replace('/admin/login');
        return;
      }
      setIsAuthorized(true);

      try {
        setIsLoading(true);
        const [allMedia, allFigures, allEvents] = await Promise.all([
          getMediaFiles(),
          getFigures(),
          getHaulEvents(),
        ]);
        setMediaList(allMedia);
        setFigures(allFigures);
        setEvents(allEvents);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuthAndLoad();
  }, [router]);

  // Supabase Realtime Subscription for Admin Dashboard (Media & Events)
  useEffect(() => {
    if (!isAuthorized) return;

    const supabase = createClient();
    const channelName = `admin-dashboard-realtime-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'media_files' },
        async (payload) => {
          console.log('[Admin Realtime Media] Event:', payload.eventType);
          if (payload.eventType === 'INSERT') {
            try {
              const { data: newMedia } = await (supabase
                .from('media_files') as any)
                .select('*, event:haul_events(*, figure:figures(*))')
                .eq('id', payload.new.id)
                .single();

              if (newMedia) {
                setMediaList((prev) => [newMedia as MediaFile, ...prev.filter((m) => m.id !== newMedia.id)]);
              } else {
                const refreshed = await getMediaFiles();
                setMediaList(refreshed);
              }
            } catch {
              const refreshed = await getMediaFiles();
              setMediaList(refreshed);
            }
          } else if (payload.eventType === 'UPDATE') {
            setMediaList((prev) =>
              prev.map((item) =>
                item.id === payload.new.id
                  ? { ...item, ...payload.new, event: item.event }
                  : item
              )
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any)?.id;
            if (deletedId) {
              setMediaList((prev) => prev.filter((item) => item.id !== deletedId));
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'haul_events' },
        async () => {
          console.log('[Admin Realtime Haul Events] Change detected');
          try {
            const refreshedEvents = await getHaulEvents();
            setEvents(refreshedEvents);
          } catch (e) {
            console.warn('Realtime refresh haul_events failed', e);
          }
        }
      )
      .subscribe((status) => {
        setIsLiveConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthorized]);

  const handleLogout = async () => {
    await clearAdminSession();
    router.push('/admin/login');
  };

  // Metrics computation
  const totalDownloads = useMemo(() => {
    return mediaList.reduce((acc, curr) => acc + (curr.download_count || 0), 0);
  }, [mediaList]);

  const filteredMedia = useMemo(() => {
    if (!searchQuery.trim()) return mediaList;
    const q = searchQuery.toLowerCase();
    return mediaList.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q)) ||
        (m.event?.title && m.event.title.toLowerCase().includes(q))
    );
  }, [mediaList, searchQuery]);

  const filteredEvents = useMemo(() => {
    if (!eventSearchQuery.trim()) return events;
    const q = eventSearchQuery.toLowerCase();
    return events.filter(
      (ev) =>
        ev.title.toLowerCase().includes(q) ||
        (ev.figure?.name && ev.figure.name.toLowerCase().includes(q)) ||
        (ev.location && ev.location.toLowerCase().includes(q)) ||
        ev.masehi_year.toString().includes(q) ||
        (ev.hijri_year && ev.hijri_year.toLowerCase().includes(q))
    );
  }, [events, eventSearchQuery]);

  const getEventMediaCount = (eventId: string) => {
    return mediaList.filter((m) => m.event_id === eventId).length;
  };

  // Open Edit Media Modal
  const handleOpenEdit = (media: MediaFile) => {
    setEditingMedia(media);
    setEditTitle(media.title);
    setEditDesc(media.description || '');
    setEditEventId(media.event_id);
  };

  // Save Media Edit
  const handleSaveEdit = async () => {
    if (!editingMedia) return;
    setIsSavingEdit(true);
    setFeedbackMsg(null);

    try {
      const supabase = createClient();
      const { error } = await (supabase.from('media_files') as any)
        .update({
          title: editTitle,
          description: editDesc,
          event_id: editEventId,
        })
        .eq('id', editingMedia.id);

      if (error) throw error;

      const updatedEvent = events.find((e) => e.id === editEventId);

      setMediaList((prev) =>
        prev.map((item) =>
          item.id === editingMedia.id
            ? {
                ...item,
                title: editTitle,
                description: editDesc,
                event_id: editEventId,
                event: updatedEvent || item.event,
              }
            : item
        )
      );

      setFeedbackMsg({ type: 'success', text: 'Metadata berkas berhasil diperbarui!' });
      setEditingMedia(null);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Gagal menyimpan perubahan.' });
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete Media
  const handleConfirmDelete = async () => {
    if (!deletingMedia) return;
    setIsDeleting(true);
    setFeedbackMsg(null);

    try {
      const res = await deleteMediaArchive(deletingMedia.id, deletingMedia.file_url);
      if (!res.success) {
        throw new Error(res.error || 'Gagal menghapus berkas.');
      }

      setMediaList((prev) => prev.filter((m) => m.id !== deletingMedia.id));
      setFeedbackMsg({ type: 'success', text: `Berkas "${deletingMedia.title}" berhasil dihapus!` });
      setDeletingMedia(null);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Gagal menghapus berkas.' });
    } finally {
      setIsDeleting(false);
    }
  };

  // --- HAUL EVENT CRUD HANDLERS ---
  const handleOpenCreateEvent = () => {
    setEditingEvent(null);
    setEventFormTitle('');
    setEventFormFigureId(figures[0]?.id || '');
    setEventFormMasehiYear(new Date().getFullYear());
    setEventFormHijriYear('');
    setEventFormDate('');
    setEventFormLocation('');
    setIsEventModalOpen(true);
  };

  const handleOpenEditEvent = (event: HaulEvent) => {
    setEditingEvent(event);
    setEventFormTitle(event.title);
    setEventFormFigureId(event.figure_id);
    setEventFormMasehiYear(event.masehi_year);
    setEventFormHijriYear(event.hijri_year || '');
    setEventFormDate(event.event_date ? event.event_date.split('T')[0] : '');
    setEventFormLocation(event.location || '');
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventFormTitle.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Judul perhelatan haul wajib diisi.' });
      return;
    }
    if (!eventFormFigureId) {
      setFeedbackMsg({ type: 'error', text: 'Pilih tokoh / ulama shahibul haul.' });
      return;
    }

    try {
      setIsSavingEvent(true);
      const payload = {
        title: eventFormTitle.trim(),
        figure_id: eventFormFigureId,
        masehi_year: Number(eventFormMasehiYear) || new Date().getFullYear(),
        hijri_year: eventFormHijriYear.trim() || null,
        event_date: eventFormDate ? new Date(eventFormDate).toISOString() : null,
        location: eventFormLocation.trim() || null,
      };

      if (editingEvent) {
        const res = await updateHaulEvent(editingEvent.id, payload);
        if (!res.success) throw new Error(res.error);
        setFeedbackMsg({ type: 'success', text: `Perhelatan "${eventFormTitle}" berhasil diperbarui!` });
      } else {
        const res = await createHaulEvent(payload);
        if (!res.success) throw new Error(res.error);
        setFeedbackMsg({ type: 'success', text: `Perhelatan haul baru "${eventFormTitle}" berhasil ditambahkan!` });
      }

      const refreshed = await getHaulEvents();
      setEvents(refreshed);
      setIsEventModalOpen(false);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Gagal menyimpan perhelatan haul.' });
    } finally {
      setIsSavingEvent(false);
    }
  };

  const handleConfirmDeleteEvent = async () => {
    if (!deletingEvent) return;
    try {
      setIsDeletingEvent(true);
      const res = await deleteHaulEvent(deletingEvent.id);
      if (!res.success) {
        throw new Error(res.error || 'Gagal menghapus perhelatan haul.');
      }

      setFeedbackMsg({
        type: 'success',
        text: `Perhelatan "${deletingEvent.title}" berhasil dihapus dari repositori.`,
      });

      const refreshed = await getHaulEvents();
      setEvents(refreshed);
      setDeletingEvent(null);
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'Gagal menghapus perhelatan haul.',
      });
    } finally {
      setIsDeletingEvent(false);
    }
  };

  if (isAuthorized === null || !isAuthorized) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-emerald-300 border-t-emerald-800 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-emerald-950 font-serif">Memeriksa Otorisasi Akses Admin...</p>
        <p className="text-xs text-stone-500 mt-1">Hanya pengurus terdaftar yang berhak mengakses dasbor arsip.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-emerald-950 text-white border-b border-emerald-900 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-lg bg-amber-400 text-emerald-950 flex items-center justify-center p-0.5 overflow-hidden shadow-sm shrink-0">
                <Image
                  src="/icons/logo-haol.png"
                  alt="Logo Haul & Majelis"
                  width={36}
                  height={36}
                  className="w-full h-full object-contain rounded-md"
                />
              </div>
              <span className="font-serif font-bold text-base tracking-wide text-white group-hover:text-amber-300 transition">
                Repositori Berkas & Dokumen Haul
              </span>
            </Link>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-900 text-amber-300 border border-emerald-800">
              Penyimpanan Dokumen
            </span>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-900/80 border border-emerald-700/60 text-emerald-300 text-xs font-mono">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLiveConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isLiveConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </span>
              <span className="text-[11px]">{isLiveConnected ? 'Realtime Aktif' : 'Menghubungkan...'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'events' ? (
              <Button
                size="sm"
                variant="secondary"
                icon={<Plus className="w-3.5 h-3.5" />}
                className="text-xs bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold"
                onClick={handleOpenCreateEvent}
              >
                Tambah Haul
              </Button>
            ) : (
              <Link href="/admin/dashboard/upload">
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Upload className="w-3.5 h-3.5" />}
                  className="text-xs bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold"
                >
                  Unggah Berkas
                </Button>
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-900 transition"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-8">
        {/* Feedback Alert */}
        {feedbackMsg && (
          <div
            className={`p-4 rounded-xl flex items-center justify-between gap-3 text-xs sm:text-sm animate-in fade-in ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMsg.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
            <button
              onClick={() => setFeedbackMsg(null)}
              className="text-stone-400 hover:text-stone-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-stone-500 font-medium">Total Berkas Media</p>
              <h3 className="text-xl sm:text-2xl font-bold text-stone-900">{mediaList.length}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-800">
              <ArrowDownToLine className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-stone-500 font-medium">Total Diunduh</p>
              <h3 className="text-xl sm:text-2xl font-bold text-stone-900">{totalDownloads}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-800">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-stone-500 font-medium">Tokoh / Ulama</p>
              <h3 className="text-xl sm:text-2xl font-bold text-stone-900">{figures.length}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-800">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-stone-500 font-medium">Perhelatan Haul</p>
              <h3 className="text-xl sm:text-2xl font-bold text-stone-900">{events.length}</h3>
            </div>
          </div>
        </div>

        {/* SECTION TABS */}
        <div className="flex items-center gap-3 border-b border-stone-200">
          <button
            onClick={() => setActiveTab('media')}
            className={`pb-3.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'media'
                ? 'border-emerald-800 text-emerald-950 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Koleksi Berkas Arsip</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-stone-100 text-stone-700 font-mono">
              {mediaList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`pb-3.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'events'
                ? 'border-emerald-800 text-emerald-950 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Perhelatan Haul</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-900 font-mono">
              {events.length}
            </span>
          </button>
        </div>

        {/* TAB 1: MEDIA FILES MANAGEMENT */}
        {activeTab === 'media' && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            {/* Table Header controls */}
            <div className="p-5 border-b border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-lg font-bold text-stone-900">
                  Manajemen Berkas Repositori
                </h2>
                <p className="text-xs text-stone-500">
                  Daftar semua arsip foto, video, audio, dan risalah manaqib
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari berkas di dasbor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>
            </div>

            {/* Table body */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Berkas</th>
                    <th className="py-3.5 px-4">Tipe</th>
                    <th className="py-3.5 px-4">Perhelatan Haul</th>
                    <th className="py-3.5 px-4">Ukuran</th>
                    <th className="py-3.5 px-4">Unduhan</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-stone-500">
                        Memuat data berkas...
                      </td>
                    </tr>
                  ) : filteredMedia.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-stone-500">
                        Tidak ada berkas yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredMedia.map((item) => (
                      <tr key={item.id} className="hover:bg-stone-50/70 transition">
                        {/* Media Title & Thumbnail */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-stone-100 overflow-hidden shrink-0 border border-stone-200 flex items-center justify-center">
                              {item.file_type === 'photo' ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.file_url}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : item.file_type === 'video' ? (
                                <Video className="w-5 h-5 text-amber-600" />
                              ) : item.file_type === 'audio' ? (
                                <Music className="w-5 h-5 text-teal-600" />
                              ) : (
                                <FileText className="w-5 h-5 text-stone-600" />
                              )}
                            </div>
                            <div className="truncate max-w-xs sm:max-w-md">
                              <p className="font-semibold text-stone-900 truncate">
                                {item.title}
                              </p>
                              <p className="text-[11px] text-stone-400 truncate">
                                Ditambahkan: {formatDate(item.created_at)}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase bg-stone-100 text-stone-700">
                            {item.file_type}
                          </span>
                        </td>

                        {/* Event */}
                        <td className="py-3.5 px-4 text-stone-600 max-w-xs truncate">
                          {item.event?.title || '-'}
                        </td>

                        {/* Size */}
                        <td className="py-3.5 px-4 font-mono text-xs text-stone-500 whitespace-nowrap">
                          {formatBytes(item.file_size)}
                        </td>

                        {/* Downloads */}
                        <td className="py-3.5 px-4 font-mono text-xs text-amber-700 font-semibold whitespace-nowrap">
                          {item.download_count}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 rounded-lg text-stone-500 hover:text-emerald-900 hover:bg-emerald-50 transition"
                              title="Edit Metadata"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingMedia(item)}
                              className="p-1.5 rounded-lg text-stone-500 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Hapus Berkas"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: HAUL EVENTS MANAGEMENT */}
        {activeTab === 'events' && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            {/* Table Header controls */}
            <div className="p-5 border-b border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-lg font-bold text-stone-900">
                  Manajemen Perhelatan Haul
                </h2>
                <p className="text-xs text-stone-500">
                  Kelola jadwal perhelatan, tahun pelaksanaan, dan lokasi haul ulama
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari perhelatan haul..."
                    value={eventSearchQuery}
                    onChange={(e) => setEventSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                  />
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  className="bg-emerald-900 hover:bg-emerald-950 text-white font-semibold text-xs whitespace-nowrap"
                  onClick={handleOpenCreateEvent}
                >
                  Tambah Haul Baru
                </Button>
              </div>
            </div>

            {/* Table body */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Nama Perhelatan Haul</th>
                    <th className="py-3.5 px-4">Shahibul Haul</th>
                    <th className="py-3.5 px-4">Tahun</th>
                    <th className="py-3.5 px-4">Pelaksanaan & Lokasi</th>
                    <th className="py-3.5 px-4">Arsip Terkait</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-stone-500">
                        Memuat data perhelatan haul...
                      </td>
                    </tr>
                  ) : filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-stone-500">
                        Tidak ada perhelatan haul yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map((ev) => {
                      const mediaCount = getEventMediaCount(ev.id);
                      return (
                        <tr key={ev.id} className="hover:bg-stone-50/70 transition">
                          {/* Event Title */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 shrink-0">
                                <CalendarDays className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-semibold text-stone-900">
                                  {ev.title}
                                </p>
                                <p className="text-[11px] text-stone-400">
                                  ID: <code className="font-mono text-[10px]">{ev.id.slice(0, 8)}...</code>
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Figure / Ulama */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-emerald-950">
                                {ev.figure?.name || 'Tokoh Tidak Dikenal'}
                              </span>
                            </div>
                          </td>

                          {/* Year */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {ev.masehi_year} M
                              </span>
                              {ev.hijri_year && (
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                  {ev.hijri_year}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Date & Location */}
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="space-y-0.5">
                              <p className="text-xs text-stone-800 font-medium">
                                {ev.event_date ? formatDate(ev.event_date) : 'Jadwal belum ditentukan'}
                              </p>
                              {ev.location && (
                                <p className="text-[11px] text-stone-500 flex items-center gap-1 truncate">
                                  <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                                  <span className="truncate">{ev.location}</span>
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Media count */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setActiveTab('media');
                                setSearchQuery(ev.title);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 hover:bg-emerald-50 hover:text-emerald-900 text-stone-700 transition"
                              title="Lihat berkas media di dasbor"
                            >
                              <FolderOpen className="w-3.5 h-3.5 text-stone-500" />
                              <span>{mediaCount} Berkas</span>
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => handleOpenEditEvent(ev)}
                                className="p-1.5 rounded-lg text-stone-500 hover:text-emerald-900 hover:bg-emerald-50 transition"
                                title="Ubah Perhelatan Haul"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeletingEvent(ev)}
                                className="p-1.5 rounded-lg text-stone-500 hover:text-rose-600 hover:bg-rose-50 transition"
                                title="Hapus Perhelatan Haul"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* EDIT MEDIA METADATA MODAL */}
      <Modal
        isOpen={!!editingMedia}
        onClose={() => setEditingMedia(null)}
        title="Edit Metadata Berkas"
        description="Perbarui judul, deskripsi, atau tautan perhelatan haul untuk berkas ini."
        maxWidth="lg"
      >
        <div className="space-y-4">
          <Input
            label="Judul Berkas Arsip"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            required
          />

          <Textarea
            label="Deskripsi / Catatan Dokumentasi"
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            rows={3}
          />

          <Select
            label="Kaitkan ke Perhelatan Haul"
            value={editEventId}
            onChange={(e) => setEditEventId(e.target.value)}
            options={events.map((ev) => ({
              value: ev.id,
              label: `${ev.title} (${ev.masehi_year})`,
            }))}
          />

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-stone-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingMedia(null)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={isSavingEdit}
              onClick={handleSaveEdit}
            >
              Simpan Perubahan
            </Button>
          </div>
        </div>
      </Modal>

      {/* DELETE MEDIA CONFIRMATION MODAL */}
      <Modal
        isOpen={!!deletingMedia}
        onClose={() => setDeletingMedia(null)}
        title="Hapus Berkas dari Repositori?"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 leading-relaxed flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Tindakan ini tidak dapat dibatalkan.</p>
              <p className="mt-1">
                Berkas <strong>{deletingMedia?.title}</strong> akan dihapus secara permanen dari database dan Supabase Storage bucket <code>haul-archive</code>.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingMedia(null)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={handleConfirmDelete}
            >
              Hapus Permanen
            </Button>
          </div>
        </div>
      </Modal>

      {/* CREATE / EDIT HAUL EVENT MODAL */}
      <Modal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title={editingEvent ? 'Ubah Data Perhelatan Haul' : 'Tambah Perhelatan Haul Baru'}
        description="Kelola agenda perhelatan haul, tahun pelaksanaan masehi & hijriyah, serta lokasi acara."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveEvent} className="space-y-4">
          <Input
            label="Nama / Judul Perhelatan Haul *"
            placeholder="cth: Haul Akbar Ke-16 Mu'alim Ahmad Shobandi"
            value={eventFormTitle}
            onChange={(e) => setEventFormTitle(e.target.value)}
            required
          />

          <Select
            label="Shahibul Haul (Tokoh / Ulama) *"
            value={eventFormFigureId}
            onChange={(e) => setEventFormFigureId(e.target.value)}
            options={figures.map((f) => ({
              value: f.id,
              label: `${f.name}${f.title ? ` (${f.title})` : ''}`,
            }))}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Tahun Masehi *"
              type="number"
              placeholder="cth: 2024"
              value={eventFormMasehiYear}
              onChange={(e) => setEventFormMasehiYear(Number(e.target.value))}
              required
            />
            <Input
              label="Tahun Hijriyah (Opsional)"
              placeholder="cth: 1445 H"
              value={eventFormHijriYear}
              onChange={(e) => setEventFormHijriYear(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Tanggal Pelaksanaan (Opsional)"
              type="date"
              value={eventFormDate}
              onChange={(e) => setEventFormDate(e.target.value)}
            />
            <Input
              label="Lokasi Acara (Opsional)"
              placeholder="cth: Kompleks Masjid Jami' Ciganjur, Jakarta Selatan"
              value={eventFormLocation}
              onChange={(e) => setEventFormLocation(e.target.value)}
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-stone-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEventModalOpen(false)}
              disabled={isSavingEvent}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSavingEvent}
              className="bg-emerald-900 hover:bg-emerald-950 text-white"
            >
              {editingEvent ? 'Simpan Perubahan' : 'Tambahkan Perhelatan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE HAUL EVENT CONFIRMATION MODAL */}
      <Modal
        isOpen={!!deletingEvent}
        onClose={() => setDeletingEvent(null)}
        title="Hapus Perhelatan Haul?"
        maxWidth="md"
      >
        <div className="space-y-4">
          {deletingEvent && getEventMediaCount(deletingEvent.id) > 0 ? (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-950">Perhatian: Terdapat berkas media terhubung!</p>
                <p className="mt-1">
                  Perhelatan <strong>{deletingEvent?.title}</strong> masih memiliki{' '}
                  <strong className="text-amber-900">{getEventMediaCount(deletingEvent.id)} berkas media</strong> arsip.
                </p>
                <p className="mt-1 text-[11px] text-amber-800">
                  Untuk menjaga integritas data, silakan pindahkan atau hapus berkas-berkas media terkait di tab <strong>Koleksi Berkas Arsip</strong> sebelum menghapus perhelatan ini.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 leading-relaxed flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Tindakan ini tidak dapat dibatalkan.</p>
                <p className="mt-1">
                  Perhelatan <strong>{deletingEvent?.title}</strong> akan dihapus secara permanen dari database.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingEvent(null)}
              disabled={isDeletingEvent}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={isDeletingEvent}
              disabled={deletingEvent ? getEventMediaCount(deletingEvent.id) > 0 : false}
              onClick={handleConfirmDeleteEvent}
            >
              Hapus Permanen
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
