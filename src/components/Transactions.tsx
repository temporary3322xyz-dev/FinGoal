import { useState, useEffect, FormEvent } from 'react';
import { collection, addDoc, query, onSnapshot, orderBy, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';
import { Plus, Trash2, TrendingUp, TrendingDown, Search, Receipt, Calendar, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import GlassCard from './shared/GlassCard';
import DataValue from './shared/DataValue';
import SectionHeader from './shared/SectionHeader';

export default function Transactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'transactions'),
      orderBy('date', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/transactions`);
    });

    return unsub;
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !amount || !category) return;

    const path = `users/${user.uid}/transactions`;
    try {
      await addDoc(collection(db, 'users', user.uid, 'transactions'), {
        uid: user.uid,
        amount: parseFloat(amount),
        type,
        category,
        description,
        date: Timestamp.now()
      });
      setAmount('');
      setDescription('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/transactions/${id}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'transactions', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesFilter = filter === 'all' || t.type === filter;
    const matchesSearch = (t.description || '').toLowerCase().includes(search.toLowerCase()) || 
                          (t.category || '').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const categories = type === 'expense' 
    ? ['Food', 'Transport', 'Rent', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Other']
    : ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];

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
        title="Activity Ledger" 
        label="Transactions"
        rightElement={
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/[0.05] rounded-lg text-[10px] font-mono text-gray-500 uppercase tracking-wider">
            <Receipt size={12} />
            {transactions.length} Records
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Form Section */}
        <div className="lg:col-span-1">
          <GlassCard className="p-8 sticky top-10" hover={false}>
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Plus size={18} className="text-brand-400" />
              New Entry
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex p-1 bg-white/[0.03] rounded-xl border border-white/[0.05]">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
                    type === 'expense' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'text-gray-500 hover:text-white'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
                    type === 'income' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-500 hover:text-white'
                  }`}
                >
                  Income
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono">₹</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="input-field pl-10 font-mono text-lg"
                      placeholder="0.00"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input-field appearance-none cursor-pointer"
                    required
                  >
                    {categories.map(c => <option key={c} value={c} className="bg-[#0A0A0A]">{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input-field"
                    placeholder="Reference note..."
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all shadow-xl active:scale-[0.98] ${
                  type === 'expense' ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                }`}
              >
                Post {type === 'expense' ? 'Expense' : 'Income'}
              </button>
            </form>
          </GlassCard>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
              <input 
                type="text"
                placeholder="Search ledger..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-12 text-sm"
              />
            </div>
            <div className="flex gap-1.5 p-1 bg-white/[0.02] border border-white/[0.05] rounded-xl">
              {['all', 'income', 'expense'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                    filter === f 
                      ? 'bg-white/[0.05] text-white shadow-sm' 
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <GlassCard className="overflow-hidden" hover={false}>
            <div className="divide-y divide-white/[0.03]">
              <AnimatePresence initial={false}>
                {filteredTransactions.map((t, idx) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: idx * 0.03 }}
                    className="p-5 flex items-center justify-between hover:bg-white/[0.01] transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl border ${
                        t.type === 'income' 
                          ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10' 
                          : 'bg-rose-500/5 text-rose-400 border-rose-500/10'
                      }`}>
                        {t.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">{t.description || t.category}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                            <Tag size={10} className="text-brand-500" />
                            {t.category}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-gray-600 font-mono">
                            <Calendar size={10} />
                            {new Date(t.date.seconds * 1000).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <DataValue 
                          value={t.amount} 
                          currency 
                          prefix={t.type === 'income' ? '+' : '-'}
                          color={t.type === 'income' ? 'success' : 'default'}
                          className="text-lg font-bold"
                        />
                      </div>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-2.5 text-gray-700 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {filteredTransactions.length === 0 && !loading && (
                <div className="py-24 text-center space-y-4">
                  <div className="w-20 h-20 bg-white/[0.02] rounded-full flex items-center justify-center mx-auto text-gray-800">
                    <Receipt size={32} />
                  </div>
                  <p className="text-gray-600 text-sm font-medium">No records found matching your criteria.</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
