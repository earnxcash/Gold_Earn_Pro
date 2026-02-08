import React from 'react';
import { Home, Wallet, User, Coins, ArrowLeft, RefreshCw, Bell, Menu } from 'lucide-react';
import { useUser, ViewState } from '../types';
import { AdBanner } from './AdBanner';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { state, currentView, navigate } = useUser();

  const isMainView = ['earn', 'withdraw', 'profile', 'convert'].includes(currentView);

  const getTitle = () => {
    switch(currentView) {
        case 'math': return 'Math Quiz';
        case 'spin': return 'Lucky Spin';
        case 'video': return 'Watch Video';
        case 'refer': return 'Invite Friends';
        case 'convert': return 'Convert Points';
        case 'withdraw': return 'Wallet';
        case 'profile': return 'My Profile';
        default: return 'GoldEarn Pro';
    }
  };

  // --- Professional Header Components ---

  const MainHeader = () => (
    <div className="flex justify-between items-center w-full">
      <div className="flex items-center space-x-3">
        {/* Profile/Avatar Circle */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-800 to-green-900 border border-green-600 flex items-center justify-center shadow-lg overflow-hidden">
             {state.user?.photoURL ? (
                <img src={state.user.photoURL} alt="User" className="w-full h-full object-cover" />
             ) : (
                <User className="w-5 h-5 text-green-200" />
             )}
          </div>
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-green-950"></div>
        </div>
        
        {/* Greeting Text */}
        <div className="flex flex-col">
          <span className="text-[10px] text-green-400 font-medium uppercase tracking-wider">Welcome back</span>
          <span className="text-sm font-bold text-white leading-tight truncate max-w-[120px]">
            {state.user?.name?.split(' ')[0] || 'Earner'}
          </span>
        </div>
      </div>

      {/* Right Side: Balance & Notifs */}
      <div className="flex items-center space-x-3">
         {/* Premium Balance Chip */}
         <div className="bg-gradient-to-r from-green-900 to-green-950 border border-green-700/50 rounded-full pl-1 pr-3 py-1 flex items-center space-x-2 shadow-lg shadow-black/20">
            <div className="w-6 h-6 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/30">
                <Coins className="w-3.5 h-3.5 text-yellow-400" />
            </div>
            <span className="font-mono font-bold text-sm text-yellow-100">{state.balance.toLocaleString()}</span>
         </div>

         {/* Notification Bell - Red for Sun/Alert */}
         <button className="relative p-2 rounded-full hover:bg-green-900 transition-colors">
            <Bell className="w-5 h-5 text-green-200" />
            <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
         </button>
      </div>
    </div>
  );

  const SubHeader = () => (
    <div className="flex justify-between items-center w-full">
        <div className="flex items-center space-x-3">
            <button 
                onClick={() => navigate('earn')}
                className="w-10 h-10 rounded-xl bg-green-900 border border-green-800 flex items-center justify-center hover:bg-green-800 active:scale-95 transition-all shadow-lg"
            >
                <ArrowLeft className="w-5 h-5 text-green-100" />
            </button>
            <h1 className="text-lg font-bold text-white tracking-wide">{getTitle()}</h1>
        </div>

        {/* Mini Balance for Context */}
        <div className="flex items-center space-x-1.5 bg-green-900/50 px-2.5 py-1 rounded-lg border border-green-700">
             <Coins className="w-3.5 h-3.5 text-yellow-500" />
             <span className="text-xs font-bold text-green-100">{state.balance.toLocaleString()}</span>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-full max-w-md mx-auto bg-green-950 border-x border-green-900 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative font-sans">
      
      {/* PROFESSIONAL HEADER */}
      <header className="flex-none z-30 w-full bg-green-950/80 backdrop-blur-md border-b border-green-800 px-4 py-3 sticky top-0">
         {/* Top Decoration Line (Red for Flag) */}
         <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-green-900 via-red-600 to-green-900"></div>
         
         {isMainView && currentView === 'earn' ? <MainHeader /> : (
            isMainView ? (
                // Simple Header for Withdraw/Profile/Convert Main Views
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-2">
                        <div className="p-2 bg-yellow-500/10 rounded-lg">
                            {currentView === 'withdraw' && <Wallet className="w-5 h-5 text-yellow-500" />}
                            {currentView === 'profile' && <User className="w-5 h-5 text-yellow-500" />}
                            {currentView === 'convert' && <RefreshCw className="w-5 h-5 text-yellow-500" />}
                        </div>
                        <h1 className="text-lg font-bold text-white">{getTitle()}</h1>
                    </div>
                     <div className="bg-green-900 rounded-full px-3 py-1 flex items-center space-x-1 border border-green-800">
                        <Coins className="w-3 h-3 text-yellow-400" />
                        <span className="text-xs font-bold text-white">{state.balance.toLocaleString()}</span>
                     </div>
                </div>
            ) : <SubHeader />
         )}
      </header>

      {/* Main Content - Flex Grow ensures it takes remaining space, overflow-y-auto enables internal scroll */}
      <main className="flex-1 overflow-y-auto scroll-smooth bg-green-950 relative">
        {/* Background Ambient Glow (Green) */}
        <div className="fixed top-20 left-0 w-full h-64 bg-green-600/5 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="relative z-10 pb-4">
             {children}
        </div>
      </main>
      
      {/* Footer Container - Stays Fixed at Bottom of Flex Container */}
      {isMainView && (
        <div className="flex-none bg-green-950 z-50">
           {/* AdBanner sits on top of nav */}
           <div className="w-full relative z-10">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-green-800"></div>
              <AdBanner />
           </div>

           {/* Navigation */}
           <nav className="w-full bg-green-950/95 backdrop-blur-lg border-t border-green-800 px-4 py-3 pb-6 flex justify-around items-center shadow-[0_-10px_40px_rgba(0,0,0,0.3)] relative">
                <NavButton 
                    active={currentView === 'earn'} 
                    onClick={() => navigate('earn')} 
                    icon={<Home className="w-5 h-5" />} 
                    label="Home" 
                />
                <NavButton 
                    active={currentView === 'convert'} 
                    onClick={() => navigate('convert')} 
                    icon={<RefreshCw className="w-5 h-5" />} 
                    label="Convert" 
                />
                {/* Floating Center Button for Wallet (Red Accent) */}
                <div className="relative -top-5">
                    <button 
                        onClick={() => navigate('withdraw')}
                        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-4 border-green-950 transition-all active:scale-95 ${
                            currentView === 'withdraw' 
                            ? 'bg-red-600 text-white shadow-red-600/30' 
                            : 'bg-green-800 text-green-200 hover:bg-green-700'
                        }`}
                    >
                        <Wallet className="w-6 h-6" />
                    </button>
                    <span className={`absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-bold ${currentView === 'withdraw' ? 'text-red-500' : 'text-green-600'}`}>
                        Wallet
                    </span>
                </div>

                <NavButton 
                    active={currentView === 'profile'} 
                    onClick={() => navigate('profile')} 
                    icon={<User className="w-5 h-5" />} 
                    label="Profile" 
                />
           </nav>
        </div>
      )}
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ 
  active, onClick, icon, label 
}) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-12 py-1 space-y-1 transition-all duration-300 relative ${
      active ? 'text-yellow-400' : 'text-green-600 hover:text-green-400'
    }`}
  >
    <div className={`p-1 transition-all duration-300 ${active ? '-translate-y-1' : ''}`}>
        {icon}
    </div>
    <span className={`text-[10px] font-bold transition-all ${active ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
    {active && <div className="absolute -bottom-2 w-1 h-1 bg-yellow-400 rounded-full"></div>}
  </button>
);