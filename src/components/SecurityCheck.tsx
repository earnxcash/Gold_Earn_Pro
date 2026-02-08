import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Smartphone, Wifi } from 'lucide-react';

export const SecurityCheck: React.FC = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(s => (s < 4 ? s + 1 : s));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const checks = [
    { icon: <Wifi className="w-5 h-5" />, text: "Checking Connection...", sub: "VPN/Proxy Detection" },
    { icon: <Lock className="w-5 h-5" />, text: "Verifying Integrity...", sub: "Root Access Check" },
    { icon: <Smartphone className="w-5 h-5" />, text: "Binding Device...", sub: "Unique ID Verification" },
    { icon: <ShieldCheck className="w-5 h-5" />, text: "Secure Environment", sub: "Ready to Launch" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
        {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-yellow-600 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="w-20 h-20 bg-slate-900 rounded-2xl mx-auto mb-8 border border-slate-700 flex items-center justify-center shadow-2xl shadow-blue-900/20">
            <ShieldCheck className="w-10 h-10 text-emerald-400 animate-pulse" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-8">System Check</h2>

        <div className="space-y-4">
          {checks.map((check, idx) => (
            <div 
              key={idx}
              className={`flex items-center space-x-4 p-3 rounded-lg border transition-all duration-500 ${
                step > idx 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : step === idx 
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 scale-105' 
                    : 'bg-slate-900/50 border-slate-800 text-slate-600 opacity-50'
              }`}
            >
              <div className={`${step === idx ? 'animate-spin' : ''}`}>
                {step > idx ? <ShieldCheck className="w-5 h-5" /> : check.icon}
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">{check.text}</p>
                <p className="text-xs opacity-70">{check.sub}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-300" 
                style={{ width: `${Math.min((step + 1) * 25, 100)}%` }}
            />
        </div>
      </div>
    </div>
  );
};