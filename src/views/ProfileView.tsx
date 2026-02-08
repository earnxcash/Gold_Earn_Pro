import React, { useEffect } from 'react';
import { useUser } from '../types';
import { User, Copy, History, TrendingUp, TrendingDown, LogOut, Clock, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const ProfileView: React.FC = () => {
  const { state, logout, refreshUser } = useUser();

  // Real-time data fetch when Profile View mounts
  useEffect(() => {
    refreshUser();
  }, []);

  const copyReferral = () => {
    navigator.clipboard.writeText(state.referralCode);
    toast.success('Referral code copied!');
  };

  return (
    <div className="p-0">
      {/* Profile Header */}
      <div className="bg-green-900 p-8 pb-12 rounded-b-[2rem] border-b border-green-800 text-center relative overflow-hidden">
        {/* Background Gradients for Flag Effect */}
        <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-gradient-to-b from-green-800 to-green-950"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-600 rounded-full blur-[80px] opacity-20"></div>
        
        {/* Logout Button */}
        <button 
            onClick={logout}
            className="absolute top-4 right-4 p-2 bg-green-800/50 rounded-full hover:bg-red-500/20 hover:text-red-400 text-green-200 transition-colors z-20"
        >
            <LogOut className="w-5 h-5" />
        </button>

        <div className="relative z-10">
            <div className="w-20 h-20 bg-green-800 rounded-full mx-auto mb-4 border-4 border-green-700 flex items-center justify-center relative">
                 {state.user?.photoURL ? (
                     <img src={state.user.photoURL} className="w-full h-full rounded-full object-cover" />
                 ) : (
                    <User className="w-10 h-10 text-green-400" />
                 )}
            </div>
            <h2 className="text-2xl font-bold text-white">{state.user?.name || 'Guest User'}</h2>
            <p className="text-green-400 text-sm">{state.user?.phone}</p>
            <div className="inline-block bg-yellow-500/10 px-3 py-0.5 rounded-full mt-2 border border-yellow-500/20">
                <p className="text-yellow-500 text-xs font-bold uppercase tracking-wider">Premium Member</p>
            </div>

            <div className="mt-6 flex justify-center space-x-8">
                <div>
                    <p className="text-2xl font-bold text-white">{state.totalEarned.toLocaleString()}</p>
                    <p className="text-xs text-green-400 uppercase tracking-wider">Lifetime</p>
                </div>
                <div>
                    <p className="text-2xl font-bold text-red-400">{state.transactions.filter(t => t.type === 'debit').length}</p>
                    <p className="text-xs text-green-400 uppercase tracking-wider">Payouts</p>
                </div>
            </div>
        </div>
      </div>

      {/* Referral Section */}
      <div className="px-6 -mt-6 relative z-20">
        <div className="bg-green-900 border border-green-700 rounded-xl p-4 shadow-xl">
            <h3 className="text-sm font-bold text-green-200 mb-3">Your Referral Code</h3>
            <div className="flex items-center space-x-2">
                <div className="flex-1 bg-green-950 rounded-lg p-3 text-center font-mono font-bold text-yellow-400 tracking-widest border border-green-800 border-dashed">
                    {state.referralCode}
                </div>
                <button 
                    onClick={copyReferral}
                    className="bg-green-700 hover:bg-green-600 p-3 rounded-lg text-white transition-colors"
                >
                    <Copy className="w-5 h-5" />
                </button>
            </div>
            <p className="text-xs text-green-400 mt-2 text-center">Share & earn 500 points per friend!</p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
            <span className="flex items-center"><History className="w-5 h-5 mr-2 text-green-400" /> Recent History</span>
            <span className="text-xs text-green-500 bg-green-900 px-2 py-1 rounded">Last 20</span>
        </h3>
        
        <div className="space-y-3">
            {state.transactions.length === 0 ? (
                <div className="text-center py-8 text-green-600 border border-green-800/30 rounded-xl border-dashed">
                    No transactions yet. Start earning!
                </div>
            ) : (
                state.transactions.map((t) => (
                    <div key={t.id} className="bg-green-900/30 border border-green-800/50 p-4 rounded-xl flex items-center justify-between">
                        
                        {/* Left: Icon & Details */}
                        <div className="flex items-center space-x-3">
                            <div className={`p-2.5 rounded-full ${t.type === 'credit' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                {t.type === 'credit' ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
                            </div>
                            <div>
                                <p className="font-bold text-green-100 text-sm">{t.description}</p>
                                <p className="text-[10px] text-green-500 mt-0.5">
                                    {new Date(t.date).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Right: Amount & Status */}
                        <div className="text-right flex flex-col items-end">
                            <span className={`font-mono font-bold text-sm ${t.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                                {t.type === 'credit' ? '+' : '-'}{t.amount}
                            </span>
                            
                            {/* Status Badge */}
                            <div className={`flex items-center space-x-1 mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border ${
                                t.status === 'completed' 
                                    ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                    : t.status === 'pending'
                                        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                            }`}>
                                {t.status === 'completed' && <CheckCircle className="w-2.5 h-2.5 mr-0.5" />}
                                {t.status === 'pending' && <Clock className="w-2.5 h-2.5 mr-0.5" />}
                                {t.status === 'failed' && <XCircle className="w-2.5 h-2.5 mr-0.5" />}
                                {t.status}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};