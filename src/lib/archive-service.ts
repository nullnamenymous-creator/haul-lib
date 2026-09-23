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
    if (error) {
      results = [...DEMO_MEDIA_FILES];
    } else if (data && data.length > 0) {
      results = data as MediaFile[];
    } else {
      // If table is completely empty and no filters were applied, fallback to demo until seeded
      const hasFilter = params?.fileType !== 'all' || params?.eventId || params?.searchQuery || params?.figureId || params?.year;
      if (!hasFilter && (!data || data.length === 0)) {
        results = [...DEMO_MEDIA_FILES];
      } else {
        results = (data as MediaFile[]) || [];
      }
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

export async function updateMediaMetadata(
  id: string,
  updates: { title: string; description: string; event_id: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { error } = await (supabase.from('media_files') as any)
      .update(updates)
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function deleteMediaArchive(
  id: string,
  fileUrl?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    if (fileUrl && fileUrl.includes('/haul-archive/')) {
      try {
        const urlParts = fileUrl.split('/haul-archive/');
        if (urlParts.length > 1) {
          const storagePath = decodeURIComponent(urlParts[1]);
          await supabase.storage.from('haul-archive').remove([storagePath]);
        }
      } catch (e) {
        console.warn('Storage delete notice:', e);
      }
    }

    const { error } = await (supabase.from('media_files') as any)
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}
