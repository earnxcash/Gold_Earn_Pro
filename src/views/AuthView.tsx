import React, { useState } from 'react';
import { useUser } from '../types';
import { ShieldCheck, User, Lock, Mail, Eye, EyeOff, ArrowRight, Smartphone, Share2 } from 'lucide-react';

// Helper to get or generate a persistent Device ID
const getDeviceId = () => {
    // @ts-ignore
    if (window.Android && window.Android.getDeviceId) {
        // @ts-ignore
        const androidId = window.Android.getDeviceId();
        if (androidId) return androidId;
    }
    
    let id = localStorage.getItem('device_id');
    if (!id) {
        // Generate a random UUID-like string
        id = 'dev-' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
        localStorage.setItem('device_id', id);
    }
    return id;
};

export const AuthView: React.FC = () => {
  const { authenticate, authError } = useUser();
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  // Signup only fields
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);

  // Validation
  const [localError, setLocalError] = useState('');

  const validate = () => {
      setLocalError('');
      
      if (phone.length < 11) return "Invalid phone number (11 digits required)";
      
      // Password Validation (8+ chars, numbers + letters)
      const hasNumber = /\d/.test(password);
      const hasLetter = /[a-zA-Z]/.test(password);
      
      if (password.length < 8) return "Password must be at least 8 characters";
      if (!hasNumber || !hasLetter) return "Password must contain letters and numbers";
      
      if (isSignup) {
          if (name.length < 3) return "Name is too short";
          if (!email.includes('@') || email.length < 5) return "Invalid email address";
          if (password !== confirmPassword) return "Passwords do not match";
      }
      return null;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const validationError = validate();
      if (validationError) {
          setLocalError(validationError);
          return;
      }

      setLoading(true);
      const deviceId = getDeviceId();
      
      // Pass the correct arguments based on login/signup mode to the API context wrapper
      if (isSignup) {
          await authenticate(phone, password, true, deviceId, name, email, referralCode);
      } else {
          await authenticate(phone, password, false, deviceId);
      }
      
      setLoading(false);
  };

  const toggleMode = () => {
      setIsSignup(!isSignup);
      setLocalError('');
      setConfirmPassword('');
      // Keep phone/password state for convenience
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-green-950 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-green-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-red-600/10 rounded-full blur-[100px]" />

        <div className="w-full max-w-sm bg-green-900/80 backdrop-blur-xl border border-green-700 rounded-3xl p-8 shadow-2xl relative z-10">
            
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-green-800 to-green-900 rounded-2xl mx-auto mb-4 border border-green-600 flex items-center justify-center shadow-lg">
                    <ShieldCheck className="w-8 h-8 text-green-300" />
                </div>
                <h1 className="text-2xl font-bold text-white">GoldEarn Pro</h1>
                <p className="text-green-300 text-xs uppercase tracking-widest mt-1">
                    {isSignup ? "Create Secure Account" : "Secure Member Login"}
                </p>
                <div className="mt-2 inline-flex items-center space-x-1 bg-green-950/50 px-2 py-1 rounded border border-green-800">
                    <Smartphone className="w-3 h-3 text-green-400" />
                    <span className="text-[10px] text-green-400">Device Locked</span>
                </div>
            </div>

            {(authError || localError) && (
                <div className="bg-red-900/50 border border-red-500 rounded-xl p-3 mb-6 text-xs text-red-200 text-left flex items-center">
                    <div className="w-1 h-8 bg-red-500 rounded-full mr-3"></div>
                    {localError || authError}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                
                {isSignup && (
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-green-400 ml-1 uppercase">Full Name</label>
                        <div className="relative group">
                            <User className="absolute left-3 top-3 w-5 h-5 text-green-600 group-focus-within:text-yellow-400 transition-colors" />
                            <input 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your name"
                                className="w-full bg-green-950/50 border border-green-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-yellow-500 outline-none transition-all placeholder-green-800 text-sm"
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-green-400 ml-1 uppercase">Phone Number</label>
                    <div className="relative group">
                        <Smartphone className="absolute left-3 top-3 w-5 h-5 text-green-600 group-focus-within:text-yellow-400 transition-colors" />
                        <input 
                            type="tel" 
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="017xxxxxxxx"
                            className="w-full bg-green-950/50 border border-green-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-yellow-500 outline-none transition-all placeholder-green-800 text-sm"
                        />
                    </div>
                </div>

                {isSignup && (
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-green-400 ml-1 uppercase">Email Address</label>
                        <div className="relative group">
                            <Mail className="absolute left-3 top-3 w-5 h-5 text-green-600 group-focus-within:text-yellow-400 transition-colors" />
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                className="w-full bg-green-950/50 border border-green-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-yellow-500 outline-none transition-all placeholder-green-800 text-sm"
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-green-400 ml-1 uppercase">Password</label>
                    <div className="relative group">
                        <Lock className="absolute left-3 top-3 w-5 h-5 text-green-600 group-focus-within:text-yellow-400 transition-colors" />
                        <input 
                            type={showPassword ? "text" : "password"} 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min 8 chars (A-Z, 0-9)"
                            className="w-full bg-green-950/50 border border-green-700 rounded-xl py-3 pl-10 pr-10 text-white focus:border-yellow-500 outline-none transition-all placeholder-green-800 text-sm"
                        />
                        <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-green-600 hover:text-green-400"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {isSignup && (
                    <>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-green-400 ml-1 uppercase">Confirm Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3 w-5 h-5 text-green-600 group-focus-within:text-yellow-400 transition-colors" />
                                <input 
                                    type="password" 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repeat password"
                                    className="w-full bg-green-950/50 border border-green-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-yellow-500 outline-none transition-all placeholder-green-800 text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                             <label className="text-[10px] font-bold text-green-400 ml-1 uppercase">Referral Code (Optional)</label>
                             <div className="relative group">
                                 <Share2 className="absolute left-3 top-3 w-5 h-5 text-green-600 group-focus-within:text-yellow-400 transition-colors" />
                                 <input 
                                     type="text" 
                                     value={referralCode}
                                     onChange={(e) => setReferralCode(e.target.value)}
                                     placeholder="Enter code if any"
                                     className="w-full bg-green-950/50 border border-green-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-yellow-500 outline-none transition-all placeholder-green-800 text-sm"
                                 />
                             </div>
                         </div>
                    </>
                )}

                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-100 to-white hover:from-white hover:to-green-50 text-green-900 font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center space-x-2 mt-2"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-green-900 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <span>{isSignup ? "Create Account" : "Secure Login"}</span>
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-xs text-green-400 mb-2">{isSignup ? "Already have an account?" : "Don't have an account?"}</p>
                <button 
                    onClick={toggleMode}
                    className="text-white font-bold text-sm border-b border-yellow-500 pb-0.5 hover:text-yellow-400 transition-colors"
                >
                    {isSignup ? "Login Here" : "Create Account"}
                </button>
            </div>

            <div className="mt-8 pt-4 border-t border-green-800 flex justify-center items-center space-x-4 text-green-600 text-[10px]">
                 <span className="flex items-center"><ShieldCheck className="w-3 h-3 mr-1" /> Encrypted</span>
                 <span className="flex items-center"><Smartphone className="w-3 h-3 mr-1" /> One Device Policy</span>
            </div>
        </div>
    </div>
  );
};