import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Share2, Music, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import PaymentModal from './PaymentModal';
import { JOCK_JAMS } from '../lib/songs';
import { supabase } from '../lib/supabase';

interface PreviewPlayerProps {
  songId: string;
  previewUrl: string;
  title: string;
}

export default function PreviewPlayer({ songId, previewUrl, title }: PreviewPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const vocalRef = useRef<HTMLAudioElement | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  
  const song = JOCK_JAMS.find(s => s.title === title);

  useEffect(() => {
    let mounted = true;

    const loadAudio = async () => {
      try {
        setIsLoading(true);
        
        // Get the signed URL for the preview
        const { data, error } = await supabase
          .storage
          .from('voice_samples')
          .createSignedUrl(previewUrl, 3600);

        if (error) throw error;

        if (mounted) {
          setAudioUrl(data.signedUrl);

          // Initialize vocal audio with higher volume
          if (data.signedUrl) {
            const audio = new Audio();
            audio.src = data.signedUrl;
            audio.volume = 0.9; // Set vocals to 90% volume
            vocalRef.current = audio;
          }

          // Initialize backing track with lower volume
          if (song?.backingTrackUrl) {
            const audio = new Audio();
            audio.src = song.backingTrackUrl;
            audio.volume = 0.4; // Set music to 40% volume
            audio.loop = true;
            musicRef.current = audio;
          }
        }
      } catch (error) {
        console.error('Error loading audio:', error);
        if (mounted) {
          toast.error('Failed to load audio preview');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    if (previewUrl && song) {
      loadAudio();
    }

    return () => {
      mounted = false;
      if (vocalRef.current) {
        vocalRef.current.pause();
        vocalRef.current = null;
      }
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current = null;
      }
    };
  }, [previewUrl, song]);

  const handlePlayPause = async () => {
    if (!vocalRef.current || !audioUrl) return;
    
    try {
      if (isPlaying) {
        vocalRef.current.pause();
        musicRef.current?.pause();
        setIsPlaying(false);
      } else {
        // Ensure audio is loaded
        await Promise.all([
          new Promise((resolve) => {
            if (vocalRef.current) {
              vocalRef.current.load();
              vocalRef.current.oncanplaythrough = resolve;
            }
          }),
          new Promise((resolve) => {
            if (musicRef.current) {
              musicRef.current.load();
              musicRef.current.oncanplaythrough = resolve;
            }
          })
        ]);

        // Reset both tracks to start
        vocalRef.current.currentTime = 0;
        if (musicRef.current) {
          musicRef.current.currentTime = 0;
        }

        // Play both tracks
        await Promise.all([
          vocalRef.current.play(),
          musicRef.current?.play()
        ]);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Playback error:', error);
      toast.error('Failed to play audio');
      setIsPlaying(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  // Handle audio ended event
  useEffect(() => {
    const handleEnded = () => {
      setIsPlaying(false);
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current.currentTime = 0;
      }
    };

    if (vocalRef.current) {
      vocalRef.current.addEventListener('ended', handleEnded);
    }

    return () => {
      if (vocalRef.current) {
        vocalRef.current.removeEventListener('ended', handleEnded);
      }
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      
      {song && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            Music: {song.attribution}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Licensed under {song.license}
          </p>
        </div>
      )}
      
      <div className="space-y-4 mb-6">
        <button
          onClick={handlePlayPause}
          disabled={isLoading || !audioUrl}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Loading...
            </>
          ) : isPlaying ? (
            <>
              <Pause className="w-5 h-5 mr-2" />
              Pause Preview
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" />
              Play Preview
            </>
          )}
        </button>

        <button
          onClick={handleShare}
          className="w-full text-gray-600 hover:text-gray-800 flex items-center justify-center py-2"
        >
          <Share2 className="w-5 h-5 mr-1" />
          Share
        </button>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <p className="text-blue-800">
          Like what you hear? Get the full version to share with friends!
        </p>
      </div>

      <button
        onClick={() => setShowPayment(true)}
        className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 flex items-center justify-center"
      >
        <Music className="w-5 h-5 mr-2" />
        Get Full Version
      </button>

      <PaymentModal
        songId={songId}
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
      />
    </div>
  );
}