'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MediaFile } from '@/types/database';
import { formatBytes, formatDuration } from '@/lib/utils';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Download,
  X,
  Video,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface VideoPlayerProps {
  media: MediaFile | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (media: MediaFile) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  media,
  isOpen,
  onClose,
  onDownload,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [isOpen, media]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (!isOpen || !media) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      setIsMuted(newVol === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
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
        a.download = media.title || 'arsip-video.mp4';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div
        ref={containerRef}
        className="relative w-full max-w-4xl bg-stone-900 rounded-2xl overflow-hidden shadow-2xl border border-amber-600/30 flex flex-col group"
        onMouseEnter={() => setShowControls(true)}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-b from-stone-950/90 via-stone-900/80 to-transparent text-white z-20">
          <div className="flex items-center gap-2.5 truncate pr-3">
            <div className="p-1.5 rounded-lg bg-emerald-900 text-amber-300">
              <Video className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h3 className="text-sm sm:text-base font-semibold text-stone-100 truncate">
                {media.title}
              </h3>
              <p className="text-xs text-stone-400">
                {media.event?.title || 'Video Dokumentasi'} • {formatBytes(media.file_size)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleDownloadClick}
              isLoading={isDownloading}
              icon={<Download className="w-3.5 h-3.5" />}
              className="text-xs py-1.5 h-8"
            >
              Unduh
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-rose-950/60 transition"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Screen Viewport */}
        <div className="relative aspect-video bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            src={media.file_url}
            className="w-full h-full object-contain cursor-pointer"
            onClick={togglePlay}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            playsInline
          />

          {/* Big Center Play Overlay Button */}
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-emerald-700/80 hover:bg-emerald-600 text-amber-300 flex items-center justify-center backdrop-blur-xs transition transform hover:scale-110 shadow-lg border border-amber-400/40"
              aria-label="Putar Video"
            >
              <Play className="w-8 h-8 ml-1 fill-current" />
            </button>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div
          className={`px-4 py-3 bg-stone-950/95 border-t border-stone-800 text-white transition-opacity duration-200 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Progress Seek Bar */}
          <div className="relative mb-2.5 flex items-center">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
              style={{
                background: `linear-gradient(to right, #d97706 ${progressPercent}%, #44403c ${progressPercent}%)`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm">
            {/* Play/Pause & Time */}
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="p-1.5 rounded-lg text-amber-400 hover:text-white hover:bg-stone-800 transition"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
              </button>

              <button
                onClick={() => {
                  if (videoRef.current) videoRef.current.currentTime = 0;
                }}
                title="Mulai Ulang"
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <span className="font-mono text-stone-300 text-xs">
                {formatDuration(currentTime)} / {formatDuration(duration)}
              </span>
            </div>

            {/* Volume & Fullscreen */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={toggleMute}
                  className="p-1.5 text-stone-300 hover:text-white transition"
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
                  className="w-16 h-1 bg-stone-700 rounded appearance-none cursor-pointer accent-amber-500 hidden sm:block"
                />
              </div>

              <button
                onClick={toggleFullscreen}
                className="p-1.5 text-stone-300 hover:text-white transition"
                title="Layar Penuh"
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4" />
                ) : (
                  <Maximize className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
