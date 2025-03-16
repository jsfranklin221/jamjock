import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import { toast } from 'sonner';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
    multiTab: true
  },
  global: {
    headers: {
      'x-application-name': 'jamjock'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
});

// Add request interceptor
supabase.handleNetworkError = (error: Error) => {
  console.error('Network error:', error);
  toast.error('Network connection error. Please check your internet connection and try again.');
};

// Add response interceptor
supabase.handleResponseError = (error: Error) => {
  console.error('API error:', error);
  
  if (error.message.includes('JWT')) {
    toast.error('Session expired. Please log in again.');
    supabase.auth.signOut();
    return;
  }
  
  toast.error('An error occurred. Please try again.');
};

// Add health check function
export const checkApiHealth = async () => {
  try {
    const { data, error } = await supabase
      .from('health_check')
      .select('status')
      .single();

    if (error) throw error;
    return data.status === 'healthy';
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
};

// Add connection test function
export const testConnection = async () => {
  try {
    const start = Date.now();
    const { data, error } = await supabase.rpc('ping');
    const latency = Date.now() - start;

    if (error) throw error;

    return {
      connected: true,
      latency,
      serverTime: data
    };
  } catch (error) {
    console.error('Connection test failed:', error);
    return {
      connected: false,
      latency: null,
      serverTime: null
    };
  }
};

export const validateConfig = () => {
  const requiredEnvVars = {
    'Supabase URL': supabaseUrl,
    'Supabase Anon Key': supabaseAnonKey,
    'Site URL': import.meta.env.VITE_SITE_URL
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([name]) => name);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  return true;
};