export interface Song {
  id: string;
  voiceSampleUrl: string;
  previewUrl?: string;
  fullSongUrl?: string;
  shareUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  paid: boolean;
  stripeSessionId?: string;
  captchaVerified: boolean;
}

export interface JockJamSong {
  id: string;
  title: string;
  artist: string;
  year: number;
  tempo: string;
  key: string;
  rhythm: string;
  license: string;
  attribution: string;
  previewLyrics: string;
  fullLyrics: string;
  backingTrackUrl: string;
  minRecordingLength: number;
  maxRecordingLength: number;
  previewDuration: number;
  fullDuration: number;
  price: number;
}

export interface Analytics {
  date: string;
  voiceRecordingsCount: number;
  previewGenerationsCount: number;
  captchaAttemptsCount: number;
  captchaSuccessCount: number;
  paymentAttemptsCount: number;
  paymentSuccessCount: number;
  fullSongGenerationsCount: number;
}