import { supabase } from './supabase';
import { toast } from 'sonner';

const PAYMENT_LINK = 'https://buy.stripe.com/bIY3dZ2qI7jG2R2aEF';

export const createPaymentLink = async (songId: string): Promise<string> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Update song with user ID and client reference ID
    const { error: updateError } = await supabase
      .from('songs')
      .update({ 
        client_reference_id: songId,
        user_id: user?.id // Associate song with user before payment
      })
      .eq('id', songId);

    if (updateError) {
      console.error('Failed to update song:', updateError);
      throw updateError;
    }

    // Track payment attempt in analytics
    await fetch('/api/track-payment-attempt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ songId }),
    }).catch(console.error); // Non-blocking

    // Return the payment link with client reference ID and success URL
    return `${PAYMENT_LINK}?client_reference_id=${songId}&redirect_url=${encodeURIComponent(`${window.location.origin}/library`)}`;
  } catch (error) {
    console.error('Payment link error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create payment link';
    toast.error(message);
    throw error;
  }
};