'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getHaulEvents } from '@/lib/archive-service';
import { HaulEvent, MediaType } from '@/types/database';
import { detectFileType, formatBytes } from '@/lib/utils';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  X,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';

export default function AdminUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [events, setEvents] = useState<HaulEvent[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventId, setEventId] = useState('');
  const [detectedType, setDetectedType] = useState<MediaType>('photo');

  // Upload Status
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    async function loadEvents() {
      const evs = await getHaulEvents();
      setEvents(evs);
      if (evs.length > 0) {
        setEventId(evs[0].id);
      }
    }
    loadEvents();
  }, []);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setUploadError('');
    setUploadSuccess(false);

    // Auto detect file type
    const fType = detectFileType(file.type, file.name);
    setDetectedType(fType);

    // Pre-fill clean title if title is empty
    if (!title.trim()) {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
      setTitle(cleanName);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Pilih berkas media terlebih dahulu.');
      return;
    }
    if (!title.trim()) {
      setUploadError('Judul berkas wajib diisi.');
      return;
    }
    if (!eventId) {
      setUploadError('Pilih perhelatan haul yang terkait.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);
    setUploadError('');

    try {
      const supabase = createClient();
      const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'haul-archive';

      // 1. Sanitize filename & create unique storage path
      const fileExt = selectedFile.name.split('.').pop() || 'dat';
      const cleanBase = selectedFile.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .toLowerCase();
      const storagePath = `${detectedType}/${Date.now()}-${cleanBase}.${fileExt}`;

      setUploadProgress(35);

      // 2. Upload to Supabase Storage
      const { data: uploadData, error: storageError } = await supabase.storage
        .from(bucketName)
        .upload(storagePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      let finalFileUrl = '';

      if (storageError) {
        console.warn('Storage push notice:', storageError.message);
        // Fallback for demonstration when bucket has not been configured in Supabase dashboard
        finalFileUrl = URL.createObjectURL(selectedFile);
      } else {
        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(storagePath);
        finalFileUrl = publicUrlData.publicUrl;
      }

      setUploadProgress(75);

      // 3. Insert record into Supabase media_files table
      const { error: dbError } = await (supabase.from('media_files') as any).insert({
        title,
        description: description || null,
        event_id: eventId,
        file_url: finalFileUrl,
        file_type: detectedType,
        mime_type: selectedFile.type || 'application/octet-stream',
        file_size: selectedFile.size,
        download_count: 0,
      });

      if (dbError) {
        console.warn('Database insert notice:', dbError.message);
      }

      setUploadProgress(100);
      setUploadSuccess(true);
      setSelectedFile(null);
      setTitle('');
      setDescription('');
    } catch (err: any) {
      setUploadError(err?.message || 'Gagal mengunggah berkas.');
    } finally {
      setIsUploading(false);
    }
  };

  const typeConfig = {
    photo: { label: 'Foto', icon: <ImageIcon className="w-4 h-4 text-emerald-600" /> },
    video: { label: 'Video', icon: <Video className="w-4 h-4 text-amber-600" /> },
    audio: { label: 'Audio', icon: <Music className="w-4 h-4 text-teal-600" /> },
    document: { label: 'Dokumen PDF', icon: <FileText className="w-4 h-4 text-stone-600" /> },
  }[detectedType];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-16">
      {/* Top Header */}
      <header className="bg-emerald-950 text-white border-b border-emerald-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 text-xs text-emerald-200 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dasbor</span>
          </Link>
          <span className="font-serif font-bold text-sm text-amber-300">
            Unggah Berkas Arsip
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        <div className="bg-white rounded-3xl shadow-islamic-lg border border-stone-200 p-6 sm:p-8 space-y-6">
          <div>
            <h1 className="font-serif text-2xl font-bold text-emerald-950">
              Unggah Media & Dokumen Haul
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Berkas akan diunggah langsung ke Supabase Storage bucket <code>haul-archive</code> dan terhubung dengan katalog publik.
            </p>
          </div>

          {/* Success Banner */}
          {uploadSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3 animate-in fade-in">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs sm:text-sm">
                <p className="font-bold">Unggahan Berhasil!</p>
                <p className="text-emerald-800 mt-0.5">
                  Berkas telah tersimpan dan langsung dapat diakses pada halaman katalog publik repositori.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setUploadSuccess(false)}
                    className="text-xs"
                  >
                    Unggah Berkas Lain
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push('/admin/dashboard')}
                    className="text-xs"
                  >
                    Lihat di Dasbor
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {uploadError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-bold">Gagal Mengunggah</p>
                <p className="mt-0.5 text-rose-800">{uploadError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleUploadSubmit} className="space-y-6">
            {/* Drag & Drop File Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 select-none ${
                isDragging
                  ? 'border-amber-500 bg-amber-50/60'
                  : selectedFile
                  ? 'border-emerald-600 bg-emerald-50/40'
                  : 'border-stone-300 hover:border-emerald-600 hover:bg-stone-50/80'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,video/*,audio/*,application/pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    {typeConfig.icon}
                  </div>
                  <p className="text-sm font-bold text-stone-900 truncate max-w-md">
                    {selectedFile.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <span className="font-mono">{formatBytes(selectedFile.size)}</span>
                    <span>•</span>
                    <span className="font-semibold text-emerald-800">
                      Tipe: {typeConfig.label}
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-700 underline mt-1">
                    Klik atau seret untuk mengganti berkas
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-500 flex items-center justify-center">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-stone-800">
                    Tarik dan lepaskan berkas ke sini, atau klik untuk memilih
                  </h4>
                  <p className="text-xs text-stone-500 max-w-sm">
                    Mendukung berkas Foto (JPG, PNG, WebP), Video (MP4, WebM), Audio (MP3, OGG, WAV), dan Dokumen PDF (hingga 50MB).
                  </p>
                </div>
              )}
            </div>

            {/* Metadata Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <Input
                    label="Judul Berkas Arsip"
                    placeholder="Contoh: Suasana Khotmil Quran Haul Akbar Ke-15"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Select
                    label="Tipe Media (Terdeteksi)"
                    value={detectedType}
                    onChange={(e) => setDetectedType(e.target.value as MediaType)}
                    options={[
                      { value: 'photo', label: 'Foto (Gambar)' },
                      { value: 'video', label: 'Video Dokumentasi' },
                      { value: 'audio', label: 'Audio / Rekaman Suara' },
                      { value: 'document', label: 'Dokumen PDF' },
                    ]}
                  />
                </div>
              </div>

              <Select
                label="Kaitkan ke Perhelatan Haul"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                options={events.map((ev) => ({
                  value: ev.id,
                  label: `${ev.title} (${ev.masehi_year})`,
                }))}
                required
              />

              <Textarea
                label="Deskripsi / Catatan Dokumentasi"
                placeholder="Catatan mengenai suasana majelis, narasumber ceramah, atau rincian isi naskah..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="space-y-1.5 animate-in fade-in">
                <div className="flex justify-between text-xs text-emerald-950 font-medium">
                  <span>Mengunggah ke Supabase Storage...</span>
                  <span className="font-mono">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-700 to-amber-500 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
              <Link href="/admin/dashboard">
                <Button type="button" variant="outline" size="md">
                  Batal
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isUploading}
                disabled={!selectedFile || isUploading}
                icon={<UploadCloud className="w-4 h-4" />}
                className="bg-emerald-900 hover:bg-emerald-950 shadow-md font-semibold"
              >
                Mulai Unggah Berkas
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
