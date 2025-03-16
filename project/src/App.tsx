import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Create from './pages/Create';
import Share from './pages/Share';
import ThankYou from './pages/ThankYou';
import Song from './pages/Song';
import Library from './pages/Library';
import Report from './pages/Report';
import CheckSongs from './pages/CheckSongs';
import { useAuthStore } from './store';
import { onAuthStateChange } from './lib/auth';

function App() {
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange((user) => {
      setUser(user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser]);

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Navbar />
        <Routes>
          {/* Redirect authenticated users from home to library */}
          <Route path="/" element={user ? <Navigate to="/library" replace /> : <Home />} />
          <Route path="/create" element={<Create />} />
          <Route path="/share/:songId" element={<Share />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/song/:songId" element={<Song />} />
          <Route path="/library" element={<Library />} />
          <Route path="/report" element={<Report />} />
          <Route path="/check-songs" element={<CheckSongs />} />
        </Routes>
        <Toaster position="top-center" />
      </div>
    </Router>
  );
}

export default App;