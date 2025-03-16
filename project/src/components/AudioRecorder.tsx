import React, { useEffect } from 'react';
import { Mic, Square, Play, Pause, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

interface AudioRecorderProps {
  onRecordingComplete?: (blob: Blob) => void;
  onNext?: () => void;
}

export default function AudioRecorder({ onRecordingComplete, onNext }: AudioRecorderProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const {
    isRecording,
    audioUrl,
    error,
    duration,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder({
    maxDuration: 30,
    onDataAvailable: (blob) => {
      if (onRecordingComplete) {
        onRecordingComplete(blob);
      }
    }
  });

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    // Automatically stop recording at 30 seconds
    if (duration >= 30 && isRecording) {
      stopRecording();
      toast.success('Recording complete! You can now preview or continue.');
    }
  }, [duration, isRecording, stopRecording]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const remainingTime = Math.max(0, 30 - duration);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col items-center">
          {/* Timer */}
          <div className="text-4xl font-mono mb-4 tabular-nums">
            {formatTime(remainingTime)}
          </div>

          {/* Status Message */}
          <p className="text-sm mb-6 text-center text-gray-600">
            {!isRecording && !audioUrl && 'Press record and sing for 30 seconds'}
            {isRecording && remainingTime > 0 && 'Keep singing!'}
            {isRecording && remainingTime === 0 && 'Perfect! Recording complete'}
            {!isRecording && audioUrl && 'Recording complete! Listen back or continue'}
          </p>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-gray-100 rounded-full mb-8">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                remainingTime === 0 ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${(duration / 30) * 100}%` }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center space-x-4">
            {!audioUrl ? (
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isRecording && remainingTime === 0}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                  isRecording 
                    ? remainingTime === 0
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-red-500 hover:bg-red-600'
                    : 'bg-blue-600 hover:bg-blue-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isRecording ? (
                  <Square className="w-6 h-6 text-white" />
                ) : (
                  <Mic className="w-6 h-6 text-white" />
                )}
              </button>
            ) : (
              <div className="flex items-center space-x-4">
                <button
                  onClick={handlePlayPause}
                  className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white" />
                  )}
                </button>

                <button
                  onClick={resetRecording}
                  className="text-sm text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300"
                >
                  Record Again
                </button>

                <button
                  onClick={onNext}
                  className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center"
                >
                  <ArrowRight className="w-5 h-5 text-white" />
                </button>
              </div>
            )}
          </div>

          {/* Audio Player */}
          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              onPause={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              className="hidden"
            />
          )}
        </div>
      </div>
    </div>
  );
}