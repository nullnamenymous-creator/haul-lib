-- ==========================================================
-- SINKRONISASI DATABASE & REALTIME SUPABASE
-- Salin dan jalankan seluruh script ini di Supabase SQL Editor:
-- Dashboard Supabase -> Project -> SQL Editor -> New Query -> Run
-- ==========================================================

-- 1. Pastikan ekstensi UUID aktif
create extension if not exists "uuid-ossp";

-- 2. Pastikan struktur tabel lengkap
create table if not exists figures (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text,
  bio text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists haul_events (
  id uuid primary key default gen_random_uuid(),
  figure_id uuid references figures(id) on delete cascade,
  title text not null,
  hijri_year text,
  masehi_year int not null,
  event_date date,
  location text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists media_files (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references haul_events(id) on delete cascade,
  title text not null,
  description text,
  file_url text not null,
  file_type text check (file_type in ('photo', 'video', 'audio', 'document')),
  mime_type text not null,
  file_size bigint not null,
  download_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Konfigurasi REPLICA IDENTITY FULL untuk payload realtime yang lengkap
alter table figures replica identity full;
alter table haul_events replica identity full;
alter table media_files replica identity full;

-- 4. Aktifkan Realtime Publikasi Supabase
-- Menambahkan tabel ke publikasi supabase_realtime
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'media_files'
  ) then
    alter publication supabase_realtime add table media_files;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'haul_events'
  ) then
    alter publication supabase_realtime add table haul_events;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'figures'
  ) then
    alter publication supabase_realtime add table figures;
  end if;
end $$;

-- 5. Konfigurasi Row Level Security (RLS) & Policies
alter table figures enable row level security;
alter table haul_events enable row level security;
alter table media_files enable row level security;

-- Drop policies lama jika ada
drop policy if exists "Allow public read figures" on figures;
drop policy if exists "Allow public read haul_events" on haul_events;
drop policy if exists "Allow public read media_files" on media_files;
drop policy if exists "Allow auth manage figures" on figures;
drop policy if exists "Allow auth manage haul_events" on haul_events;
drop policy if exists "Allow auth manage media_files" on media_files;
drop policy if exists "Allow all manage figures" on figures;
drop policy if exists "Allow all manage haul_events" on haul_events;
drop policy if exists "Allow all manage media_files" on media_files;

-- Kebijakan Akses:
-- Publik dapat membaca seluruh data arsip
create policy "Allow public read figures" on figures for select using (true);
create policy "Allow public read haul_events" on haul_events for select using (true);
create policy "Allow public read media_files" on media_files for select using (true);

-- Pengurus repositori dapat mengelola (Insert, Update, Delete) berkas & data
create policy "Allow all manage figures" on figures for all using (true) with check (true);
create policy "Allow all manage haul_events" on haul_events for all using (true) with check (true);
create policy "Allow all manage media_files" on media_files for all using (true) with check (true);

-- 6. Fungsi Atomic Increment Download Counter
create or replace function increment_download_count(target_file_id uuid)
returns void as $$
begin
  update media_files
  set download_count = coalesce(download_count, 0) + 1
  where id = target_file_id;
end;
$$ language plpgsql security definer;

-- 7. Konfigurasi Storage Bucket 'haul-archive'
insert into storage.buckets (id, name, public) 
values ('haul-archive', 'haul-archive', true)
on conflict (id) do nothing;

drop policy if exists "Public Access haul-archive" on storage.objects;
create policy "Public Access haul-archive"
on storage.objects for select
using ( bucket_id = 'haul-archive' );

drop policy if exists "Public Upload haul-archive" on storage.objects;
create policy "Public Upload haul-archive"
on storage.objects for insert
with check ( bucket_id = 'haul-archive' );

drop policy if exists "Public Delete haul-archive" on storage.objects;
create policy "Public Delete haul-archive"
on storage.objects for delete
using ( bucket_id = 'haul-archive' );

