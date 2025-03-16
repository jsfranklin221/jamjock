import React, { useState, useRef, useEffect } from 'react';
import { Mic, Loader2, Volume2, Music, Clock, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { initAudioContext } from '../lib/audio';
import { supabase } from '../lib/supabase';
import { JOCK_JAMS } from '../lib/songs';
import { generateSong } from '../lib/elevenlabs';
import { uploadVoiceSample, uploadGeneratedAudio, downloadAndStoreBacking } from '../lib/storage';
import SimpleCaptcha from '../components/SimpleCaptcha';
import AudioRecorder from '../components/AudioRecorder';
import { useAuthStore } from '../store';

export default function Create() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [selectedSong, setSelectedSong] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaValue, setCaptchaValue] = useState('');
  const [isRecorderReady, setIsRecorderReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      try {
        await initAudioContext();
        if (mounted) {
          setIsRecorderReady(true);
        }
      } catch (error) {
        console.error('Recorder initialization failed:', error);
        if (mounted) {
          toast.error('Failed to initialize audio recorder. Please try again.');
        }
      }
    };

    setup();

    return () => {
      mounted = false;
    };
  }, []);

  const handleRecordingComplete = (blob: Blob) => {
    setAudioBlob(blob);
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!audioBlob || !selectedSong || !captchaValue) {
      toast.error('Please complete all steps');
      return;
    }

    setIsLoading(true);
    console.log('Starting song generation process...');

    try {
      // Find selected song
      const song = JOCK_JAMS.find(s => s.id === selectedSong);
      if (!song) throw new Error('Selected song not found');

      // Track voice recording
      await supabase.rpc('increment_analytics', {
        metric: 'voice_recordings'
      });

      // Upload voice sample
      const voiceSampleUrl = await uploadVoiceSample(audioBlob, user?.id);

      // Download and store backing track
      const backingTrackUrl = await downloadAndStoreBacking(song.backingTrackUrl, song.id);

      // Generate preview
      console.log('Generating preview with ElevenLabs...');
      const previewBlob = await generateSong(audioBlob, 'User', song, true);
      
      // Track preview generation
      await supabase.rpc('increment_analytics', {
        metric: 'preview_generations'
      });

      // Upload preview
      const previewUrl = await uploadGeneratedAudio(previewBlob, song.id, true);

      console.log('Creating song record in Supabase...');
      const { data: songData, error: songError } = await supabase
        .from('songs')
        .insert({
          title: song.title,
          voice_sample_url: voiceSampleUrl,
          preview_url: previewUrl,
          backing_track_url: backingTrackUrl,
          status: 'completed',
          user_id: user?.id
        })
        .select()
        .single();

      if (songError) {
        console.error('Song record creation error:', songError);
        throw songError;
      }

      if (!songData) {
        throw new Error('Failed to create song record');
      }

      console.log('Song generation completed successfully');
      toast.success('Preview generated successfully!');
      navigate(`/share/${songData.id}`);
      
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSongs = JOCK_JAMS.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-12 px-4">
          <div className="flex items-center flex-1">
            <div className="flex items-center">
              <div className={`${step === 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'} rounded-full w-8 h-8 flex items-center justify-center font-medium`}>
                1
              </div>
              <span className={`ml-3 font-medium ${step === 1 ? 'text-blue-600' : 'text-gray-400'}`}>Record Voice</span>
            </div>
            <div className="flex-1 h-px bg-gray-200 mx-4" />
          </div>
          
          <div className="flex items-center flex-1">
            <div className="flex items-center">
              <div className={`${step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'} rounded-full w-8 h-8 flex items-center justify-center font-medium`}>
                2
              </div>
              <span className={`ml-3 font-medium ${step === 2 ? 'text-blue-600' : 'text-gray-400'}`}>Pick Your Song</span>
            </div>
            <div className="flex-1 h-px bg-gray-200 mx-4" />
          </div>

          <div className="flex items-center">
            <div className={`${step === 3 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'} rounded-full w-8 h-8 flex items-center justify-center font-medium`}>
              3
            </div>
            <span className={`ml-3 font-medium ${step === 3 ? 'text-blue-600' : 'text-gray-400'}`}>Preview & Share</span>
          </div>
        </div>

        {step === 1 && (
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-6">Let's Hear Your Voice!</h1>
            
            <div className="mb-8">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 max-w-md mx-auto">
                <Volume2 className="w-6 h-6 text-blue-600 mx-auto mb-3" />
                <p className="text-gray-700 mb-4">
                  We need 30 seconds of your voice to create your song!
                </p>
                <p className="text-sm text-gray-700 font-medium">
                  Quick Tips:
                </p>
                <ul className="text-sm text-gray-600 mt-2 space-y-1">
                  <li>• Find a quiet spot</li>
                  <li>• Speak clearly and naturally</li>
                  <li>• Have fun with it!</li>
                </ul>
              </div>
            </div>

            <AudioRecorder
              onRecordingComplete={handleRecordingComplete}
              onNext={() => setStep(2)}
            />
          </div>
        )}

        {step === 2 && (
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-6">Pick Your Song</h1>
            <p className="text-gray-600 mb-8">Choose from our collection of iconic stadium anthems!</p>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto mb-8">
              <input
                type="text"
                placeholder="Search by song title or artist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Song Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {filteredSongs.map(song => (
                <button
                  key={song.id}
                  onClick={() => {
                    setSelectedSong(song.id);
                    setStep(3);
                  }}
                  className={`p-6 rounded-lg border-2 transition-all hover:shadow-md text-left ${
                    selectedSong === song.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-400'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold">{song.title}</h3>
                    <Music className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{song.artist} ({song.year})</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{song.tempo.split('=')[0]}</span>
                    </div>
                  </div>
                  
                  <p className="mt-3 text-sm text-gray-500 italic line-clamp-2">
                    "{song.previewLyrics.split('\n')[0]}"
                  </p>
                </button>
              ))}
            </div>

            {filteredSongs.length === 0 && (
              <p className="text-gray-500 mt-8">No songs found matching your search.</p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-6">Almost Ready!</h1>
            <p className="text-gray-600 mb-8">Just one quick check to make sure you're human, then we'll create your preview!</p>
            <div className="max-w-md mx-auto">
              <SimpleCaptcha onChange={setCaptchaValue} />
              <button
                onClick={handleSubmit}
                disabled={isLoading || !captchaValue}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Creating Your Preview...
                  </>
                ) : (
                  'Generate Preview'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}