import React, { useState } from 'react';
import { useUser } from '../types';
import { RefreshCcw, Coins, AlertTriangle, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export const ConvertView: React.FC = () => {
  const { state, secureConvert, showInterstitial, showRewarded } = useUser();
  const [inputPoints, setInputPoints] = useState<string>('');
  
  const MIN_POINTS = 5000; 
  const RATE = 100; 

  const handleConvertClick = () => {
    const pointsToConvert = parseInt(inputPoints);
    
    if (!inputPoints || isNaN(pointsToConvert)) {
        toast.error("Please enter points to convert");
        return;
    }

    if (pointsToConvert < MIN_POINTS) {
        toast.error(`Minimum convert limit is ${MIN_POINTS} Points`);
        return;
    }

    if (pointsToConvert > state.balance) {
        toast.error("Insufficient Points!");
        return;
    }

    showInterstitial(() => {
        if (state.balance < pointsToConvert) {
             toast.error("Insufficient Points");
        } else {
            showRewarded(async () => {
                const success = await secureConvert(pointsToConvert);
                if (success) {
                    toast.success(`Success! Converted Points to Money`);
                    setInputPoints('');
                }
            });
        }
    });
  };

  const calculatedMoney = inputPoints ? (parseInt(inputPoints) / RATE).toFixed(2) : '0.00';

  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-full space-y-6">
      
      <div className="text-center space-y-2">
        <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto border-2 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
            <RefreshCcw className="w-10 h-10 text-yellow-500 animate-[spin_10s_linear_infinite]" />
        </div>
        <h2 className="text-2xl font-bold text-white">Convert Points</h2>
        <p className="text-green-300 text-sm">Rate: 5000 Points = 50 BDT</p>
      </div>

      <div className="w-full max-w-sm bg-green-900 rounded-2xl p-6 border border-green-700 shadow-xl">
        
        <div className="bg-green-950/50 rounded-xl p-4 mb-6 border border-green-700/50 text-center">
            <span className="text-green-400 text-xs uppercase tracking-wider">Current Balance</span>
            <div className="flex items-center justify-center space-x-2 mt-1">
                <Coins className="w-5 h-5 text-yellow-500" />
                <span className="text-2xl font-bold text-white">{state.balance.toLocaleString()}</span>
            </div>
        </div>

        <div className="space-y-4 mb-6">
            <div>
                <label className="text-xs font-bold text-green-300 ml-1">Enter Points</label>
                <input 
                    type="number" 
                    value={inputPoints}
                    onChange={(e) => setInputPoints(e.target.value)}
                    placeholder={`Min ${MIN_POINTS}`}
                    className="w-full bg-green-950 border border-green-700 rounded-xl p-4 text-white focus:border-yellow-500 outline-none font-bold font-mono"
                />
            </div>
            
            <div className="flex justify-between items-center p-3 bg-green-950/50 rounded-lg border border-green-800">
                <span className="text-green-300 text-sm">You Receive:</span>
                <span className="text-red-400 font-bold text-xl">{calculatedMoney} BDT</span>
            </div>
        </div>

        <button 
            onClick={handleConvertClick}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center space-x-2 transition-all active:scale-95 ${
                state.balance >= MIN_POINTS 
                ? 'bg-yellow-500 hover:bg-yellow-400 text-slate-900' 
                : 'bg-green-800 text-green-600'
            }`}
        >
            {state.balance >= MIN_POINTS ? (
                <>
                    <RefreshCcw className="w-5 h-5" />
                    <span>CONVERT NOW</span>
                </>
            ) : (
                <>
                    <Lock className="w-5 h-5" />
                    <span>LOCKED</span>
                </>
            )}
        </button>
      </div>

      <div className="flex items-center space-x-2 text-red-300 bg-red-900/20 px-4 py-3 rounded-lg border border-red-500/20 max-w-sm">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <p className="text-xs leading-relaxed">
            <strong>Security:</strong> All conversions are verified. Fake points will lead to an immediate ban.
        </p>
      </div>
    </div>
  );
};