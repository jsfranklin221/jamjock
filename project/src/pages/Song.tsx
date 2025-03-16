import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Share2, Volume2, Music, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { JOCK_JAMS } from '../lib/songs';

export default function Song() {
  const { songId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [songTitle, setSongTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const loadSong = async () => {
      try {
        if (!songId) return;

        // Get song details
        const { data: song, error: songError } = await supabase
          .from('songs')
          .select('*')
          .eq('id', songId)
          .single();

        if (songError || !song) {
          throw new Error('Song not found');
        }

        setSongTitle(song.title);

        if (!song.full_song_url) {
          throw new Error('Song file not found');
        }

        // Get signed URL for the full song
        const { data: urlData, error: urlError } = await supabase.storage
          .from('voice_samples')
          .createSignedUrl(song.full_song_url, 3600);

        if (urlError || !urlData?.signedUrl) {
          throw urlError || new Error('Failed to get song URL');
        }

        setAudioUrl(urlData.signedUrl);
      } catch (error) {
        console.error('Error loading song:', error);
        setError(error instanceof Error ? error.message : 'Failed to load song');
      } finally {
        setIsLoading(false);
      }
    };

    loadSong();
  }, [songId]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const song = JOCK_JAMS.find(s => s.title === songTitle);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-6">{songTitle}</h1>

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

          <div className="space-y-6">
            <button
              onClick={handlePlayPause}
              disabled={!audioUrl}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isPlaying ? (
                <>
                  <Volume2 className="w-5 h-5 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Music className="w-5 h-5 mr-2" />
                  Play
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

            {audioUrl && (
              <audio
                ref={audioRef}
                src={audioUrl}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}