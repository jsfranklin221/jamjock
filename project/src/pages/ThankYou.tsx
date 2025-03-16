import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Music, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { generateSong } from '../lib/elevenlabs';
import { uploadGeneratedAudio } from '../lib/storage';
import { JOCK_JAMS } from '../lib/songs';

export default function ThankYou() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(true);
  const [songId, setSongId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  useEffect(() => {
    const generateFullSong = async () => {
      try {
        const songId = searchParams.get('songId');
        if (!songId) {
          navigate('/');
          return;
        }

        setSongId(songId);

        // Get song details
        const { data: song, error: songError } = await supabase
          .from('songs')
          .select('*')
          .eq('id', songId)
          .single();

        if (songError || !song) {
          throw new Error('Song not found');
        }

        if (!song.paid) {
          navigate(`/share/${songId}`);
          return;
        }

        if (song.share_url) {
          setShareUrl(song.share_url);
          setIsGenerating(false);
          return;
        }

        // Get voice sample
        const { data: voiceSampleData } = await supabase.storage
          .from('voice_samples')
          .download(song.voice_sample_url);

        if (!voiceSampleData) {
          throw new Error('Voice sample not found');
        }

        // Find song template
        const songTemplate = JOCK_JAMS.find(s => s.title === song.title);
        if (!songTemplate) {
          throw new Error('Song template not found');
        }

        // Generate full song
        const fullSongBlob = await generateSong(
          voiceSampleData,
          'User',
          songTemplate,
          false // generate full song
        );

        // Upload full song
        const fullSongUrl = await uploadGeneratedAudio(fullSongBlob, songId, false);

        // Generate share URL
        const shareUrl = `${window.location.origin}/song/${songId}`;

        // Update song record
        const { error: updateError } = await supabase
          .from('songs')
          .update({
            full_song_url: fullSongUrl,
            share_url: shareUrl,
            status: 'completed'
          })
          .eq('id', songId);

        if (updateError) {
          throw updateError;
        }

        // Track generation in analytics
        await supabase.rpc('increment_analytics', {
          metric: 'full_song_generations'
        });

        setShareUrl(shareUrl);
        setIsGenerating(false);

      } catch (error) {
        console.error('Full song generation error:', error);
        toast.error('Failed to generate your song. Please try again later.');
        setIsGenerating(false);
      }
    };

    generateFullSong();
  }, [searchParams, navigate]);

  const handleShare = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="mb-6">
          <Music className="w-12 h-12 text-blue-600 mx-auto" />
        </div>
        
        <h1 className="text-2xl font-bold mb-4">
          Thank You for Your Purchase!
        </h1>

        <div className="space-y-4">
          {isGenerating ? (
            <>
              <div className="flex items-center justify-center space-x-2 text-blue-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating your full song...</span>
              </div>
              <p className="text-gray-600 text-sm">
                This may take a few minutes. Please don't close this window.
              </p>
            </>
          ) : shareUrl ? (
            <>
              <p className="text-green-600">
                Your song is ready!
              </p>
              <div className="flex flex-col space-y-4">
                <a
                  href={shareUrl}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center justify-center"
                >
                  <Music className="w-5 h-5 mr-2" />
                  Listen to Your Song
                </a>
                <button
                  onClick={handleShare}
                  className="text-gray-600 hover:text-gray-800 flex items-center justify-center py-2"
                >
                  <Share2 className="w-5 h-5 mr-1" />
                  Share
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-red-600">
                Something went wrong while generating your song.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="text-blue-600 hover:text-blue-700"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}