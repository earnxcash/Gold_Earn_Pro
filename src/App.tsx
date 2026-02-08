import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { EarnView } from './views/EarnView';
import { WithdrawView } from './views/WithdrawView';
import { ProfileView } from './views/ProfileView';
import { MathPage, SpinPage, VideoPage, InvitePage } from './views/TaskPages';
import { ConvertView } from './views/ConvertView';
import { AuthView } from './views/AuthView';
import { SecurityCheck } from './components/SecurityCheck';
import { AdOverlay } from './components/AdOverlay';
import { UserContext, UserState, ViewState } from './types';
import { Toaster, toast } from 'react-hot-toast';
import { api } from './api';
import { Shield, Loader2, Signal, WifiOff } from 'lucide-react';

// --- CAPACITOR IMPORTS ---
import { 
    AdMob, 
    RewardAdOptions, 
    AdLoadInfo, 
    RewardAdPluginEvents, 
    InterstitialAdPluginEvents,
    AdMobRewardVideoAdRewardItem 
} from '@capacitor-community/admob';
import { Network } from '@capacitor/network';
import { registerPlugin } from '@capacitor/core';

// --- DEFINE UNITY ADS PLUGIN INTERFACE ---
// Assumes a Native Bridge is registered as 'UnityAds' in the Capacitor Project
interface UnityAdsPlugin {
    initialize(options: { gameId: string; testMode: boolean }): Promise<void>;
    showRewardedAd(options: { placementId: string }): Promise<{ reward: boolean }>;
    showInterstitialAd(options: { placementId: string }): Promise<void>;
}
const UnityAds = registerPlugin<UnityAdsPlugin>('UnityAds');

// --- AD CONFIGURATION ---
const AD_CONFIG = {
    adMob: {
        // Standard Android Test IDs
        rewarded: 'ca-app-pub-3940256099942544/5224354917',
        interstitial: 'ca-app-pub-3940256099942544/1033173712'
    },
    unity: {
        gameId: '6038435',
        rewardedPlacement: 'Rewarded_Android',
        interstitialPlacement: 'Interstitial_Android'
    }
};

const INITIAL_STATE: UserState = {
  isAuthenticated: false,
  user: null,
  balance: 0,
  transactions: [],
  lastCheckIn: null,
  referralCode: '',
  totalEarned: 0,
  taskDate: null,
  spinCount: 0,
  spinLimit: 10,
  mathCount: 0,
  mathLimit: 10,
  videoCount: 0,
  videoLimit: 10,
};

// --- Loading Overlay Component ---
const LoadingAdOverlay: React.FC = () => (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center text-center p-6 backdrop-blur-md">
        <div className="relative">
            <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl animate-pulse"></div>
            <Shield className="w-16 h-16 text-yellow-500 relative z-10 mb-4" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Securing Advertisement...</h3>
        <p className="text-sm text-green-400 mb-6 flex items-center justify-center gap-2">
            <Signal className="w-4 h-4 animate-pulse" />
            Optimizing Revenue Channel
        </p>
        <div className="flex items-center space-x-2 bg-green-900/50 px-4 py-2 rounded-lg border border-green-800">
            <Loader2 className="w-5 h-5 text-white animate-spin" />
            <span className="text-xs text-green-200">Please wait...</span>
        </div>
    </div>
);

