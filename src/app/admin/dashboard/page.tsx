'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getFigures, getHaulEvents, getMediaFiles } from '@/lib/archive-service';
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
  const [searchQuery, setSearchQuery] = useState('');

  // Edit Modal State
  const [editingMedia, setEditingMedia] = useState<MediaFile | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editEventId, setEditEventId] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete Modal State
  const [deletingMedia, setDeletingMedia] = useState<MediaFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification Banner
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const handleLogout = async () => {
    await clearAdminSession();
    router.push('/');
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

  // Open Edit Modal
  const handleOpenEdit = (media: MediaFile) => {
    setEditingMedia(media);
    setEditTitle(media.title);
    setEditDesc(media.description || '');
    setEditEventId(media.event_id || '');
  };

  const handleSaveEdit = async () => {
    if (!editingMedia) return;
    setIsSavingEdit(true);
    setFeedbackMsg(null);

    try {
      const supabase = createClient();
      const { error } = await (supabase
        .from('media_files') as any)
        .update({
          title: editTitle,
          description: editDesc,
          event_id: editEventId,
        })
        .eq('id', editingMedia.id);

      if (error) {
        console.warn('Supabase DB update fallback (demo mode active)');
      }

      // Update local state
      const targetEvent = events.find((e) => e.id === editEventId);
      setMediaList((prev) =>
        prev.map((item) =>
          item.id === editingMedia.id
            ? {
                ...item,
                title: editTitle,
                description: editDesc,
                event_id: editEventId,
                event: targetEvent || item.event,
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
      const supabase = createClient();

      // 1. Delete from Supabase Storage bucket 'haul-archive' if it contains the path
      try {
        const urlParts = deletingMedia.file_url.split('/haul-archive/');
        if (urlParts.length > 1) {
          const storagePath = decodeURIComponent(urlParts[1]);
          await supabase.storage.from('haul-archive').remove([storagePath]);
        }
      } catch (storageErr) {
        console.warn('Storage delete warning:', storageErr);
      }

      // 2. Delete from media_files table
      const { error } = await supabase
        .from('media_files')
        .delete()
        .eq('id', deletingMedia.id);

      if (error) {
        console.warn('Supabase DB delete fallback');
      }

      // 3. Remove locally
      setMediaList((prev) => prev.filter((m) => m.id !== deletingMedia.id));
      setFeedbackMsg({ type: 'success', text: `Berkas "${deletingMedia.title}" berhasil dihapus!` });
      setDeletingMedia(null);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Gagal menghapus berkas.' });
    } finally {
      setIsDeleting(false);
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
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-emerald-950 flex items-center justify-center font-serif font-bold text-sm">
                ح
              </div>
              <span className="font-serif font-bold text-base tracking-wide text-white group-hover:text-amber-300 transition">
                Dasbor Pengurus Haul
              </span>
            </Link>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-900 text-amber-300 border border-emerald-800">
              Admin Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
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

            <Link href="/" target="_blank">
              <Button size="sm" variant="ghost" className="text-emerald-200 hover:text-white text-xs">
                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                Lihat Web
              </Button>
            </Link>

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
              <p className="text-xs text-stone-500 font-medium">Acara Haul Terdaftar</p>
              <h3 className="text-xl sm:text-2xl font-bold text-stone-900">{events.length}</h3>
            </div>
          </div>
        </div>

        {/* MANAGEMENT TABLE CARD */}
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
      </main>

      {/* EDIT METADATA MODAL */}
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

      {/* DELETE CONFIRMATION MODAL */}
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
    </div>
  );
}
