import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isRecording: boolean;
}

export default function AudioVisualizer({ isRecording }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    let audioContext: AudioContext | null = null;
    let mediaStream: MediaStream | null = null;

    const setupAudioContext = async () => {
      try {
        if (!isRecording) return;

        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const source = audioContext.createMediaStreamSource(mediaStream);
        analyserRef.current = audioContext.createAnalyser();
        analyserRef.current.fftSize = 256;
        
        source.connect(analyserRef.current);
        
        const bufferLength = analyserRef.current.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);
        
        animate();
      } catch (error) {
        console.error('Audio setup error:', error);
      }
    };

    const animate = () => {
      if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const draw = () => {
        if (!isRecording) return;
        
        const WIDTH = canvas.width;
        const HEIGHT = canvas.height;

        analyserRef.current!.getByteFrequencyData(dataArrayRef.current!);

        ctx.fillStyle = 'rgb(249, 250, 251)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        const barWidth = (WIDTH / dataArrayRef.current!.length) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < dataArrayRef.current!.length; i++) {
          barHeight = (dataArrayRef.current![i] / 255) * HEIGHT;

          const hue = (i / dataArrayRef.current!.length) * 220 + 180;
          ctx.fillStyle = `hsla(${hue}, 70%, 60%, 0.8)`;
          ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

          x += barWidth + 1;
        }

        animationFrameRef.current = requestAnimationFrame(draw);
      };

      draw();
    };

    if (isRecording) {
      setupAudioContext();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [isRecording]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={100}
      className="w-full rounded-lg bg-gray-50"
    />
  );
}