export default function App() {
  const [loading, setLoading] = useState(true);
  const [isLoadingAd, setIsLoadingAd] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('earn');
  const [userState, setUserState] = useState<UserState>(INITIAL_STATE);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Refs for Ad Callbacks
  const onRewardRef = useRef<(() => void) | null>(null);
  const onInterstitialClosedRef = useRef<(() => void) | null>(null);

  // Web Simulation State (fallback for dev in browser)
  const [adState, setAdState] = useState<{
    showing: boolean;
    type: 'interstitial' | 'rewarded';
    onComplete?: () => void;
  }>({ showing: false, type: 'interstitial' });

  // --- LOGOUT / SESSION CLEAR ---
  const logout = () => {
    localStorage.removeItem('user_id');
    localStorage.removeItem('auth_token');
    setUserState(INITIAL_STATE);
  };

  const handleApiError = (error: any) => {
      if (error.message === 'Unauthorized') {
          toast.error("Session Expired. Please Login.");
          logout();
          return true; 
      }
      return false; 
  };

  // --- INITIALIZE AD SDKS ---
  useEffect(() => {
    const initAdSdks = async () => {
        // 1. Initialize AdMob
        try {
            await AdMob.initialize({ requestTrackingAuthorization: true, initializeForTesting: true });
            console.log('AdMob Initialized');
        } catch (e) {
            console.error('AdMob Init Failed', e);
        }

        // 2. Initialize Unity Ads
        try {
            await UnityAds.initialize({ gameId: AD_CONFIG.unity.gameId, testMode: true });
            console.log('Unity Ads Initialized');
        } catch (e) {
            console.error('Unity Init Failed (Plugin may be missing)', e);
        }
    };
    initAdSdks();

    // --- SETUP ADMOB LISTENERS ---
    
    // Rewarded Ad Listener
    const onRewarded = AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: AdMobRewardVideoAdRewardItem) => {
        console.log('AdMob Reward Received:', reward);
        // CRITICAL: Only grant reward here
        if (onRewardRef.current) {
            onRewardRef.current();
            onRewardRef.current = null;
        }
    });

    // Dismiss Listener (Cleanup)
    const onDismiss = AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        setIsLoadingAd(false);
    });
    
    // Interstitial Dismiss Listener
    const onIntDismiss = AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
        setIsLoadingAd(false);
        if (onInterstitialClosedRef.current) {
            onInterstitialClosedRef.current();
            onInterstitialClosedRef.current = null;
        }
    });

    return () => {
        onRewarded.remove();
        onDismiss.remove();
        onIntDismiss.remove();
    };
  }, []);

  // --- DATA LOADING ---
  useEffect(() => {
    const checkSession = async () => {
        const storedId = localStorage.getItem('user_id');
        const token = localStorage.getItem('auth_token');
        if (storedId && token) {
            try {
                const data = await api.getUserData(storedId);
                if (data) setUserState(data);
            } catch (e: any) {
                if (e.message === 'Unauthorized') logout();
            }
        }
        setLoading(false);
    };
    checkSession();
  }, []);

  const refreshUserData = async () => {
      if (userState.user?._id) {
          try {
              const data = await api.getUserData(userState.user._id);
              if (data) setUserState(data);
          } catch (e: any) {
              handleApiError(e);
          }
      }
  };

  // --- AUTH & TASKS ---
  const authenticate = async (phone: string, password: string, isSignup: boolean, deviceId: string, name?: string, email?: string, referralCode?: string) => {
      setAuthError(null);
      try {
          const data = await api.authenticate(phone, password, isSignup, deviceId, name, email, referralCode);
          if (data.user?._id) {
              setUserState(data);
              toast.success(isSignup ? "Account Created!" : "Welcome Back!");
              setCurrentView('earn');
          }
      } catch (error: any) {
          setAuthError(error.message || "Authentication Failed");
          toast.error(error.message || "Auth Failed");
      }
  };

  const secureTaskComplete = async (taskType: 'spin' | 'math' | 'video' | 'checkin' | 'refer', points: number): Promise<boolean> => {
      if (!userState.user?._id) return false;
      const payload = taskType === 'spin' ? { score: points } : {};
      try {
          const success = await api.completeTask(taskType, payload);
          if (success) {
              await refreshUserData();
              return true;
          } else {
              toast.error("Limit Reached or Invalid Task");
              return false;
          }
      } catch (e: any) {
          if (handleApiError(e)) return false;
          toast.error("Task Failed");
          return false;
      }
  };

  const secureWithdraw = async (amount: number, method: string, account: string): Promise<boolean> => {
      if (!userState.user?._id) return false;
      try {
          const success = await api.withdrawRequest(amount, method, account);
          if (success) {
              await refreshUserData();
              return true;
          }
          return false;
      } catch (e: any) {
          if (handleApiError(e)) return false;
          toast.error(e.message || "Withdrawal Failed");
          return false;
      }
  };

  const secureConvert = async (amountPoints: number): Promise<boolean> => {
      toast.error("Conversion currently disabled for maintenance.");
      return false;
  };

  const secureAdRefill = async (taskType: 'spin' | 'math' | 'video') => {
      if (!userState.user?._id) return;
      try {
          await api.refillLimit(userState.user._id, taskType);
          await refreshUserData();
      } catch (e: any) {
          handleApiError(e);
      }
  };

  // --- DUAL-AD WATERFALL SYSTEM ---

  const checkConnection = async (): Promise<boolean> => {
      const status = await Network.getStatus();
      if (!status.connected) {
          toast.error("No Internet Connection", { icon: <WifiOff /> });
          return false;
      }
      return true;
  };

  // 1. Waterfall: Interstitial
  const showInterstitial = async (onClosed?: () => void) => {
    // Web Fallback for development
    const isNative = (window as any).Capacitor?.isNative;
    if (!isNative) {
        setAdState({ showing: true, type: 'interstitial', onComplete: onClosed });
        return;
    }

    if (!(await checkConnection())) return;

    setIsLoadingAd(true);
    onInterstitialClosedRef.current = onClosed || (() => {});

    try {
        console.log("Waterfall Step 1: Requesting AdMob Interstitial...");
        await AdMob.prepareInterstitial({ 
            adId: AD_CONFIG.adMob.interstitial
        });
        await AdMob.showInterstitial();
    } catch (adMobError) {
        console.warn("AdMob Failed, Waterfall Step 2: Requesting Unity Interstitial...", adMobError);
        try {
            await UnityAds.showInterstitialAd({ placementId: AD_CONFIG.unity.interstitialPlacement });
            // Unity closed successfully
            setIsLoadingAd(false);
            if(onInterstitialClosedRef.current) {
                onInterstitialClosedRef.current();
                onInterstitialClosedRef.current = null;
            }
        } catch (unityError) {
            console.error("All Ad Networks Failed", unityError);
            setIsLoadingAd(false);
            toast.error("Ads currently unavailable. Try again later.");
            onInterstitialClosedRef.current = null;
        }
    }
  };

  // 2. Waterfall: Rewarded
  const showRewarded = async (onReward: () => void) => {
    // Web Fallback
    const isNative = (window as any).Capacitor?.isNative;
    if (!isNative) {
        setAdState({ showing: true, type: 'rewarded', onComplete: onReward });
        return;
    }

    if (!(await checkConnection())) return;

    setIsLoadingAd(true);
    onRewardRef.current = onReward; // Store secure callback

    try {
        console.log("Waterfall Step 1: Requesting AdMob Rewarded...");
        await AdMob.prepareRewardVideoAd({ 
            adId: AD_CONFIG.adMob.rewarded 
        });
        await AdMob.showRewardVideoAd();
        // Point award handled in 'RewardAdPluginEvents.Rewarded' listener above
    } catch (adMobError) {
        console.warn("AdMob Failed, Waterfall Step 2: Requesting Unity Rewarded...", adMobError);
        try {
            const result = await UnityAds.showRewardedAd({ placementId: AD_CONFIG.unity.rewardedPlacement });
            setIsLoadingAd(false);
            if (result.reward) {
                console.log("Unity Reward Received");
                if(onRewardRef.current) {
                    onRewardRef.current(); // Secure callback
                    onRewardRef.current = null;
                }
            }
        } catch (unityError) {
            console.error("All Ad Networks Failed", unityError);
            setIsLoadingAd(false);
            toast.error("Ads currently unavailable. Try again later.");
            onRewardRef.current = null;
        }
    }
  };

  const handleWebAdClose = () => setAdState(prev => ({ ...prev, showing: false }));
  const handleWebAdComplete = () => { if (adState.onComplete) adState.onComplete(); };

  if (loading) return <SecurityCheck />;

  return (
    <UserContext.Provider value={{ 
      state: userState, 
      authError,
      authenticate, logout,
      secureTaskComplete, secureWithdraw, secureConvert, secureAdRefill, refreshUser: refreshUserData,
      showInterstitial, showRewarded,
      navigate: setCurrentView,
      currentView
    }}>
      <div className="min-h-screen bg-green-950 text-green-50 font-sans pb-0 flex flex-col">
        {!userState.isAuthenticated ? (
            <AuthView />
        ) : (
            <Layout>
                {currentView === 'earn' && <EarnView />}
                {currentView === 'withdraw' && <WithdrawView />}
                {currentView === 'profile' && <ProfileView />}
                {currentView === 'convert' && <ConvertView />} 
                {currentView === 'math' && <MathPage />}
                {currentView === 'spin' && <SpinPage />}
                {currentView === 'video' && <VideoPage />}
                {currentView === 'refer' && <InvitePage />}
            </Layout>
        )}
        
        {/* Web Simulation Overlay */}
        {adState.showing && (
            <AdOverlay 
                type={adState.type}
                onComplete={handleWebAdComplete} 
                onClose={handleWebAdClose}
            />
        )}

        {/* Secure Loading Overlay for Native Ads */}
        {isLoadingAd && <LoadingAdOverlay />}
        
        <Toaster position="bottom-center" toastOptions={{ style: { background: '#064e3b', color: '#fff', border: '1px solid #10b981' } }} />
      </div>
    </UserContext.Provider>
  );
}