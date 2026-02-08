import React, { useEffect, useState } from 'react';
import { X, PlayCircle, Info, SkipForward } from 'lucide-react';

interface AdOverlayProps {
  type: 'interstitial' | 'rewarded';
  onComplete: () => void;
  onClose: () => void;
}

export const AdOverlay: React.FC<AdOverlayProps> = ({ type, onComplete, onClose }) => {
  // Policy: Rewarded ads usually 10-30s, Interstitials 5s mandatory
  const duration = type === 'rewarded' ? 15 : 5; 
  const [timeLeft, setTimeLeft] = useState(duration);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanClose(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClose = () => {
    if (type === 'rewarded') {
        // Only grant reward if watched fully (simulated by canClose)
        if (canClose) {
            onComplete(); 
        } else {
            // User closed early? Usually not possible in native, but for web:
            onClose(); 
            return;
        }
    } else {
        // Interstitial just closes
        onComplete();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
      {/* Header / Close Button Area */}
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <div className="bg-black/50 text-white px-3 py-1 rounded-full text-xs font-medium border border-white/20 backdrop-blur-md">
            {canClose 
                ? (type === 'rewarded' ? 'Reward Granted' : 'You can skip') 
                : `Ad ends in ${timeLeft}s`
            }
        </div>
        
        {canClose && (
          <button 
            onClick={handleClose}
            className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors backdrop-blur-sm group"
          >
            {type === 'interstitial' ? <SkipForward className="w-6 h-6 text-white" /> : <X className="w-6 h-6 text-white" />}
          </button>
        )}
      </div>

      <div className="absolute top-4 left-4">
         <div className="bg-yellow-500 text-black px-2 py-0.5 rounded text-[10px] font-bold">
            Ad
         </div>
      </div>

      {/* Ad Content Simulation */}
      <div className="text-center p-8 max-w-sm w-full">
        <div className="w-full aspect-video bg-slate-800 rounded-lg mb-6 flex items-center justify-center relative overflow-hidden border border-slate-700">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900 to-purple-900 animate-pulse"></div>
            <PlayCircle className="w-16 h-16 text-white/50 relative z-10" />
            <p className="absolute bottom-2 text-xs text-white/50">
                {type === 'rewarded' ? 'Video Ad (High CPM)' : 'Interstitial Ad'}
            </p>
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-2">Amazing App</h3>
        <p className="text-slate-400 mb-8 text-sm">Install now to get 5000 coins instantly!</p>
        
        <button className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold w-full hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/30">
          Install Now
        </button>
        
        <div className="mt-8 flex justify-center space-x-4 text-[10px] text-slate-600">
            <span className="flex items-center"><Info className="w-3 h-3 mr-1"/> Google AdMob</span>
            <span>Privacy</span>
        </div>
      </div>
    </div>
  );
};