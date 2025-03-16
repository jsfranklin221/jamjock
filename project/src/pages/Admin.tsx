import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { BarChart3, DollarSign, Zap } from 'lucide-react';

export default function Admin() {
  const navigate = useNavigate();
  const { user, adminStats } = useStore((state) => ({
    user: state.user,
    adminStats: state.adminStats,
  }));

  useEffect(() => {
    if (user && !user.role.includes('admin')) {
      navigate('/');
    }
  }, [user, navigate]);

  if (!adminStats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Daily Generations */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Daily Generations</h2>
            <Zap className="text-yellow-500" />
          </div>
          <div className="text-3xl font-bold">
            {adminStats.dailyGenerations} / {adminStats.dailyLimit}
          </div>
          <p className="text-gray-600 mt-2">Songs generated today</p>
        </div>

        {/* Total Earnings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Total Earnings</h2>
            <DollarSign className="text-green-500" />
          </div>
          <div className="text-3xl font-bold">
            ${adminStats.totalEarnings.toFixed(2)}
          </div>
          <p className="text-gray-600 mt-2">Revenue from song purchases</p>
        </div>

        {/* API Costs */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">API Costs</h2>
            <BarChart3 className="text-red-500" />
          </div>
          <div className="text-3xl font-bold">${adminStats.apiCosts.toFixed(2)}</div>
          <p className="text-gray-600 mt-2">Total API usage costs</p>
        </div>
      </div>

      {/* Emergency Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Emergency Controls</h2>
        <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors">
          Pause All Generations
        </button>
      </div>
    </div>
  );
}