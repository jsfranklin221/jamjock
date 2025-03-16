import { toast } from 'sonner';
import { JockJamSong } from '../types';

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

if (!ELEVENLABS_API_KEY) {
  throw new Error('Missing ElevenLabs API key');
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (retries === 0) throw error;
    await delay(RETRY_DELAY * (MAX_RETRIES - retries + 1));
    return retryWithBackoff(operation, retries - 1);
  }
};

const cloneVoice = async (audioBlob: Blob, name: string): Promise<string> => {
  console.log('Starting voice cloning...');
  
  // Convert audio to proper format if needed
  let processedBlob = audioBlob;
  if (audioBlob.type !== 'audio/wav') {
    processedBlob = new Blob([audioBlob], { type: 'audio/wav' });
  }

  // Validate audio duration
  const audio = new Audio(URL.createObjectURL(processedBlob));
  await new Promise((resolve, reject) => {
    audio.onloadedmetadata = () => {
      if (audio.duration < 30) {
        reject(new Error('Audio sample must be at least 30 seconds long'));
      }
      resolve(audio.duration);
    };
    audio.onerror = () => reject(new Error('Failed to load audio'));
  });

  const formData = new FormData();
  formData.append('name', name);
  formData.append('description', `Voice clone for ${name}`);
  formData.append('files', processedBlob, 'sample.wav');

  // Exactly 5 optimized labels for singing
  const labels = {
    type: 'singing',
    use_case: 'performance',
    style: 'powerful',
    emotion: 'joyful',
    quality: 'high'
  };

  formData.append('labels', JSON.stringify(labels));

  const response = await fetch(`${ELEVENLABS_API_URL}/voices/add`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Voice cloning error:', error);
    throw new Error(error.detail?.message || 'Failed to clone voice');
  }

  const data = await response.json();
  console.log('Voice cloning successful:', data.voice_id);
  return data.voice_id;
};

const generateAudio = async (
  text: string,
  voiceId: string
): Promise<Blob> => {
  console.log('Generating audio...');
  
  const response = await fetch(
    `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.3,            // Lower stability for more expressiveness
          similarity_boost: 0.65,    // Lower similarity for more character
          style: 0.85,              // High style for dynamic performance
          use_speaker_boost: true,
          speaking_rate: 0.85,       // Slightly slower for clearer singing
          pitch: 1.0,               // Natural pitch
          volume_adjustment: 6       // Maximum volume boost
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error('Audio generation error:', error);
    throw new Error(error.detail?.message || 'Failed to generate audio');
  }

  const audioBlob = await response.blob();
  console.log('Audio generation successful');
  return audioBlob;
};

const deleteVoice = async (voiceId: string): Promise<void> => {
  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/voices/${voiceId}`, {
      method: 'DELETE',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });

    if (!response.ok) {
      console.error('Failed to delete voice:', voiceId);
    }
  } catch (error) {
    console.error('Error deleting voice:', error);
  }
};

export const generateSong = async (
  audioBlob: Blob,
  userName: string,
  song: JockJamSong,
  isPreview: boolean = false
): Promise<Blob> => {
  let voiceId: string | undefined;
  
  try {
    console.log('Starting song generation process...');
    
    // Clone voice with enhanced parameters
    voiceId = await retryWithBackoff(async () => {
      try {
        return await cloneVoice(audioBlob, `${userName}-${Date.now()}`);
      } catch (error) {
        console.error('Voice cloning error:', error);
        throw new Error('Failed to clone voice. Please try again.');
      }
    });

    if (!voiceId) {
      throw new Error('Failed to create voice clone');
    }

    // Generate audio with enhanced prompt
    const lyrics = isPreview ? song.previewLyrics : song.fullLyrics;
    
    // Enhanced prompt focusing on enthusiastic singing
    const prompt = `[SING with passion and joy! Perform like you're on stage at a stadium!] ${lyrics}`;

    const generatedAudio = await retryWithBackoff(async () => {
      try {
        return await generateAudio(prompt, voiceId!);
      } catch (error) {
        console.error('Audio generation error:', error);
        throw new Error('Failed to generate audio. Please try again.');
      }
    });

    console.log('Song generation completed successfully');
    return generatedAudio;
  } catch (error) {
    console.error('Error in generateSong:', error);
    throw error;
  } finally {
    if (voiceId) {
      try {
        await deleteVoice(voiceId);
      } catch (error) {
        console.error('Voice cleanup error:', error);
      }
    }
  }
};