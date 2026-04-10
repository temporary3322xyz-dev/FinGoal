import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, doc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Wallet, Target, AlertCircle, ArrowUpRight, Sparkles, Plus, ArrowRight, 
  Coins, Landmark, BarChart3, PieChart as PieChartIcon, ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const tQuery = query(
      collection(db, 'users', user.uid, 'transactions'),
      orderBy('date', 'desc'),
      limit(50)
    );

    const gQuery = query(
      collection(db, 'users', user.uid, 'goals')
    );

    const unsubT = onSnapshot(tQuery, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/transactions`);
    });

    const unsubG = onSnapshot(gQuery, (snapshot) => {
      setGoals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/goals`);
    });

    const unsubI = onSnapshot(doc(db, 'users', user.uid, 'ai_data', 'latest_insights'), (docSnap) => {
      if (docSnap.exists()) {
        setInsights(docSnap.data());
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/ai_data/latest_insights`);
    });

    return () => {
      unsubT();
      unsubG();
      unsubI();
    };
  }, [user]);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalIncome - totalExpenses;
  const savings = Math.max(0, totalIncome - totalExpenses);
  const savingsRatio = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

  const investmentAllocations = [
    { name: 'Nifty 50 Index SIP', percentage: 45, amount: savings * 0.45, risk: 'Medium', return: '12-14%', icon: Landmark, color: 'text-brand-400', bg: 'bg-brand-500/5' },
    { name: 'ELSS (Tax Saving)', percentage: 25, amount: savings * 0.25, risk: 'High', return: '14-16%', icon: BarChart3, color: 'text-emerald-400', bg: 'bg-emerald-500/5' },
    { name: 'Sovereign Gold Bonds', percentage: 15, amount: savings * 0.15, risk: 'Low', return: '8-9%', icon: Coins, color: 'text-amber-400', bg: 'bg-amber-500/5' },
    { name: 'Liquid/Emergency Fund', percentage: 15, amount: savings * 0.15, risk: 'None', return: '4-6%', icon: ShieldCheck, color: 'text-gray-400', bg: 'bg-gray-500/5' },
  ];

  const chartData = transactions.slice(0, 10).reverse().map(t => ({
    name: new Date(t.date.seconds * 1000).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
    amount: t.amount,
    type: t.type
  }));

  if (loading) return (
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
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight font-display">Financial Overview</h1>
          <p className="text-gray-500 mt-1">Welcome back, <span className="text-brand-400 font-medium">{user?.displayName?.split(' ')[0]}</span></p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/transactions')}
            className="btn-secondary flex items-center gap-2"
          >
            <Plus size={18} />
            Add Transaction
          </button>
        </div>
      </header>

      {/* Main Stats Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass-card p-8 relative overflow-hidden group"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Total Balance</p>
                <h2 className="text-5xl font-bold text-white font-mono tracking-tight">
                  ₹{balance.toLocaleString('en-IN')}
                </h2>
              </div>
              <div className="w-16 h-16 bg-brand-500/10 rounded-3xl flex items-center justify-center text-brand-400 border border-brand-500/20">
                <Wallet size={32} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/[0.05]">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-emerald-400">
                  <TrendingUp size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Monthly Income</span>
                </div>
                <p className="text-2xl font-bold text-white font-mono">₹{totalIncome.toLocaleString('en-IN')}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-rose-400">
                  <TrendingDown size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Monthly Expenses</span>
                </div>
                <p className="text-2xl font-bold text-white font-mono">₹{totalExpenses.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
          
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl group-hover:bg-brand-500/20 transition-colors duration-500" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl" />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-8 flex flex-col justify-between bg-gradient-to-br from-[#141414] to-[#0F0F0F]"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Savings Ratio</h3>
              <Sparkles className="text-brand-400" size={20} />
            </div>
            <div className="relative h-32 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-bold text-white font-mono">{savingsRatio.toFixed(0)}%</span>
              </div>
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-white/[0.05]"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={364.4}
                  strokeDashoffset={364.4 - (364.4 * Math.min(savingsRatio, 100)) / 100}
                  className="text-brand-500 transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
          <p className="text-sm text-gray-500 text-center leading-relaxed">
            You've saved <span className="text-emerald-400 font-bold font-mono">₹{savings.toLocaleString('en-IN')}</span> this month. Keep it up!
          </p>
        </motion.div>
      </div>

      {/* Smart Investment Suggestions */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-500/10 rounded-lg text-brand-400">
              <PieChartIcon size={20} />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">Smart Investment Allocation</h3>
          </div>
          <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">Based on ₹{savings.toLocaleString('en-IN')} savings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {investmentAllocations.map((inv, i) => {
            const Icon = inv.icon;
            return (
              <motion.div
                key={inv.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-6 space-y-4 group relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-20 h-20 ${inv.bg} blur-2xl rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500`} />
                
                <div className="flex items-center justify-between relative z-10">
                  <div className={`p-3 rounded-xl ${inv.bg} ${inv.color}`}>
                    <Icon size={20} />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-widest border ${
                    inv.risk === 'Low' ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10' :
                    inv.risk === 'Medium' ? 'bg-amber-500/5 text-amber-400 border-amber-500/10' :
                    'bg-white/5 text-gray-400 border-white/10'
                  }`}>
                    {inv.risk} Risk
                  </span>
                </div>

                <div className="space-y-1 relative z-10">
                  <h4 className="text-sm font-bold text-white">{inv.name}</h4>
                  <p className="text-2xl font-bold text-white font-mono">₹{inv.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                </div>

                <div className="space-y-2 relative z-10">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-gray-500">Allocation</span>
                    <span className={inv.color}>{inv.percentage}%</span>
                  </div>
                  <div className="w-full bg-white/[0.05] rounded-full h-1.5 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${inv.percentage}%` }}
                      transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                      className={`h-full rounded-full ${inv.color.replace('text-', 'bg-')}`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider pt-1">
                    <span className="text-gray-500">Exp. Return</span>
                    <span className="text-white">{inv.return}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* AI Insights Summary */}
      {insights && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-8 bg-brand-600/10 border-brand-500/20 relative overflow-hidden"
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-brand-500/20 rounded-lg text-brand-400">
                  <Sparkles size={20} />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-brand-400">AI Financial Intelligence</span>
              </div>
              <p className="text-xl font-medium text-white leading-relaxed italic">"{insights.summary}"</p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border ${
                insights.riskLevel === 'Low' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                insights.riskLevel === 'Medium' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}>
                <AlertCircle size={16} />
                {insights.riskLevel} Risk
              </div>
              <button 
                onClick={() => navigate('/insights')}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-white"
              >
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white">Cash Flow</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-brand-500" />
                <span className="text-xs text-gray-500">Amount</span>
              </div>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6b7280' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6b7280' }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1A1A1A', 
                    borderRadius: '16px', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorAmount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white">Active Goals</h3>
            <button 
              onClick={() => navigate('/goals')}
              className="text-brand-400 text-sm font-bold hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-6 flex-1">
            {goals.length > 0 ? goals.slice(0, 4).map((goal) => {
              const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
              return (
                <div key={goal.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{goal.title}</span>
                    <span className="text-xs font-medium text-gray-500">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-white/[0.05] rounded-full h-2 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(progress, 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="bg-brand-500 h-full rounded-full"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] uppercase tracking-wider font-bold text-gray-600">
                    <span>₹{goal.currentAmount.toLocaleString('en-IN')}</span>
                    <span>₹{goal.targetAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              );
            }) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="p-4 bg-white/[0.03] rounded-full text-gray-600">
                  <Target size={32} />
                </div>
                <p className="text-sm text-gray-500">No active goals yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card p-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold text-white">Recent Activity</h3>
          <button 
            onClick={() => navigate('/transactions')}
            className="btn-secondary py-2 px-4 text-xs"
          >
            Full History
          </button>
        </div>
        <div className="space-y-4">
          {transactions.slice(0, 5).map((t) => (
            <div key={t.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] transition-colors group">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${
                  t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {t.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{t.description || t.category}</p>
                  <p className="text-xs text-gray-500">{new Date(t.date.seconds * 1000).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${
                  t.type === 'income' ? 'text-emerald-400' : 'text-white'
                }`}>
                  {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-600">{t.category}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
