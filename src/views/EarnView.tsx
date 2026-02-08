import React, { useState } from 'react';
import { useUser, ViewState } from '../types';
import { CalendarCheck, BrainCircuit, PlaySquare, Share2, CircleDashed, ExternalLink, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export const EarnView: React.FC = () => {
  return (
    <div className="p-4 space-y-4">
      <DailyCheckIn />
      
      {/* Featured Telegram Offer */}
      <FeaturedOffer />

      <div className="grid grid-cols-2 gap-4">
        <TaskButton 
            title="GK Quiz" 
            subtitle="Knowledge" 
            points="20" 
            icon={<BrainCircuit className="w-6 h-6 text-green-200" />} 
            color="bg-green-900/40 border-green-700/50 hover:border-green-500" 
            target="math"
        />
        <TaskButton 
            title="Spin Wheel" 
            subtitle="Lucky Draw" 
            points="40" 
            icon={<CircleDashed className="w-6 h-6 text-yellow-400" />} 
            color="bg-green-900/40 border-green-700/50 hover:border-yellow-500" 
            target="spin"
        />
        <TaskButton 
            title="Watch Video" 
            subtitle="Easy Win" 
            points="30" 
            icon={<PlaySquare className="w-6 h-6 text-red-400" />} 
            color="bg-green-900/40 border-green-700/50 hover:border-red-500" 
            target="video"
        />
        <TaskButton 
            title="Refer Friends" 
            subtitle="Big Bonus" 
            points="500" 
            icon={<Share2 className="w-6 h-6 text-blue-400" />} 
            color="bg-green-900/40 border-green-700/50 hover:border-blue-500" 
            target="refer"
        />
      </div>
    </div>
  );
};

interface TaskButtonProps {
    title: string;
    subtitle: string;
    points: string;
    icon: React.ReactNode;
    color: string;
    target: ViewState;
}

const TaskButton: React.FC<TaskButtonProps> = ({ title, subtitle, points, icon, color, target }) => {
    const { navigate } = useUser();
    return (
        <button 
            onClick={() => navigate(target)}
            className={`${color} p-4 rounded-xl flex flex-col items-center justify-center space-y-3 hover:scale-[1.02] active:scale-95 transition-all text-center h-40 border shadow-lg backdrop-blur-sm`}
        >
            <div className="p-3 bg-green-950/50 rounded-full shadow-inner">
                {icon}
            </div>
            <div>
                <h3 className="font-bold text-green-50 leading-none mb-1">{title}</h3>
                <p className="text-xs text-green-400/70">{subtitle}</p>
            </div>
            <div className="text-xs font-mono bg-green-950/50 px-2 py-0.5 rounded text-yellow-500 font-bold border border-green-800">
                Up to {points} Pts
            </div>
        </button>
    );
}

const DailyCheckIn: React.FC = () => {
  const { state, secureTaskComplete, showRewarded } = useUser();
  const [checking, setChecking] = useState(false);

  const canCheckIn = () => {
    if (!state.lastCheckIn) return true;
    const lastDate = new Date(state.lastCheckIn).getDate();
    const today = new Date().getDate();
    return lastDate !== today;
  };

  const handleCheckIn = () => {
    if (!canCheckIn()) {
      toast.error('Already checked in today!');
      return;
    }
    setChecking(true);
    
    showRewarded(async () => {
        const success = await secureTaskComplete('checkin', 50);
        if (success) toast.success('+50 Points Received!');
        setChecking(false);
    });
  };

  return (
    <button 
      onClick={handleCheckIn}
      disabled={!canCheckIn() || checking}
      className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all shadow-lg ${
        canCheckIn() 
        ? 'bg-gradient-to-r from-green-900 to-green-800 border-green-600 hover:border-yellow-500' 
        : 'bg-green-900/30 border-green-800/30 opacity-60'
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${canCheckIn() ? 'bg-red-500/20' : 'bg-green-950'}`}>
          <CalendarCheck className={`w-6 h-6 ${canCheckIn() ? 'text-red-500' : 'text-green-600'}`} />
        </div>
        <div className="text-left">
          <h3 className="font-bold text-white">Daily Check-in</h3>
          <p className="text-xs text-green-300">{canCheckIn() ? 'Tap to claim reward' : 'Come back tomorrow'}</p>
        </div>
      </div>
      <div className="bg-green-950/50 px-3 py-1 rounded-full border border-green-700 flex items-center">
         <span className="text-yellow-400 font-bold text-sm">+50</span>
      </div>
    </button>
  );
};

const FeaturedOffer: React.FC = () => {
    const handleJoin = () => {
        window.open('https://t.me/goldearnpro', '_blank');
    };

    return (
        <div className="bg-gradient-to-br from-blue-900/80 to-blue-800/80 p-4 rounded-xl border border-blue-500/30 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10">
                <Send className="w-16 h-16 text-white" />
            </div>
            
            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <Send className="w-5 h-5 text-blue-200" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">Join Telegram Channel</h3>
                        <p className="text-xs text-blue-200">Get Payment Proofs & Updates</p>
                    </div>
                </div>
                
                <button 
                    onClick={handleJoin}
                    className="bg-white text-blue-900 px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors flex items-center space-x-1"
                >
                    <span>Join</span>
                    <ExternalLink className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
};