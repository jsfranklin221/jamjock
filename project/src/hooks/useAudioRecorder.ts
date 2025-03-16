import { useState, useRef, useCallback, useEffect } from 'react';

interface UseAudioRecorderOptions {
  maxDuration?: number;
  onDataAvailable?: (blob: Blob) => void;
}

export function useAudioRecorder({
  maxDuration = 30,
  onDataAvailable,
}: UseAudioRecorderOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timerRef = useRef<number>();
  const stream = useRef<MediaStream | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }
    if (stream.current) {
      stream.current.getTracks().forEach(track => track.stop());
      stream.current = null;
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  }, [audioUrl]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const startRecording = useCallback(async () => {
    try {
      cleanup();
      chunks.current = [];

      stream.current = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      mediaRecorder.current = new MediaRecorder(stream.current);

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.current.push(e.data);
        }
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setIsRecording(false);
        
        if (onDataAvailable) {
          onDataAvailable(blob);
        }
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setDuration(0);
      setError(null);

      // Start duration timer
      timerRef.current = window.setInterval(() => {
        setDuration(prev => {
          if (prev >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Recording error:', error);
      setError('Microphone access denied. Please allow microphone access and try again.');
    }
  }, [cleanup, maxDuration, onDataAvailable]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      if (stream.current) {
        stream.current.getTracks().forEach(track => track.stop());
      }
    }
  }, []);

  const resetRecording = useCallback(() => {
    cleanup();
    setIsRecording(false);
    setAudioUrl(null);
    setDuration(0);
    setError(null);
  }, [cleanup]);

  return {
    isRecording,
    audioUrl,
    error,
    duration,
    startRecording,
    stopRecording,
    resetRecording,
  };
}