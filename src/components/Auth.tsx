import { signInWithGoogle } from '../lib/firebase';
import { Sparkles, ShieldCheck, Zap, BarChart3, Cpu, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import GlassCard from './shared/GlassCard';

export default function Auth() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col lg:flex-row overflow-hidden">
      {/* Left Side - Branding */}
      <div className="lg:flex-1 p-8 lg:p-20 flex flex-col justify-between relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/10 blur-[120px] rounded-full -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-600/5 blur-[120px] rounded-full -ml-64 -mb-64" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-[#0A0A0A] border border-white/[0.1] rounded-2xl flex items-center justify-center text-brand-400 shadow-2xl">
            <Cpu size={28} />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-white tracking-tight leading-none">FinGoal</span>
            <span className="text-[10px] font-mono text-brand-500 uppercase tracking-widest mt-1">AI Financial Engine</span>
          </div>
        </div>

        <div className="relative z-10 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight mb-8">
              Precision <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600">Intelligence</span> for your capital.
            </h1>
            <p className="text-gray-500 text-lg lg:text-xl mb-12 max-w-lg leading-relaxed">
              The next generation of personal finance. Powered by Gemini AI to synthesize patterns, predict outcomes, and optimize your trajectory.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/[0.03] border border-white/[0.05] rounded-xl text-brand-400"><BarChart3 size={20} /></div>
              <div>
                <h4 className="font-bold text-white text-sm uppercase tracking-wider">Pattern Recognition</h4>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">Advanced visualization of complex spending architectures.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/[0.03] border border-white/[0.05] rounded-xl text-brand-400"><Zap size={20} /></div>
              <div>
                <h4 className="font-bold text-white text-sm uppercase tracking-wider">Strategic Synthesis</h4>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">AI-driven directives to accelerate your financial milestones.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-gray-700 text-[10px] font-mono uppercase tracking-[0.2em]">
          v2.4.0 // SECURE PROTOCOL ACTIVE // © 2026 FINGOAL AI
        </div>
      </div>

      {/* Right Side - Login */}
      <div className="lg:w-[540px] p-8 lg:p-20 flex flex-col justify-center items-center relative z-20">
        <GlassCard className="w-full max-w-md p-10 space-y-10" hover={false}>
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-white tracking-tight">Access Terminal</h2>
            <p className="text-gray-500 text-sm">Authenticate to initialize your financial dashboard</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => signInWithGoogle()}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-black rounded-xl font-bold text-sm hover:bg-gray-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] group"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
              Continue with Google
              <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.05]"></div></div>
            <div className="relative flex justify-center text-[10px] font-mono uppercase tracking-widest"><span className="bg-[#0A0A0A] px-4 text-gray-600">Secure Handshake</span></div>
          </div>

          <div className="flex items-start gap-4 p-5 bg-white/[0.02] border border-white/[0.05] rounded-xl">
            <ShieldCheck size={20} className="text-brand-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-white uppercase tracking-wider">Encryption Standard</p>
              <p className="text-[10px] text-gray-600 leading-relaxed">We utilize Firebase enterprise-grade authentication protocols to ensure your financial data remains isolated and private.</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
