import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDocFromServer } from 'firebase/firestore';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Goals from './components/Goals';
import AIInsights from './components/AIInsights';
import Auth from './components/Auth';
import Chatbot from './components/Chatbot';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    };
    testConnection();

    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="relative">
          <div className="absolute inset-0 bg-brand-500/20 blur-3xl rounded-full animate-pulse" />
          <Loader2 className="animate-spin text-brand-500 relative z-10" size={48} />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col md:flex-row">
        <Navbar />
        <main className="flex-1 overflow-y-auto h-screen custom-scrollbar">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/insights" element={<AIInsights />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Chatbot />
      </div>
    </Router>
  );
}
