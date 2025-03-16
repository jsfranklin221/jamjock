import React, { useState } from 'react';
import { X, Loader2, CreditCard } from 'lucide-react';
import { createPaymentLink } from '../lib/stripe';
import { toast } from 'sonner';
import { useAuthStore } from '../store';
import { supabase } from '../lib/supabase';
import AuthModal from './AuthModal';

interface PaymentModalProps {
  songId: string;
  onClose: () => void;
  isOpen: boolean;
}

export default function PaymentModal({ songId, onClose, isOpen }: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useAuthStore();

  const handlePayment = async () => {
    try {
      if (!user) {
        setShowAuthModal(true);
        return;
      }

      setIsLoading(true);

      // Update song with user ID before creating payment link
      const { error: updateError } = await supabase
        .from('songs')
        .update({ user_id: user.id })
        .eq('id', songId);

      if (updateError) {
        throw updateError;
      }

      const paymentUrl = await createPaymentLink(songId);
      
      if (!paymentUrl) {
        throw new Error('No payment URL received');
      }

      // Open payment link in same window
      window.location.href = paymentUrl;
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start payment process');
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    handlePayment();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Complete Your Purchase</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              disabled={isLoading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">What You'll Get:</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  • Full-length AI-generated song
                </li>
                <li className="flex items-center">
                  • High-quality audio file
                </li>
                <li className="flex items-center">
                  • Shareable link
                </li>
                <li className="flex items-center">
                  • Lifetime access
                </li>
              </ul>
            </div>

            <button
              onClick={handlePayment}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  {user ? 'Proceed to Payment' : 'Sign In to Continue'}
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center">
              Secure payment powered by Stripe
            </p>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}