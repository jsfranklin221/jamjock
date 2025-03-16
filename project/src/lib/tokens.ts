import { toast } from 'sonner';

export const generateSongToken = async (songId: string): Promise<string | null> => {
  try {
    const response = await fetch('/.netlify/functions/generate-song-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ songId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate share link');
    }

    const { shareUrl } = await response.json();
    return shareUrl;
  } catch (error) {
    console.error('Share link generation error:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to generate share link');
    return null;
  }
};

export const verifySongToken = async (token: string, songId: string) => {
  try {
    const response = await fetch('/.netlify/functions/verify-song-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, songId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Invalid or expired link');
    }

    return await response.json();
  } catch (error) {
    console.error('Token verification error:', error);
    throw error;
  }
};