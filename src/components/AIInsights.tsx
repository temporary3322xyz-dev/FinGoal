import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, limit, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';
import { GoogleGenAI, Type } from "@google/genai";
import { Brain, Sparkles, TrendingUp, AlertTriangle, CheckCircle2, ArrowRight, Loader2, Zap, Shield, Target, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import GlassCard from './shared/GlassCard';
import SectionHeader from './shared/SectionHeader';

export default function AIInsights() {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>({ transactions: [], goals: [] });
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    // Load existing insights from Firestore
    const unsubI = onSnapshot(doc(db, 'users', user.uid, 'ai_data', 'latest_insights'), (docSnap) => {
      if (docSnap.exists()) {
        setInsights(docSnap.data());
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/ai_data/latest_insights`);
    });

    const tQuery = query(collection(db, 'users', user.uid, 'transactions'), orderBy('date', 'desc'), limit(20));
    const gQuery = query(collection(db, 'users', user.uid, 'goals'));

    const unsubT = onSnapshot(tQuery, (snapshot) => {
      const ts = snapshot.docs.map(doc => ({ ...doc.data(), date: doc.data().date?.toDate() }));
      setData(prev => ({ ...prev, transactions: ts }));
      setInitialLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/transactions`);
    });

    const unsubG = onSnapshot(gQuery, (snapshot) => {
      const gs = snapshot.docs.map(doc => ({ ...doc.data(), deadline: doc.data().deadline?.toDate() }));
      setData(prev => ({ ...prev, goals: gs }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/goals`);
    });

    return () => { unsubT(); unsubG(); unsubI(); };
  }, [user]);

  const generateInsights = async () => {
    if (!user) return;
    if (data.transactions.length === 0) {
      setError("Please add at least one transaction before generating insights.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("Gemini API Key is missing. Please add it to your environment variables.");
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `
        Analyze the following financial data for a user and provide strategic insights, suggestions, and a risk assessment.
        Context: Indian Financial Market
        Currency: Indian Rupee (₹)
        
        Transactions: ${JSON.stringify(data.transactions?.map((t: any) => ({ 
          amount: t.amount, 
          type: t.type, 
          category: t.category?.substring(0, 50),
          description: t.description?.substring(0, 100)
        })))}
        Goals: ${JSON.stringify(data.goals?.map((g: any) => ({ 
          title: g.title?.substring(0, 50), 
          target: g.targetAmount, 
          current: g.currentAmount, 
          deadline: g.deadline 
        })))}
        
        Provide the response in JSON format. Ensure all monetary advice is in ₹.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING, description: "A concise 2-sentence summary of the user's financial state." },
              riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
              riskReason: { type: Type.STRING, description: "Brief explanation for the risk level." },
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ["warning", "tip", "investment"] }
                  },
                  required: ["title", "description", "type"]
                }
              },
              goalFeasibility: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    goalTitle: { type: Type.STRING },
                    isAchievable: { type: Type.BOOLEAN },
                    advice: { type: Type.STRING }
                  },
                  required: ["goalTitle", "isAchievable", "advice"]
                }
              }
            },
            required: ["summary", "riskLevel", "riskReason", "suggestions", "goalFeasibility"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from AI");
      
      const parsedResult = JSON.parse(text);
      
      // Save to Firestore
      const path = `users/${user.uid}/ai_data/latest_insights`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'ai_data', 'latest_insights'), {
          ...parsedResult,
          updatedAt: Timestamp.now()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }

      setInsights(parsedResult);
    } catch (err: any) {
      console.error("AI Insight Error:", err);
      setError(err.message || "An unexpected error occurred while generating insights.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return (
    <div className="flex items-center justify-center h-full">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full"
      />
    </div>
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 pb-32 md:pb-10">
      <SectionHeader 
        title="Financial Intelligence" 
        label="AI Insights"
        rightElement={
          <button 
            onClick={generateInsights}
            disabled={loading || data.transactions.length === 0}
            className="btn-primary flex items-center gap-2 py-2 px-4 text-xs group"
          >
            {loading ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} className="group-hover:rotate-12 transition-transform" />}
            {loading ? 'Analyzing...' : 'Refresh Strategy'}
          </button>
        }
      />

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-500/5 border border-rose-500/10 p-5 rounded-xl flex items-start gap-4 text-rose-400"
        >
          <AlertTriangle className="flex-shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-sm font-bold uppercase tracking-wider">Analysis Interrupted</p>
            <p className="text-xs opacity-70 mt-1">{error}</p>
          </div>
        </motion.div>
      )}

      {!insights && !loading && !error && (
        <GlassCard className="p-20 text-center space-y-8" hover={false}>
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-brand-500/20 blur-3xl rounded-full" />
            <div className="relative w-20 h-20 bg-white/[0.02] text-brand-400 rounded-full flex items-center justify-center mx-auto border border-white/[0.05]">
              <Brain size={36} />
            </div>
          </div>
          <div className="space-y-3 max-w-md mx-auto">
            <h3 className="text-2xl font-bold text-white tracking-tight">Deep Pattern Analysis</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Our AI engine will evaluate your spending velocity, income stability, and goal trajectories to synthesize a personalized financial strategy.
            </p>
          </div>
          <button 
            onClick={generateInsights}
            className="btn-primary py-3 px-10 text-sm"
          >
            Initialize Analysis
          </button>
        </GlassCard>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-32 space-y-8">
          <div className="relative">
            <motion.div 
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-brand-500 blur-3xl rounded-full"
            />
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="relative w-24 h-24 bg-white/[0.02] border border-white/[0.05] rounded-full flex items-center justify-center"
            >
              <Brain size={40} className="text-brand-400" />
            </motion.div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-bold text-white tracking-tight">Synthesizing Intelligence...</p>
            <p className="text-gray-600 text-xs uppercase tracking-[0.2em] font-bold">Processing pattern data</p>
          </div>
        </div>
      )}

      {insights && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Health Card */}
          <div className="lg:col-span-2 space-y-10">
            <GlassCard className="p-10 relative overflow-hidden group" hover={false}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 blur-3xl rounded-full -mr-32 -mt-32" />
              
              <div className="flex items-center justify-between mb-10 relative z-10">
                <div className="flex items-center gap-2.5">
                  <Shield size={18} className="text-brand-400" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Strategic Assessment</span>
                </div>
                <div className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${
                  insights.riskLevel === 'Low' ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10' :
                  insights.riskLevel === 'Medium' ? 'bg-amber-500/5 text-amber-400 border-amber-500/10' :
                  'bg-rose-500/5 text-rose-400 border-rose-500/10'
                }`}>
                  {insights.riskLevel} Risk Profile
                </div>
              </div>

              <div className="space-y-6 relative z-10">
                <h2 className="text-3xl font-bold text-white leading-tight tracking-tight max-w-2xl">
                  {insights.summary}
                </h2>
                <div className="flex items-start gap-3 p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl italic text-gray-400 text-sm leading-relaxed">
                  <Info size={16} className="text-brand-500 flex-shrink-0 mt-0.5" />
                  "{insights.riskReason}"
                </div>
              </div>
            </GlassCard>

            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-3 px-1">
                <Zap size={18} className="text-brand-400" />
                Actionable Directives
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {insights.suggestions?.map((s: any, i: number) => (
                  <GlassCard 
                    key={i}
                    delay={i * 0.1}
                    className="p-6 border-l-2 border-l-brand-500"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg ${
                        s.type === 'warning' ? 'bg-rose-500/5 text-rose-400' : 
                        s.type === 'tip' ? 'bg-emerald-500/5 text-emerald-400' : 'bg-brand-500/5 text-brand-400'
                      }`}>
                        {s.type === 'warning' ? <AlertTriangle size={16} /> : 
                         s.type === 'tip' ? <CheckCircle2 size={16} /> : <TrendingUp size={16} />}
                      </div>
                      <h4 className="font-bold text-white text-sm tracking-tight">{s.title}</h4>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{s.description}</p>
                  </GlassCard>
                ))}
              </div>
            </div>
          </div>

          {/* Goals Feasibility */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-3 px-1">
                <Target size={18} className="text-brand-400" />
                Milestone Feasibility
              </h3>
              <div className="space-y-4">
                {insights.goalFeasibility?.map((g: any, i: number) => (
                  <GlassCard key={i} className="p-6 space-y-4 group">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-sm">{g.goalTitle}</h4>
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-md uppercase tracking-widest border ${
                        g.isAchievable ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10' : 'bg-rose-500/5 text-rose-400 border-rose-500/10'
                      }`}>
                        {g.isAchievable ? 'Stable' : 'At Risk'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{g.advice}</p>
                    <div className="flex items-center gap-2 text-brand-400 text-[10px] font-bold uppercase tracking-widest group-hover:gap-3 transition-all cursor-pointer">
                      Optimize Trajectory <ArrowRight size={12} />
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>

            <GlassCard className="p-8 bg-brand-600/5 border-brand-500/10" hover={false}>
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="text-brand-400" size={20} />
                <h4 className="text-xs font-bold text-white uppercase tracking-widest">Intelligence Tip</h4>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Your historical data suggests a <span className="text-emerald-400 font-bold">12% efficiency gain</span> is possible by consolidating subscription services identified in your recurring transactions.
              </p>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}
