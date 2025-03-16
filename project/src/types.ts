export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

export interface Song {
  id: string;
  userId?: string;
  title: string;
  voiceSampleUrl: string;
  previewUrl?: string;
  fullSongUrl?: string;
  shareUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  paid: boolean;
  stripePriceId?: string;
}

export interface AdminStats {
  dailyGenerations: number;
  dailyLimit: number;
  totalEarnings: number;
  apiCosts: number;
}