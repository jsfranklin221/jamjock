import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Share2, Loader2, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../store';
import { supabase } from '../lib/supabase';
import { generateSongToken } from '../lib/tokens';
import AuthModal from '../components/AuthModal';

interface LibrarySong {
  id: string;
  title: string;
  status: string;
  created_at: string;
  share_url: string | null;
  full_song_url: string | null;
  paid: boolean;
}

export default function Library() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [songs, setSongs] = useState<LibrarySong[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const fetchSongs = async () => {
      try {
        // Get songs where user is owner OR song is paid and linked to their account
        const { data, error } = await supabase
          .from('songs')
          .select('*')
          .or(`user_id.eq.${user.id},and(paid.eq.true,user_id.eq.${user.id})`)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSongs(data || []);
      } catch (error) {
        console.error('Error fetching songs:', error);
        toast.error('Failed to load your songs');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSongs();

    // Subscribe to realtime updates for paid songs
    const subscription = supabase
      .channel('songs_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'songs',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setSongs(current => {
            const updated = [...current];
            const index = updated.findIndex(s => s.id === payload.new.id);
            if (index !== -1) {
              updated[index] = payload.new as LibrarySong;
            } else {
              updated.push(payload.new as LibrarySong);
            }
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, navigate]);

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    window.location.reload(); // Reload to fetch songs with new auth state
  };

  const handlePlayPause = async (song: LibrarySong) => {
    try {
      if (!song.full_song_url) {
        toast.error('Full song not available');
        return;
      }

      if (playingSongId === song.id) {
        // Stop current song
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        setPlayingSongId(null);
        return;
      }

      // Stop any currently playing song
      if (audioRef.current) {
        audioRef.current.pause();
      }

      // Get signed URL for the full song
      const { data: urlData, error: urlError } = await supabase.storage
        .from('voice_samples')
        .createSignedUrl(song.full_song_url, 3600);

      if (urlError) throw urlError;

      // Create and play new audio
      const audio = new Audio(urlData.signedUrl);
      audio.addEventListener('ended', () => setPlayingSongId(null));
      await audio.play();
      
      audioRef.current = audio;
      setPlayingSongId(song.id);
    } catch (error) {
      console.error('Playback error:', error);
      toast.error('Failed to play song');
    }
  };

  const handleShare = async (songId: string) => {
    try {
      const shareUrl = await generateSongToken(songId);
      if (shareUrl) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Share link copied to clipboard!');
      }
    } catch (error) {
      toast.error('Failed to generate share link');
    }
  };

  if (!user) {
    return (
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => navigate('/')}
        onSuccess={handleAuthSuccess}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Your Library</h1>

      {songs.length === 0 ? (
        <div className="text-center py-12">
          <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No songs yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {songs.map((song) => (
            <div
              key={song.id}
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">{song.title}</h3>
                <span className={`text-sm px-2 py-1 rounded ${
                  song.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {song.status}
                </span>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                Created {new Date(song.created_at).toLocaleDateString()}
              </p>

              <div className="space-y-2">
                {song.paid && song.full_song_url ? (
                  <button
                    onClick={() => handlePlayPause(song)}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center justify-center"
                  >
                    {playingSongId === song.id ? (
                      <>
                        <Pause className="w-5 h-5 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2" />
                        Play Full Song
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => navigate(`/share/${song.id}`)}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center justify-center"
                  >
                    <Music className="w-5 h-5 mr-2" />
                    Get Full Version
                  </button>
                )}

                <button
                  onClick={() => handleShare(song.id)}
                  className="w-full text-gray-600 hover:text-gray-800 flex items-center justify-center py-2"
                >
                  <Share2 className="w-5 h-5 mr-1" />
                  Share
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}