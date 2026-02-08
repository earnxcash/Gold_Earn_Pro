import React from 'react';

export type ViewState = 'earn' | 'withdraw' | 'profile' | 'math' | 'spin' | 'video' | 'refer' | 'convert';

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface UserProfile {
  _id: string; // MongoDB style ID
  name: string;
  phone: string;
  email: string;
  joinedDate: string;
  photoURL?: string;
}

export interface UserState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  balance: number;
  transactions: Transaction[];
  lastCheckIn: string | null;
  referralCode: string;
  totalEarned: number;
  
  // New Task Tracking System
  taskDate: string | null;
  spinCount: number;
  spinLimit: number;
  mathCount: number;
  mathLimit: number;
  videoCount: number;
  videoLimit: number;
}

export interface UserContextType {
  state: UserState;
  authError: string | null;
  // Auth Methods: Added deviceId parameter
  authenticate: (phone: string, password: string, isSignup: boolean, deviceId: string, name?: string, email?: string, referralCode?: string) => Promise<void>;
  logout: () => void;

  // Secure Methods
  secureTaskComplete: (taskType: 'spin' | 'math' | 'video' | 'checkin' | 'refer', points: number) => Promise<boolean>;
  secureWithdraw: (amount: number, method: string, account: string) => Promise<boolean>;
  secureConvert: (amountPoints: number) => Promise<boolean>;
  secureAdRefill: (taskType: 'spin' | 'math' | 'video') => Promise<void>;
  
  // Data Methods
  refreshUser: () => Promise<void>;

  // Ad Methods
  showInterstitial: (onClosed?: () => void) => void;
  showRewarded: (onReward: () => void) => void;
  
  navigate: (view: ViewState) => void;
  currentView: ViewState;
}

export const UserContext = React.createContext<UserContextType | undefined>(undefined);

export function useUser() {
  const context = React.useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
