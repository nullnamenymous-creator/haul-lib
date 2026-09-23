'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MediaFile, MediaType } from '@/types/database';
import { getMediaFiles } from '@/lib/archive-service';

export interface UseRealtimeMediaOptions {
  fileType?: MediaType | 'all';
  eventId?: string;
  figureId?: string;
  searchQuery?: string;
  year?: number;
  initialData?: MediaFile[];
}

export function useRealtimeMedia(options: UseRealtimeMediaOptions = {}) {
  const [mediaList, setMediaList] = useState<MediaFile[]>(options.initialData || []);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store options in ref to avoid unnecessary re-subscriptions
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const fetchMedia = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getMediaFiles(optionsRef.current);
      setMediaList(data);
    } catch (err: any) {
      console.error('Error fetching media files:', err);
      setError(err?.message || 'Gagal memuat data arsip.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch when options change
  useEffect(() => {
    fetchMedia();
  }, [
    options.fileType,
    options.eventId,
    options.figureId,
    options.searchQuery,
    options.year,
    fetchMedia,
  ]);

  // Set up Supabase Realtime channel subscription
  useEffect(() => {
    const supabase = createClient();

    const channelName = `realtime-media-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'media_files' },
        async (payload) => {
          console.log('[Supabase Realtime] Event received:', payload.eventType, payload);

          if (payload.eventType === 'INSERT') {
            // New media inserted
            // Fetch complete relational data for this new media
            try {
              const { data: newMedia } = await (supabase
                .from('media_files') as any)
                .select('*, event:haul_events(*, figure:figures(*))')
                .eq('id', payload.new.id)
                .single();

              if (newMedia) {
                setMediaList((prev) => {
                  if (prev.some((m) => m.id === newMedia.id)) return prev;
                  return [newMedia as MediaFile, ...prev];
                });
              } else {
                fetchMedia();
              }
            } catch {
              fetchMedia();
            }
          } else if (payload.eventType === 'UPDATE') {
            // Existing media updated (e.g., download count increment or title edit)
            setMediaList((prev) =>
              prev.map((item) =>
                item.id === payload.new.id
                  ? {
                      ...item,
                      ...payload.new,
                      // Preserve existing joined relations if payload.new doesn't include them
                      event: item.event,
                    }
                  : item
              )
            );
          } else if (payload.eventType === 'DELETE') {
            // Media deleted
            const deletedId = (payload.old as any)?.id;
            if (deletedId) {
              setMediaList((prev) => prev.filter((item) => item.id !== deletedId));
            } else {
              fetchMedia();
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsLiveConnected(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsLiveConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMedia]);

  return {
    mediaList,
    setMediaList,
    isLoading,
    isLiveConnected,
    error,
    refetch: fetchMedia,
  };
}
