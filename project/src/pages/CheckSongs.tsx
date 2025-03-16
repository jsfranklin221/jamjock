import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Song {
  id: string;
  title: string;
  status: string;
  created_at: string;
  paid: boolean;
}

export default function CheckSongs() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSongs = async () => {
      try {
        // Get songs directly by user_id from auth.users
        const { data: authUser } = await supabase.auth
          .getUser('jsfranklin221+user7@gmail.com');

        if (!authUser?.user?.id) {
          setError('User not found');
          return;
        }

        // Get songs for user
        const { data: songs, error: songsError } = await supabase
          .from('songs')
          .select('*')
          .eq('user_id', authUser.user.id);

        if (songsError) throw songsError;

        setSongs(songs || []);
      } catch (error) {
        console.error('Error checking songs:', error);
        setError(error instanceof Error ? error.message : 'Failed to check songs');
      } finally {
        setIsLoading(false);
      }
    };

    checkSongs();
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Songs for jsfranklin221+user7@gmail.com:</h2>
      {songs.length === 0 ? (
        <p className="text-gray-600">No songs found</p>
      ) : (
        <div className="space-y-4">
          {songs.map(song => (
            <div key={song.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">{song.title}</h3>
                <span className={`px-2 py-1 rounded text-sm ${
                  song.status === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {song.status}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                <p>Created: {new Date(song.created_at).toLocaleDateString()}</p>
                <p>Paid: {song.paid ? 'Yes' : 'No'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}