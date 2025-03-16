import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Music, User, LogOut } from 'lucide-react';
import { useAuthStore } from '../store';
import { signOut } from '../lib/auth';
import AuthModal from './AuthModal';
import { toast } from 'sonner';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null); // Clear user from store
      navigate('/'); // Redirect to home
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to={user ? "/library" : "/"} className="flex items-center space-x-2">
              <Music className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold">JamJock</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {!user && (
              <Link
                to="/"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md"
              >
                Home
              </Link>
            )}
            {user && (
              <Link
                to="/library"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md"
              >
                Library
              </Link>
            )}
            <Link
              to="/create"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Create
            </Link>
            {user ? (
              <button
                onClick={handleSignOut}
                className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md flex items-center"
              >
                <LogOut className="w-5 h-5 mr-1" />
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md flex items-center"
              >
                <User className="w-5 h-5 mr-1" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </nav>
  );
}