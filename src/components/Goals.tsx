import { useState, useEffect, FormEvent } from 'react';
import { collection, addDoc, query, onSnapshot, deleteDoc, doc, Timestamp, updateDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';
import { Target, Plus, Trash2, Calendar, TrendingUp, ArrowUpRight, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import GlassCard from './shared/GlassCard';
import DataValue from './shared/DataValue';
import SectionHeader from './shared/SectionHeader';

export default function Goals() {
  const [goals, setGoals] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'users', user.uid, 'goals'));
    const unsub = onSnapshot(q, (snapshot) => {
      setGoals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/goals`);
    });

    return unsub;
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !title || !targetAmount || !deadline) return;

    const path = `users/${user.uid}/goals`;
    try {
      await addDoc(collection(db, 'users', user.uid, 'goals'), {
        uid: user.uid,
        title,
        targetAmount: parseFloat(targetAmount),
        currentAmount: 0,
        deadline: Timestamp.fromDate(new Date(deadline)),
        createdAt: Timestamp.now()
      });
      setTitle('');
      setTargetAmount('');
      setDeadline('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/goals/${id}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'goals', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleUpdateProgress = async (id: string, current: number, add: number) => {
    if (!user) return;
    const path = `users/${user.uid}/goals/${id}`;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'goals', id), {
        currentAmount: current + add
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

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
      <SectionHeader 
        title="Financial Milestones" 
        label="Savings Goals"
        rightElement={
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/[0.05] rounded-lg text-[10px] font-mono text-gray-500 uppercase tracking-wider">
            <Target size={12} />
            {goals.length} Active
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Form */}
        <div className="lg:col-span-1">
          <GlassCard className="p-8 sticky top-10" hover={false}>
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Plus size={18} className="text-brand-400" />
              New Objective
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Goal Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input-field"
                    placeholder="e.g. Emergency Fund"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Target Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono">₹</span>
                    <input
                      type="number"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      className="input-field pl-10 font-mono"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Target Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="input-field pl-12 cursor-pointer"
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Initialize Goal
              </button>
            </form>
          </GlassCard>
        </div>

        {/* List */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence>
            {goals?.map((goal, idx) => {
              const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
              const monthsLeft = Math.max(1, Math.ceil((new Date(goal.deadline.seconds * 1000).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)));
              const monthlyRequired = (goal.targetAmount - goal.currentAmount) / monthsLeft;

              return (
                <GlassCard
                  key={goal.id}
                  delay={idx * 0.05}
                  className="p-8 group"
                >
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-5">
                      <div className="p-4 bg-brand-500/5 text-brand-400 rounded-2xl border border-brand-500/10">
                        <Target size={24} />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-white tracking-tight">{goal.title}</h4>
                        <div className="flex items-center gap-2 mt-1.5 text-gray-500">
                          <Clock size={12} className="text-brand-500" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">
                            Due {new Date(goal.deadline.seconds * 1000).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="p-2.5 text-gray-700 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="space-y-8">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Current Progress</p>
                        <DataValue 
                          value={goal.currentAmount} 
                          currency 
                          className="text-3xl font-bold"
                        />
                      </div>
                      <div className="text-right space-y-1.5">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Objective</p>
                        <DataValue 
                          value={goal.targetAmount} 
                          currency 
                          className="text-xl font-bold text-gray-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="w-full bg-white/[0.02] rounded-full h-2.5 overflow-hidden border border-white/[0.05]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(progress, 100)}%` }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                          className="bg-gradient-to-r from-brand-600 to-brand-400 h-full rounded-full shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-brand-400">{progress.toFixed(1)}% Secured</span>
                        <span className="text-gray-600">
                          <DataValue value={Math.max(0, goal.targetAmount - goal.currentAmount)} currency className="text-gray-500" /> Remaining
                        </span>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/[0.03] flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="px-4 py-2 bg-white/[0.02] rounded-xl border border-white/[0.05]">
                          <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-0.5">Monthly Velocity</p>
                          <DataValue value={Math.max(0, monthlyRequired)} currency className="text-sm font-bold text-white" />
                        </div>
                        <div className="text-brand-500/50">
                          <TrendingUp size={18} />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateProgress(goal.id, goal.currentAmount, 5000)}
                          className="btn-secondary py-2 px-4 text-[10px] font-bold uppercase tracking-wider"
                        >
                          Add ₹5k
                        </button>
                        <button
                          onClick={() => {
                            const val = prompt('Enter amount to contribute:');
                            if (val) handleUpdateProgress(goal.id, goal.currentAmount, parseFloat(val));
                          }}
                          className="p-2 bg-white/[0.03] text-gray-500 rounded-lg hover:bg-white/[0.05] hover:text-white transition-all border border-white/[0.05]"
                        >
                          <ArrowUpRight size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </AnimatePresence>
          {goals.length === 0 && !loading && (
            <GlassCard className="p-20 text-center space-y-6" hover={false}>
              <div className="w-20 h-20 bg-white/[0.02] text-gray-800 rounded-full flex items-center justify-center mx-auto">
                <Target size={36} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white tracking-tight">No active objectives</h3>
                <p className="text-gray-600 text-sm max-w-xs mx-auto leading-relaxed">
                  Define your first financial milestone to start tracking your progress with precision.
                </p>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
