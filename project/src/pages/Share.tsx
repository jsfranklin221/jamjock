import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import PreviewPlayer from '../components/PreviewPlayer';
import type { Song } from '../types';

export default function Share() {
  const { songId } = useParams();
  const [song, setSong] = useState<Song | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSong = async () => {
      if (!songId) return;

      try {
        const { data, error } = await supabase
          .from('songs')
          .select('*')
          .eq('id', songId)
          .single();

        if (error) throw error;
        setSong(data);
      } catch (error) {
        console.error('Error fetching song:', error);
        toast.error('Failed to load song');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSong();
  }, [songId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!song) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Song Not Found</h1>
        <p className="text-gray-600">This song may have been removed or is no longer available.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <PreviewPlayer
        songId={song.id}
        previewUrl={song.preview_url || ''}
        title={song.title}
      />
    </div>
  );
}