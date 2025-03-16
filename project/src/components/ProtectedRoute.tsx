import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedEmail?: string;
}

export default function ProtectedRoute({ children, allowedEmail }: ProtectedRouteProps) {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        if (!user) {
          setHasAccess(false);
          return;
        }

        // If allowedEmail is specified, check if user's email matches
        if (allowedEmail) {
          const { data: { user: userData }, error } = await supabase.auth.getUser();
          
          if (error) throw error;
          
          setHasAccess(userData?.email === allowedEmail);
        } else {
          setHasAccess(true);
        }
      } catch (error) {
        console.error('Access check error:', error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [user, allowedEmail]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}