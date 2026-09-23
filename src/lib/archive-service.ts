import { createClient } from './supabase/client';
import { DEMO_FIGURES, DEMO_EVENTS, DEMO_MEDIA_FILES } from './demo-data';
import { Figure, HaulEvent, MediaFile, MediaType } from '@/types/database';

export async function getFigures(): Promise<Figure[]> {
  try {
    const supabase = createClient();
    const { data, error } = await (supabase
      .from('figures') as any)
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
      return DEMO_FIGURES;
    }
    return data as Figure[];
  } catch {
    return DEMO_FIGURES;
  }
}

export async function getFigureById(id: string): Promise<Figure | null> {
  try {
    const supabase = createClient();
    const { data, error } = await (supabase
      .from('figures') as any)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return DEMO_FIGURES.find((f) => f.id === id) || null;
    }
    return data as Figure;
  } catch {
    return DEMO_FIGURES.find((f) => f.id === id) || null;
  }
}

export async function getHaulEvents(): Promise<HaulEvent[]> {
  try {
    const supabase = createClient();
    const { data, error } = await (supabase
      .from('haul_events') as any)
      .select('*, figure:figures(*)')
      .order('masehi_year', { ascending: false });

    if (error || !data || data.length === 0) {
      return DEMO_EVENTS;
    }
    return data as HaulEvent[];
  } catch {
    return DEMO_EVENTS;
  }
}

export async function getHaulEventById(id: string): Promise<HaulEvent | null> {
  try {
    const supabase = createClient();
    const { data, error } = await (supabase
      .from('haul_events') as any)
      .select('*, figure:figures(*)')
      .eq('id', id)
      .single();

    if (error || !data) {
      return DEMO_EVENTS.find((e) => e.id === id) || null;
    }
    return data as HaulEvent;
  } catch {
    return DEMO_EVENTS.find((e) => e.id === id) || null;
  }
}

export async function getMediaFiles(params?: {
  fileType?: MediaType | 'all';
  eventId?: string;
  figureId?: string;
  searchQuery?: string;
  year?: number;
}): Promise<MediaFile[]> {
  try {
    const supabase = createClient();
    let query = (supabase
      .from('media_files') as any)
      .select('*, event:haul_events(*, figure:figures(*))')
      .order('created_at', { ascending: false });

    if (params?.fileType && params.fileType !== 'all') {
      query = query.eq('file_type', params.fileType);
    }

    if (params?.eventId) {
      query = query.eq('event_id', params.eventId);
    }

    const { data, error } = await query;

    let results: MediaFile[] = [];
    if (error || !data || data.length === 0) {
      results = [...DEMO_MEDIA_FILES];
    } else {
      results = data as MediaFile[];
    }

    // Apply in-memory filters for nested / search queries
    if (params?.figureId) {
      results = results.filter((m) => m.event?.figure_id === params.figureId);
    }
    if (params?.year) {
      results = results.filter((m) => m.event?.masehi_year === params.year);
    }
    if (params?.fileType && params.fileType !== 'all') {
      results = results.filter((m) => m.file_type === params.fileType);
    }
    if (params?.eventId) {
      results = results.filter((m) => m.event_id === params.eventId);
    }
    if (params?.searchQuery && params.searchQuery.trim() !== '') {
      const q = params.searchQuery.toLowerCase();
      results = results.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          (m.description && m.description.toLowerCase().includes(q)) ||
          (m.event?.title && m.event.title.toLowerCase().includes(q)) ||
          (m.event?.figure?.name && m.event.figure.name.toLowerCase().includes(q))
      );
    }

    return results;
  } catch {
    let results = [...DEMO_MEDIA_FILES];
    if (params?.figureId) {
      results = results.filter((m) => m.event?.figure_id === params.figureId);
    }
    if (params?.year) {
      results = results.filter((m) => m.event?.masehi_year === params.year);
    }
    if (params?.fileType && params.fileType !== 'all') {
      results = results.filter((m) => m.file_type === params.fileType);
    }
    if (params?.eventId) {
      results = results.filter((m) => m.event_id === params.eventId);
    }
    if (params?.searchQuery && params.searchQuery.trim() !== '') {
      const q = params.searchQuery.toLowerCase();
      results = results.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          (m.description && m.description.toLowerCase().includes(q)) ||
          (m.event?.title && m.event.title.toLowerCase().includes(q)) ||
          (m.event?.figure?.name && m.event.figure.name.toLowerCase().includes(q))
      );
    }
    return results;
  }
}
