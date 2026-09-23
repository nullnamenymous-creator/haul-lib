-- ==========================================================
-- HAUL & MAJELIS DIGITAL HERITAGE REPOSITORY - SUPABASE SCHEMA
-- ==========================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: figures (Tokoh / Ulama)
create table if not exists figures (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text,
  bio text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Table: haul_events (Event / Haul Berdasarkan Tokoh, Tahun & Lokasi)
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

-- Table: media_files (Arsip Foto, Video, Audio, Dokumen)
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

-- Enable Row Level Security (RLS)
alter table figures enable row level security;
alter table haul_events enable row level security;
alter table media_files enable row level security;

-- Public read policies
drop policy if exists "Allow public read figures" on figures;
create policy "Allow public read figures" on figures for select using (true);

drop policy if exists "Allow public read haul_events" on haul_events;
create policy "Allow public read haul_events" on haul_events for select using (true);

drop policy if exists "Allow public read media_files" on media_files;
create policy "Allow public read media_files" on media_files for select using (true);

-- Authenticated (Admin) full access policies
drop policy if exists "Allow auth manage figures" on figures;
create policy "Allow auth manage figures" on figures for all using (auth.role() = 'authenticated');

drop policy if exists "Allow auth manage haul_events" on haul_events;
create policy "Allow auth manage haul_events" on haul_events for all using (auth.role() = 'authenticated');

drop policy if exists "Allow auth manage media_files" on media_files;
create policy "Allow auth manage media_files" on media_files for all using (auth.role() = 'authenticated');

-- Atomic RPC function for incrementing download counter
create or replace function increment_download_count(target_file_id uuid)
returns void as $$
begin
  update media_files
  set download_count = coalesce(download_count, 0) + 1
  where id = target_file_id;
end;
$$ language plpgsql security definer;

-- ==========================================================
-- STORAGE SETUP (Run in SQL Editor or via Supabase Dashboard)
-- ==========================================================
-- 1. Create a public bucket 'haul-archive':
insert into storage.buckets (id, name, public) 
values ('haul-archive', 'haul-archive', true)
on conflict (id) do nothing;

-- 2. Allow public to read from 'haul-archive':
create policy "Public Access haul-archive"
on storage.objects for select
using ( bucket_id = 'haul-archive' );

-- 3. Allow authenticated admins to upload to 'haul-archive':
create policy "Admin Upload haul-archive"
on storage.objects for insert
with check ( bucket_id = 'haul-archive' and auth.role() = 'authenticated' );

-- 4. Allow authenticated admins to delete from 'haul-archive':
create policy "Admin Delete haul-archive"
on storage.objects for delete
using ( bucket_id = 'haul-archive' and auth.role() = 'authenticated' );

-- ==========================================================
-- SEED DATA (Opsional: Contoh Data Awal Tokoh & Haul)
-- ==========================================================
insert into figures (id, name, title, bio, avatar_url)
values 
  ('a1111111-1111-1111-1111-111111111111', 'Mu''alim Ahmad Shobandi', 'Ulama Kharismatik & Guru Pembimbing Rohani', 'Guru besar dan ulama panutan masyarakat yang mendedikasikan hidupnya untuk dakwah, pembinaan akhlak santri, dan pengajian ratib serta manaqib di tanah Betawi dan nusantara.', 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80'),
  ('a2222222-2222-2222-2222-222222222222', 'Habib Ali bin Muhammad Al-Habsyi', 'Shohibul Maulid Simtudduror', 'Waliyyullah penggubah Maulid Simtudduror yang kecintaan dan sholawatnya kepada Baginda Nabi Muhammad SAW senantiasa dibaca di jutaan majelis di seluruh dunia.', 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80')
on conflict (id) do nothing;

insert into haul_events (id, figure_id, title, hijri_year, masehi_year, event_date, location)
values 
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Haul Akbar Ke-15 Mu''alim Ahmad Shobandi', '1445 H', 2024, '2024-05-18', 'Pondok Pesantren & Majelis Ta''lim As-Shobandiyah, Jakarta'),
  ('b2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'Haul Ke-14 Mu''alim Ahmad Shobandi', '1444 H', 2023, '2023-06-03', 'Masjid Jami'' Nurul Huda, Jakarta'),
  ('b3333333-3333-3333-3333-333333333333', 'a2222222-2222-2222-2222-222222222222', 'Haul Solo Habib Ali Al-Habsyi Ke-112', '1445 H', 2023, '2023-11-04', 'Masjid Riyadh, Pasar Kliwon, Surakarta')
on conflict (id) do nothing;
