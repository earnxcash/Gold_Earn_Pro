import React, { useState } from 'react';
import { useUser } from '../types';
import toast from 'react-hot-toast';
import { Smartphone, CreditCard, Banknote, AlertCircle, ShieldCheck } from 'lucide-react';

export const WithdrawView: React.FC = () => {
  const { state, secureWithdraw } = useUser();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [account, setAccount] = useState('');
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');

  const CONVERSION_RATE = 100;
  const MIN_WITHDRAW_POINTS = 5000;

  const handleWithdrawClick = (e: React.FormEvent) => {
    e.preventDefault();
    const points = parseInt(amount);

    if (!method) {
      toast.error('Select a payment method');
      return;
    }
    if (isNaN(points)) {
      toast.error(`Please enter a valid amount`);
      return;
    }
    if (points < MIN_WITHDRAW_POINTS) {
      toast.error(`Minimum withdraw is ${MIN_WITHDRAW_POINTS} points`);
      return;
    }
    if (points > state.balance) {
      toast.error('Insufficient balance');
      return;
    }
    if (account.length < 11) {
        toast.error('Invalid account number');
        return;
    }
    setConfirmInput('');
    setShowConfirm(true);
  };

  const finalizeWithdraw = async () => {
      if (confirmInput !== 'CONFIRM') {
          toast.error("Please type CONFIRM to proceed");
          return;
      }
      
      const points = parseInt(amount);
      if (isNaN(points)) return;

      // Secure Call: This communicates with the atomic backend endpoint
      const success = await secureWithdraw(points, method, account);
      
      if (success) {
        toast.success('Withdraw request submitted successfully!');
        setAmount('');
        setAccount('');
        setMethod('');
        setShowConfirm(false);
      }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-gradient-to-br from-green-800 to-green-900 rounded-2xl p-8 text-center border border-green-700 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
            <Banknote className="w-24 h-24 text-white" />
        </div>
        {/* Red Circle Decoration */}
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-red-600 rounded-full blur-[60px] opacity-20"></div>

        <p className="text-green-300 text-sm mb-1 font-medium uppercase tracking-wider">Available Balance</p>
        <h2 className="text-5xl font-bold text-white mb-2">{state.balance.toLocaleString()}</h2>
        <div className="inline-block bg-green-950/50 px-3 py-1 rounded-full border border-green-600">
            <p className="text-yellow-400 font-bold text-sm">
                ≈ {(state.balance / CONVERSION_RATE).toFixed(2)} BDT
            </p>
        </div>
      </div>

      <form onSubmit={handleWithdrawClick} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-green-200 mb-3">Select Method</label>
          <div className="grid grid-cols-3 gap-3">
            {[
                { id: 'bkash', name: 'bKash', icon: <Banknote className="w-5 h-5"/>, color: 'text-pink-500 border-pink-500/30' },
                { id: 'nagad', name: 'Nagad', icon: <CreditCard className="w-5 h-5"/>, color: 'text-orange-500 border-orange-500/30' },
                { id: 'recharge', name: 'Recharge', icon: <Smartphone className="w-5 h-5"/>, color: 'text-blue-500 border-blue-500/30' }
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all duration-300 ${
                  method === m.id
                    ? 'bg-green-800 border-green-500 text-white shadow-lg scale-105'
                    : `bg-green-900/50 border-green-800/50 text-slate-400 hover:bg-green-900`
                }`}
              >
                <div className={method === m.id ? 'text-white' : m.color.split(' ')[0]}>{m.icon}</div>
                <span className="text-xs font-bold">{m.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
            <label className="block text-sm font-bold text-green-200 mb-2">Account Number</label>
            <input 
                type="number"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="017xxxxxxxx"
                className="w-full bg-green-900/50 border border-green-700 rounded-xl p-4 text-white placeholder-green-700 focus:outline-none focus:border-yellow-500 transition-colors"
            />
        </div>

        <div>
            <label className="block text-sm font-bold text-green-200 mb-2">Amount (Points)</label>
            <input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Min ${MIN_WITHDRAW_POINTS}`}
                className="w-full bg-green-950/50 border border-green-700 rounded-xl p-4 text-white placeholder-green-700 focus:outline-none focus:border-yellow-500 transition-colors"
            />
            <div className="flex justify-between items-center mt-2">
                 <p className="text-xs text-green-500">Min: {MIN_WITHDRAW_POINTS} Pts</p>
                 <p className="text-xs text-yellow-400 font-bold">
                    You Receive: {amount ? (parseInt(amount) / CONVERSION_RATE).toFixed(2) : '0.00'} BDT
                 </p>
            </div>
        </div>

        <button 
            type="submit"
            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-red-600/20 active:scale-95 mt-4"
        >
            Withdraw Now
        </button>
      </form>

      <div className="bg-red-900/20 border border-red-500/20 p-4 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div>
            <h4 className="text-red-400 font-bold text-sm mb-1">Important Notice</h4>
            <ul className="text-xs text-red-200/70 space-y-1 list-disc list-inside">
                <li>Minimum withdrawal is {MIN_WITHDRAW_POINTS} points (50 BDT).</li>
                <li>Incorrect numbers will not be refunded.</li>
                <li>Do not use VPN while using this app.</li>
            </ul>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-green-900 rounded-2xl border border-green-700 p-6 w-full max-w-sm shadow-2xl relative">
                  <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 bg-green-800 rounded-full flex items-center justify-center border-4 border-green-700">
                          <ShieldCheck className="w-8 h-8 text-yellow-400" />
                      </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white text-center mb-6">Confirm Withdrawal</h3>
                  
                  <div className="space-y-3 mb-6 text-sm bg-green-950/50 p-4 rounded-xl border border-green-800/50">
                      <div className="flex justify-between items-center border-b border-green-800 pb-2">
                          <span className="text-green-300">Method</span>
                          <span className="text-white font-bold uppercase bg-green-800 px-2 py-0.5 rounded text-xs">{method}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-green-800 pb-2">
                          <span className="text-green-300">Account</span>
                          <span className="text-white font-mono tracking-wide">{account}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-green-800 pb-2">
                          <span className="text-green-300">Points Deducted</span>
                          <span className="text-red-400 font-bold">-{parseInt(amount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                          <span className="text-green-300">You Receive</span>
                          <span className="text-yellow-400 font-bold text-lg">{(parseInt(amount) / CONVERSION_RATE).toFixed(2)} BDT</span>
                      </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-xs text-green-400 mb-2">Type <strong className="text-white">CONFIRM</strong> to proceed</label>
                    <input 
                        type="text" 
                        value={confirmInput}
                        onChange={(e) => setConfirmInput(e.target.value)}
                        className="w-full bg-green-950 border border-green-700 rounded-lg p-3 text-white focus:border-yellow-500 outline-none font-bold text-center tracking-widest placeholder-green-800 uppercase"
                        placeholder="CONFIRM"
                    />
                  </div>

                  <div className="flex space-x-3">
                      <button 
                          onClick={() => setShowConfirm(false)}
                          className="flex-1 py-3 rounded-xl bg-green-800 text-green-300 font-bold hover:bg-green-700 transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={finalizeWithdraw}
                          disabled={confirmInput !== 'CONFIRM'}
                          className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                              confirmInput === 'CONFIRM' 
                              ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 scale-105' 
                              : 'bg-green-800 text-green-600 cursor-not-allowed'
                          }`}
                      >
                          Confirm
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};