import { toast } from 'sonner';

let audioContext: AudioContext | null = null;

export const initAudioContext = () => {
  try {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    return audioContext;
  } catch (error) {
    console.error('Failed to create AudioContext:', error);
    toast.error('Your browser does not support audio recording');
    return null;
  }
};

export const createMediaRecorder = async (): Promise<MediaRecorder> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return new MediaRecorder(stream);
  } catch (error) {
    console.error('Failed to create MediaRecorder:', error);
    throw new Error('Failed to access microphone');
  }
};

export const stopMediaRecorder = (recorder: MediaRecorder | null): void => {
  if (!recorder) return;
  
  try {
    if (recorder.state !== 'inactive') {
      recorder.stop();
    }
    recorder.stream.getTracks().forEach(track => track.stop());
  } catch (error) {
    console.error('Error stopping MediaRecorder:', error);
  }
};

export const blobToArrayBuffer = (blob: Blob): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
};

export const fetchAndDecodeAudio = async (url: string): Promise<AudioBuffer> => {
  if (!audioContext) {
    throw new Error('AudioContext not initialized');
  }

  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return await audioContext.decodeAudioData(arrayBuffer);
};

export const mixAudioTracks = async (
  vocalBlob: Blob,
  backingTrackUrl: string,
  vocalVolume: number = 0.8,
  backingVolume: number = 0.6
): Promise<Blob> => {
  if (!audioContext) {
    audioContext = initAudioContext();
  }

  if (!audioContext) {
    throw new Error('Failed to initialize AudioContext');
  }

  try {
    // Convert vocal blob to AudioBuffer
    const vocalArrayBuffer = await blobToArrayBuffer(vocalBlob);
    const vocalBuffer = await audioContext.decodeAudioData(vocalArrayBuffer);

    // Fetch and decode backing track
    const backingBuffer = await fetchAndDecodeAudio(backingTrackUrl);

    // Create offline context for mixing
    const offlineCtx = new OfflineAudioContext(
      2, // stereo output
      Math.max(vocalBuffer.length, backingBuffer.length),
      audioContext.sampleRate
    );

    // Create source nodes
    const vocalSource = offlineCtx.createBufferSource();
    const backingSource = offlineCtx.createBufferSource();

    // Create gain nodes for volume control
    const vocalGain = offlineCtx.createGain();
    const backingGain = offlineCtx.createGain();

    // Set volumes
    vocalGain.gain.value = vocalVolume;
    backingGain.gain.value = backingVolume;

    // Connect nodes
    vocalSource.buffer = vocalBuffer;
    backingSource.buffer = backingBuffer;

    vocalSource.connect(vocalGain);
    backingSource.connect(backingGain);

    vocalGain.connect(offlineCtx.destination);
    backingGain.connect(offlineCtx.destination);

    // Start playback
    vocalSource.start(0);
    backingSource.start(0);

    // Render the mix
    const renderedBuffer = await offlineCtx.startRendering();

    // Convert AudioBuffer to Blob
    const mixedData = renderedBuffer.getChannelData(0);
    const mixedWav = new Blob([mixedData], { type: 'audio/wav' });

    return mixedWav;
  } catch (error) {
    console.error('Error mixing audio:', error);
    throw new Error('Failed to mix audio tracks');
  }
};

export const createAudioPlayer = (
  audioUrl: string,
  onPlay?: () => void,
  onPause?: () => void,
  onEnded?: () => void,
  onError?: (error: Error) => void
): HTMLAudioElement => {
  const audio = new Audio(audioUrl);
  
  audio.addEventListener('play', () => onPlay?.());
  audio.addEventListener('pause', () => onPause?.());
  audio.addEventListener('ended', () => onEnded?.());
  audio.addEventListener('error', (e) => onError?.(new Error('Audio playback error')));

  return audio;
};

export const setAudioVolume = (audio: HTMLAudioElement, volume: number): void => {
  audio.volume = Math.max(0, Math.min(1, volume));
};

export const synchronizeAudioTracks = (
  tracks: HTMLAudioElement[],
  shouldPlay: boolean
): void => {
  const playPromises = tracks.map(track => {
    if (shouldPlay) {
      track.currentTime = 0;
      return track.play();
    } else {
      track.pause();
      return Promise.resolve();
    }
  });

  Promise.all(playPromises).catch(error => {
    console.error('Error synchronizing audio tracks:', error);
    toast.error('Failed to play audio');
  });
};