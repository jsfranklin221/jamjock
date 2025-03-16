import React, { useEffect, useState } from 'react';
import { Loader2, Users, Play, CreditCard, Music, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DailyStats {
  date: string;
  voice_recordings_count: number;
  preview_generations_count: number;
  payment_attempts_count: number;
  payment_success_count: number;
  full_song_generations_count: number;
}

interface Analytics {
  preview_generations_count: number;
  payment_success_count: number;
}

interface PaidSong {
  id: string;
  title: string;
  created_at: string;
  full_song_url: string;
}

export default function Report() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [userCount, setUserCount] = useState<number>(0);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [paidSongs, setPaidSongs] = useState<PaidSong[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get analytics totals
        const { data: analyticsData, error: analyticsError } = await supabase
          .from('analytics')
          .select('preview_generations_count, payment_success_count')
          .order('date', { ascending: false })
          .limit(1)
          .single();

        if (analyticsError) throw analyticsError;

        // Get total user count
        const { count, error: userError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });

        if (userError) throw userError;

        // Get daily stats
        const { data: statsData, error: statsError } = await supabase
          .from('analytics')
          .select('*')
          .order('date', { ascending: false })
          .limit(30);

        if (statsError) throw statsError;

        // Get paid songs
        const { data: songsData, error: songsError } = await supabase
          .from('songs')
          .select('id, title, created_at, full_song_url')
          .eq('paid', true)
          .order('created_at', { ascending: false });

        if (songsError) throw songsError;

        setAnalytics(analyticsData);
        setUserCount(count || 0);
        setDailyStats(statsData || []);
        setPaidSongs(songsData || []);
      } catch (error) {
        console.error('Error fetching report data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load report data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Analytics Report</h1>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {/* Users */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Total Users</h2>
            <Users className="text-blue-600" />
          </div>
          <div className="text-3xl font-bold">{userCount}</div>
          <p className="text-gray-600 mt-2">Registered accounts</p>
        </div>

        {/* Previews */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Previews Generated</h2>
            <Play className="text-green-600" />
          </div>
          <div className="text-3xl font-bold">
            {analytics?.preview_generations_count || 0}
          </div>
          <p className="text-gray-600 mt-2">Total song previews</p>
        </div>

        {/* Payments */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Successful Payments</h2>
            <CreditCard className="text-purple-600" />
          </div>
          <div className="text-3xl font-bold">
            {analytics?.payment_success_count || 0}
          </div>
          <p className="text-gray-600 mt-2">Completed purchases</p>
        </div>
      </div>

      {/* Paid Songs */}
      <div className="bg-white rounded-lg shadow mb-12">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold flex items-center">
            <Music className="w-5 h-5 mr-2 text-blue-600" />
            Paid Songs
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Song</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paidSongs.map((song) => (
                <tr key={song.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{song.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(song.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <a
                      href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/voice_samples/${song.full_song_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Listen
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Stats */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            Daily Statistics
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voice Recordings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Previews</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Attempts</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Successful Payments</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Songs</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dailyStats.map((stat) => (
                <tr key={stat.date}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {new Date(stat.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.voice_recordings_count}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.preview_generations_count}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.payment_attempts_count}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.payment_success_count}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.full_song_generations_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}