-- ==========================================================
-- 8. SEED DATA LENGKAP: TOKOH, EVENT HAUL & 9 ARSIP MEDIA
-- Menggunakan format UUID valid (hexadecimal 0-9 dan a-f)
-- ==========================================================

-- Data Tokoh (Figures)
insert into figures (id, name, title, bio, avatar_url, created_at)
values 
  ('a1111111-1111-1111-1111-111111111111', 'Mu''alim Ahmad Shobandi', 'Ulama Kharismatik & Guru Pembimbing Rohani', 'Guru besar dan ulama panutan masyarakat yang mendedikasikan hidupnya untuk dakwah, pembinaan akhlak santri, dan pengajian ratib serta manaqib di tanah Betawi dan nusantara. Beliau dikenal teguh memegang syariat dan mengajarkan cinta kepada Baginda Rasulullah SAW.', 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80', '2023-01-01T00:00:00Z'),
  ('a2222222-2222-2222-2222-222222222222', 'Habib Ali bin Muhammad Al-Habsyi', 'Shohibul Maulid Simtudduror', 'Waliyyullah dan ulama besar Hadramaut penggubah Kitab Maulid Simtudduror. Untaian qasidah dan sholawat karya beliau senantiasa dilantunkan di jutaan majelis ta''lim di seantero nusantara dan dunia Islam.', 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80', '2023-01-02T00:00:00Z'),
  ('a3333333-3333-3333-3333-333333333333', 'Abah Guru Sekumpul (KH. Muhammad Zaini)', 'Ulama Besar Martapura, Kalimantan Selatan', 'Ulama yang mahsyur dengan kelembutan akhlak, keluhuran ilmu, dan majelis dzikir akbar di Martapura yang dihadiri jutaan jamaah setiap tahunnya dalam peringatan haul beliau.', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80', '2023-01-03T00:00:00Z')
on conflict (id) do update set
  name = excluded.name,
  title = excluded.title,
  bio = excluded.bio,
  avatar_url = excluded.avatar_url;

-- Data Peringatan Haul (Haul Events)
insert into haul_events (id, figure_id, title, hijri_year, masehi_year, event_date, location, created_at)
values 
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Haul Akbar Ke-15 Mu''alim Ahmad Shobandi', '1445 H', 2024, '2024-05-18', 'Pondok Pesantren & Majelis Ta''lim As-Shobandiyah, Jakarta', '2024-05-18T00:00:00Z'),
  ('b2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'Haul Ke-14 Mu''alim Ahmad Shobandi', '1444 H', 2023, '2023-06-03', 'Masjid Jami'' Nurul Huda, Jakarta', '2023-06-03T00:00:00Z'),
  ('b3333333-3333-3333-3333-333333333333', 'a2222222-2222-2222-2222-222222222222', 'Haul Solo Habib Ali Al-Habsyi Ke-112', '1445 H', 2023, '2023-11-04', 'Masjid Riyadh, Pasar Kliwon, Surakarta', '2023-11-04T00:00:00Z'),
  ('b4444444-4444-4444-4444-444444444444', 'a3333333-3333-3333-3333-333333333333', 'Haul Akbar Ke-19 Abah Guru Sekumpul', '1445 H', 2024, '2024-01-14', 'Musholla Ar-Raudhah Sekumpul, Martapura', '2024-01-14T00:00:00Z')
on conflict (id) do update set
  title = excluded.title,
  hijri_year = excluded.hijri_year,
  masehi_year = excluded.masehi_year,
  event_date = excluded.event_date,
  location = excluded.location;

-- Data Berkas Arsip Media (Media Files) - Valid Hex UUIDs (c1111111... sampai c9999999...)
insert into media_files (id, event_id, title, description, file_url, file_type, mime_type, file_size, download_count, created_at)
values 
  ('c1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Dokumentasi Suasana Puncak Haul Akbar Ke-15', 'Lautan jamaah dan para habaib memadati pelataran utama majelis pada malam puncak khotmil Qur''an dan tahlil akbar.', 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=1600&auto=format&fit=crop&q=85', 'photo', 'image/jpeg', 3450000, 247, '2024-05-18T10:00:00Z'),
  ('c2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'Video Dokumentasi Tausiyah Hikmah Haul Ke-15', 'Cuplikan tausiyah mendalam mengenai keteladanan akhlak dan sanad keilmuan Mu''alim Ahmad Shobandi dalam mendidik generasi.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'video', 'video/mp4', 15400000, 512, '2024-05-18T14:30:00Z'),
  ('c3333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111111', 'Rekaman Audio Pembacaan Manaqib & Qasidah Burdah', 'Lantunan merdu bait-bait qasidah sanjungan baginda Rasulullah SAW dan riwayat manaqib perjuangan dakwah guru mulia.', 'https://actions.google.com/sounds/v1/ambiences/outdoor_water_fountain.ogg', 'audio', 'audio/ogg', 4890000, 830, '2024-05-18T16:00:00Z'),
  ('c4444444-4444-4444-4444-444444444444', 'b1111111-1111-1111-1111-111111111111', 'Buku Risalah Manaqib & Susunan Doa Haul Ke-15', 'Dokumen resmi panduan jamaah berisi silsilah, wirid ratibul haddad, serta biografi singkat shahibul haul dalam format PDF siap cetak.', '/sample-document.pdf', 'document', 'application/pdf', 1850000, 672, '2024-05-18T08:00:00Z'),
  ('c5555555-5555-5555-5555-555555555555', 'b2222222-2222-2222-2222-222222222222', 'Foto Bersejarah Peninggalan Kitab & Manuskrip', 'Koleksi manuskrip catatan tangan dan kajian kitab fiqih Mu''alim Ahmad Shobandi yang terawat baik.', 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=1600&auto=format&fit=crop&q=85', 'photo', 'image/jpeg', 2900000, 140, '2023-06-03T11:00:00Z'),
  ('c6666666-6666-6666-6666-666666666666', 'b3333333-3333-3333-3333-333333333333', 'Dokumentasi Lautan Jamaah Haul Solo Habib Ali Al-Habsyi', 'Pemandangan udara dan suasana jalan Kapten Mulyadi Pasar Kliwon Surakarta saat pembacaan Maulid Simtudduror.', 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=1600&auto=format&fit=crop&q=85', 'photo', 'image/jpeg', 4200000, 1105, '2023-11-04T12:00:00Z'),
  ('c7777777-7777-7777-7777-777777777777', 'b3333333-3333-3333-3333-333333333333', 'Audio Lantunan Maulid Simtudduror Lengkap', 'Rekaman audio jernih pembacaan fasal-fasal Maulid Habsyi bersama para habaib dan masyayikh di Masjid Riyadh Solo.', 'https://actions.google.com/sounds/v1/weather/light_rain.ogg', 'audio', 'audio/ogg', 8200000, 1540, '2023-11-04T15:00:00Z'),
  ('c8888888-8888-8888-8888-888888888888', 'b4444444-4444-4444-4444-444444444444', 'Video Rekaman Suasana Dzikir Bersama Haul Sekumpul', 'Momen khusyuk lantunan tahlil dan doa bersama jutaan jamaah di Kompleks Rawdha Martapura.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4', 'video', 'video/mp4', 19800000, 980, '2024-01-14T20:00:00Z'),
  ('c9999999-9999-9999-9999-999999999999', 'b4444444-4444-4444-4444-444444444444', 'Panduan Rute & Jadwal Acara Haul Akbar', 'Brosur panduan jalur transportasi, titik wudhu, posko kesehatan, dan tata tertib jamaah.', '/sample-document.pdf', 'document', 'application/pdf', 1240000, 430, '2024-01-14T07:00:00Z')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  file_url = excluded.file_url,
  file_type = excluded.file_type,
  mime_type = excluded.mime_type,
  file_size = excluded.file_size,
  download_count = excluded.download_count;

-- Selesai! Seluruh data tokoh, haul, dan arsip sekarang tersimpan di Supabase
-- dan Realtime WebSockets aktif untuk semua tabel.
