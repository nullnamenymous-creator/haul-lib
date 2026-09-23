export type MediaType = 'photo' | 'video' | 'audio' | 'document';

export interface Figure {
  id: string;
  name: string;
  title: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface HaulEvent {
  id: string;
  figure_id: string;
  title: string;
  hijri_year: string | null;
  masehi_year: number;
  event_date: string | null;
  location: string | null;
  created_at: string;
  figure?: Figure;
}

export interface MediaFile {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: MediaType;
  mime_type: string;
  file_size: number;
  download_count: number;
  created_at: string;
  event?: HaulEvent;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      figures: {
        Row: Figure;
        Insert: {
          id?: string;
          name: string;
          title?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          title?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      haul_events: {
        Row: HaulEvent;
        Insert: {
          id?: string;
          figure_id: string;
          title: string;
          hijri_year?: string | null;
          masehi_year: number;
          event_date?: string | null;
          location?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          figure_id?: string;
          title?: string;
          hijri_year?: string | null;
          masehi_year?: number;
          event_date?: string | null;
          location?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "haul_events_figure_id_fkey";
            columns: ["figure_id"];
            isOneToOne: false;
            referencedRelation: "figures";
            referencedColumns: ["id"];
          }
        ];
      };
      media_files: {
        Row: MediaFile;
        Insert: {
          id?: string;
          event_id: string;
          title: string;
          description?: string | null;
          file_url: string;
          file_type: MediaType;
          mime_type: string;
          file_size: number;
          download_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          title?: string;
          description?: string | null;
          file_url?: string;
          file_type?: MediaType;
          mime_type?: string;
          file_size?: number;
          download_count?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "media_files_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "haul_events";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_download_count: {
        Args: {
          target_file_id: string;
        };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
