'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MediaFile } from '@/types/database';
import { formatBytes, formatDuration } from '@/lib/utils';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  X,
  Music,
  RotateCcw,
  FastForward,
  Rewind,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface AudioPlayerProps {
  media: MediaFile | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (media: MediaFile) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  media,
  isOpen,
  onClose,
  onDownload,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [isOpen, media]);

  if (!isOpen || !media) return null;

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const skipSeconds = (sec: number) => {
    if (!audioRef.current) return;
    const target = Math.max(0, Math.min(duration, audioRef.current.currentTime + sec));
    audioRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
      setIsMuted(newVol === 0);
    }
  };

  const handleDownloadClick = async () => {
    try {
      setIsDownloading(true);
      if (onDownload) {
        onDownload(media);
      } else {
        fetch('/api/increment-download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId: media.id }),
        }).catch(() => {});

        const a = document.createElement('a');
        a.href = media.file_url;
        a.download = media.title || 'arsip-audio.mp3';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <audio
        ref={audioRef}
        src={media.file_url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="relative w-full max-w-lg bg-gradient-to-br from-emerald-950 via-emerald-900 to-stone-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-amber-500/30 text-white overflow-hidden">
        {/* Decorative Islamic geometric accent backdrop */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between relative z-10 pb-4 border-b border-emerald-800/60">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Music className="w-5 h-5" />
            </span>
            <span className="text-xs uppercase tracking-widest text-amber-300 font-semibold">
              Rekaman Audio & Manaqib
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/60 transition"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media Details */}
        <div className="py-6 text-center space-y-2 relative z-10">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 p-0.5 shadow-xl shadow-emerald-950/50 flex items-center justify-center mb-3">
            <div className="w-full h-full bg-emerald-950 rounded-[14px] flex items-center justify-center">
              <Music className={`w-8 h-8 text-amber-300 ${isPlaying ? 'animate-pulse' : ''}`} />
            </div>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white line-clamp-2 px-2">
            {media.title}
          </h3>
          <p className="text-xs text-emerald-200/80">
            {media.event?.title || 'Arsip Majelis Haul'} • {formatBytes(media.file_size)}
          </p>
          {media.description && (
            <p className="text-xs text-stone-300 line-clamp-2 px-4 pt-1">
              {media.description}
            </p>
          )}
        </div>

        {/* Progress Bar & Seek */}
        <div className="space-y-1.5 relative z-10 pt-2">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-emerald-950 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
            style={{
              background: `linear-gradient(to right, #f59e0b ${progressPercent}%, #064e3b ${progressPercent}%)`,
            }}
          />
          <div className="flex justify-between text-[11px] font-mono text-emerald-300/80">
            <span>{formatDuration(currentTime)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-4 py-4 relative z-10">
          <button
            onClick={() => skipSeconds(-10)}
            title="Mundur 10 detik"
            className="p-2 rounded-full text-emerald-300 hover:text-white hover:bg-emerald-800/50 transition"
          >
            <Rewind className="w-5 h-5" />
          </button>

          <button
            onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-emerald-950 flex items-center justify-center shadow-lg transition transform hover:scale-105 active:scale-95"
            aria-label={isPlaying ? 'Jeda' : 'Putar'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 ml-0.5 fill-current" />
            )}
          </button>

          <button
            onClick={() => skipSeconds(10)}
            title="Maju 10 detik"
            className="p-2 rounded-full text-emerald-300 hover:text-white hover:bg-emerald-800/50 transition"
          >
            <FastForward className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              if (audioRef.current) audioRef.current.currentTime = 0;
            }}
            title="Mulai Ulang"
            className="p-2 rounded-full text-emerald-300 hover:text-white hover:bg-emerald-800/50 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Volume & Download Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-emerald-800/60 relative z-10 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-emerald-300 hover:text-white transition"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-emerald-950 rounded appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleDownloadClick}
            isLoading={isDownloading}
            icon={<Download className="w-3.5 h-3.5" />}
            className="text-xs py-1.5 h-8 bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold"
          >
            Unduh Audio
          </Button>
        </div>
      </div>
    </div>
  );
};
