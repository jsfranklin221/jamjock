import React from 'react';
import { Link } from 'react-router-dom';
import { Mic, Sparkles, Share2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-16">
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 mb-8">
          <Mic className="w-4 h-4 mr-2" />
          Sing Your Heart Out
        </div>
        <h1 className="text-6xl font-bold tracking-tight mb-6">
          Create Your Custom
          <br />
          <span className="text-blue-600">Jock Jams</span> Cover
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Record your voice and instantly generate your own version of iconic
          stadium anthems powered by advanced AI.
        </p>
        <Link
          to="/create"
          className="inline-flex items-center px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Start Creating
        </Link>
      </div>

      <div className="mt-24">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mic className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Record Your Voice</h3>
            <p className="text-gray-600">
              Sing a short sample to capture your unique voice
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI Magic</h3>
            <p className="text-gray-600">
              Our AI transforms your voice into a full Jock Jams cover
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Share2 className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Share & Enjoy</h3>
            <p className="text-gray-600">
              Preview, purchase, and share your creation with friends
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}