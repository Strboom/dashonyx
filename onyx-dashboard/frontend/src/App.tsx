import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from './api';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Server from './pages/Server';
import StarBackground from './components/StarBackground';

interface User {
  id: string;
  username: string;
  avatar: string | null;
  global_name?: string;
}

function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    api.me()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050714' }}>
        <StarBackground />
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-indigo-300 text-sm">Loading Onyx Dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen relative" style={{ background: '#050714' }}>
        <StarBackground />
        <div className="relative z-10 min-h-screen">
          <Routes>
            <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
            <Route path="/dashboard" element={user ? <Dashboard user={user} onLogout={() => setUser(null)} /> : <Navigate to="/" replace />} />
            <Route path="/server/:guildId" element={user ? <Server user={user} /> : <Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
