import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, Target, Sparkles, LogOut, User, Cpu } from 'lucide-react';
import { auth, logout } from '../lib/firebase';
import { motion } from 'motion/react';

export default function Navbar() {
  const location = useLocation();
  const user = auth.currentUser;

  const navItems = [
    { path: '/', label: 'Overview', icon: LayoutDashboard },
    { path: '/transactions', label: 'Activity', icon: Receipt },
    { path: '/goals', label: 'Savings', icon: Target },
    { path: '/insights', label: 'Intelligence', icon: Sparkles },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A]/80 backdrop-blur-2xl border-t border-white/[0.05] px-4 py-3 md:relative md:border-t-0 md:border-r md:h-screen md:w-72 md:flex-col md:py-10 z-50">
      <div className="hidden md:flex items-center gap-3 px-8 mb-16">
        <div className="relative group">
          <div className="absolute -inset-1 bg-brand-500/20 blur opacity-0 group-hover:opacity-100 transition duration-500 rounded-xl" />
          <div className="relative w-10 h-10 bg-[#0A0A0A] border border-white/[0.1] rounded-xl flex items-center justify-center text-brand-400 shadow-2xl">
            <Cpu size={22} />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold text-white tracking-tight leading-none">FinGoal</span>
          <span className="text-[10px] font-mono text-brand-500 uppercase tracking-widest mt-1">AI Engine</span>
        </div>
      </div>

      <div className="flex justify-around md:flex-col md:gap-1.5 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative"
            >
              <div
                className={`flex flex-col md:flex-row items-center gap-1 md:gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'text-white bg-white/[0.03] border border-white/[0.05]' 
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.01]'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-brand-400' : 'transition-colors'} />
                <span className={`text-[10px] md:text-sm font-medium ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
                
                {isActive && (
                  <motion.div 
                    layoutId="nav-active"
                    className="absolute left-0 w-0.5 h-5 bg-brand-500 rounded-r-full hidden md:block"
                  />
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="hidden md:flex flex-col mt-auto gap-6 px-6">
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 blur-2xl rounded-full -mr-12 -mt-12" />
          
          <div className="flex items-center gap-3 mb-5 relative z-10">
            <div className="w-9 h-9 bg-[#0A0A0A] rounded-lg flex items-center justify-center overflow-hidden border border-white/[0.1]">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              ) : (
                <User size={18} className="text-gray-500" />
              )}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold text-white truncate">{user?.displayName || 'Operator'}</span>
              <span className="text-[10px] font-mono text-gray-600 truncate">{user?.email?.split('@')[0]}</span>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-rose-400 transition-colors bg-white/[0.02] rounded-lg border border-white/[0.05] relative z-10"
          >
            <LogOut size={12} />
            Terminate Session
          </button>
        </div>
      </div>
    </nav>
  );
}
