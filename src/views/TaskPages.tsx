import React, { useState, useEffect, useMemo } from 'react';
import { useUser } from '../types';
import { BrainCircuit, Play, Copy, Check, Info, PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// --- SHARED COMPONENTS ---

const LimitExhausted: React.FC<{ task: 'spin' | 'math' | 'video' }> = ({ task }) => {
    const { secureAdRefill, showRewarded } = useUser();
    
    const handleRefill = () => {
        showRewarded(async () => {
            await secureAdRefill(task);
            toast.success('Added +2 Limit successfully!');
        });
    };

    return (
        <div className="text-center p-6 bg-green-900 rounded-xl border border-red-500/30">
            <h3 className="text-xl font-bold text-red-400 mb-2">Daily Limit Reached!</h3>
            <p className="text-green-300 mb-4 text-sm">Watch a video ad to get <span className="text-yellow-400 font-bold">+2 Chances</span> instantly.</p>
            <button 
                onClick={handleRefill}
                className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-full flex items-center justify-center mx-auto space-x-2 transition-all active:scale-95 shadow-lg"
            >
                <Play className="w-5 h-5 fill-white" />
                <span>Watch Ad (+2)</span>
            </button>
        </div>
    );
};

// --- GENERAL KNOWLEDGE QUIZ PAGE ---
export const MathPage: React.FC = () => {
    const { state, secureTaskComplete, showInterstitial } = useUser();
    const [currentQ, setCurrentQ] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [sessionCount, setSessionCount] = useState(0); // Track local progress for ad frequency
    
    const questions = useMemo(() => [
        { q: "Capital of Bangladesh?", ans: "Dhaka", opts: ["Dhaka", "Chittagong", "Sylhet", "Khulna"] },
        { q: "National Fish of BD?", ans: "Hilsa", opts: ["Rui", "Hilsa", "Katla", "Shrimp"] },
        { q: "Victory Day of BD?", ans: "16 Dec", opts: ["21 Feb", "26 Mar", "16 Dec", "14 Apr"] },
        { q: "Currency of USA?", ans: "Dollar", opts: ["Euro", "Dollar", "Pound", "Taka"] },
        { q: "Tallest Animal?", ans: "Giraffe", opts: ["Elephant", "Giraffe", "Lion", "Tiger"] },
        { q: "Smallest Country?", ans: "Vatican", opts: ["Monaco", "Vatican", "Nauru", "Palau"] },
        { q: "Largest Ocean?", ans: "Pacific", opts: ["Atlantic", "Indian", "Arctic", "Pacific"] },
        { q: "Colors in Rainbow?", ans: "7", opts: ["5", "6", "7", "8"] },
        { q: "Fastest Land Animal?", ans: "Cheetah", opts: ["Lion", "Horse", "Cheetah", "Deer"] },
        { q: "Capital of Japan?", ans: "Tokyo", opts: ["Seoul", "Beijing", "Tokyo", "Bangkok"] },
        { q: "World's Largest River?", ans: "Amazon", opts: ["Nile", "Amazon", "Padma", "Yangtze"] },
        { q: "Human bones count?", ans: "206", opts: ["200", "206", "210", "195"] },
        { q: "Hardest Substance?", ans: "Diamond", opts: ["Gold", "Iron", "Diamond", "Silver"] },
        { q: "Sun is a?", ans: "Star", opts: ["Planet", "Star", "Comet", "Moon"] },
        { q: "H2O is?", ans: "Water", opts: ["Oxygen", "Water", "Salt", "Air"] },
    ], []);

    useEffect(() => { loadNewQuestion(); }, []);

    const loadNewQuestion = () => {
        const randomIndex = Math.floor(Math.random() * questions.length);
        setCurrentQ(questions[randomIndex]);
    };

    const handleAnswer = (selected: string) => {
        if(loading || !currentQ) return;
        setLoading(true);

        if (selected === currentQ.ans) {
            // Increment local session count
            const newCount = sessionCount + 1;
            setSessionCount(newCount);

            const processReward = async () => {
                const success = await secureTaskComplete('math', 0); // 0 acts as placeholder
                if (success) {
                    toast.success(`Correct! +20 Points`);
                    loadNewQuestion();
                }
                setLoading(false);
            };

            // Ad Logic: Force Interstitial every 2 correct answers
            if (newCount % 2 === 0) {
                showInterstitial(() => {
                    // This callback runs only after ad is closed
                    processReward();
                });
            } else {
                // Odd numbers (1, 3, 5) -> Instant reward
                processReward();
            }

        } else {
            toast.error('Wrong answer! Try again.');
            setLoading(false);
        }
    };

    const remaining = Math.max(0, state.mathLimit - state.mathCount);

    return (
        <div className="p-6 h-full flex flex-col items-center">
            <div className="w-full text-center mb-6">
                <div className="inline-flex items-center bg-green-900 px-4 py-2 rounded-full border border-green-700">
                    <BrainCircuit className="w-5 h-5 text-green-200 mr-2" />
                    <span className="font-bold text-green-100">GK Quiz</span>
                    <span className="ml-3 text-xs bg-green-950 px-2 py-1 rounded text-green-400">
                        {remaining} left
                    </span>
                </div>
            </div>

            {remaining <= 0 ? (
                <LimitExhausted task="math" />
            ) : (
                <div className="w-full max-w-sm bg-green-900 rounded-2xl p-6 border border-green-700 shadow-2xl relative">
                    <div className="mb-8 mt-2">
                        <h2 className="text-xl font-bold text-white mb-4 text-center min-h-[60px] flex items-center justify-center">
                            {currentQ?.q}
                        </h2>
                        <div className="h-1 w-20 bg-red-600 mx-auto rounded-full opacity-80"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {currentQ?.opts.map((opt: string, idx: number) => (
                            <button
                                key={idx}
                                onClick={() => handleAnswer(opt)}
                                disabled={loading}
                                className="bg-green-800 hover:bg-green-700 border border-green-600 text-green-50 font-bold py-4 rounded-xl transition-all active:scale-95 disabled:opacity-50 text-sm"
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- REAL SPIN WHEEL PAGE ---
export const SpinPage: React.FC = () => {
    const { state, secureTaskComplete, showRewarded, showInterstitial } = useUser();
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [spinSession, setSpinSession] = useState(0); // Track local spins

    const segments = [5, 10, 15, 20, 25, 30, 40, 0];
    const segColors = ['#eab308', '#22c55e', '#ef4444', '#3b82f6', '#a855f7', '#f97316', '#ec4899', '#64748b'];

    const remaining = Math.max(0, state.spinLimit - state.spinCount);

    const handleSpin = () => {
        if (isSpinning || remaining <= 0) return;

        setIsSpinning(true);
        
        const index = Math.floor(Math.random() * segments.length);
        const wonValue = segments[index];
        
        const segmentAngle = 360 / segments.length;
        const targetAngle = 360 - (index * segmentAngle); 
        const spins = 5; 
        const randomOffset = Math.floor(Math.random() * (segmentAngle - 10)) + 5;
        const totalRotation = rotation + (spins * 360) + targetAngle + randomOffset;
        
        setRotation(totalRotation);

        setTimeout(() => {
            setIsSpinning(false);
            
            // Increment Session Count
            const newCount = spinSession + 1;
            setSpinSession(newCount);

            // Function to handle the actual reward claim logic
            const processSpinResult = () => {
                if (wonValue > 0) {
                    // Standard: For a win, we usually show a Rewarded Video to CLAIM it
                    showRewarded(async () => {
                        const success = await secureTaskComplete('spin', wonValue);
                        if (success) toast.success(`You won ${wonValue} Points!`);
                    });
                } else {
                    // No win, just record it
                    secureTaskComplete('spin', 0); // Count spin but 0 points
                    toast.error('Better luck next time!');
                }
            };

            // Ad Logic: Force Interstitial every 2 spins BEFORE the reward process
            if (newCount % 2 === 0) {
                showInterstitial(() => {
                    // User must close interstitial to get to the claim stage
                    processSpinResult();
                });
            } else {
                // Odd spins proceed directly to result
                processSpinResult();
            }

        }, 3500);
    };

    return (
        <div className="p-6 h-full flex flex-col items-center">
            <div className="mb-6 flex items-center justify-between w-full max-w-xs">
                 <h2 className="text-2xl font-bold text-white">Lucky Spin</h2>
                 <div className="bg-green-900 px-3 py-1 rounded-full border border-green-700 text-xs font-bold text-yellow-500">
                    {remaining} Spins
                 </div>
            </div>

            {remaining <= 0 ? (
                <div className="mt-10 w-full max-w-xs">
                    <LimitExhausted task="spin" />
                </div>
            ) : (
                <>
                <div className="relative mb-8">
                    {/* Pointer */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6 z-20">
                        <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-red-600 drop-shadow-lg"></div>
                    </div>
                    
                    {/* Wheel Container */}
                    <div 
                        className="w-72 h-72 rounded-full border-4 border-green-800 relative shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden transition-transform duration-[3500ms] cubic-bezier(0.15, 0, 0.15, 1)"
                        style={{ transform: `rotate(${rotation}deg)` }}
                    >
                        {/* CSS Conic Gradient for Segments */}
                        <div className="w-full h-full" style={{
                            background: `conic-gradient(
                                ${segColors[0]} 0deg 45deg,
                                ${segColors[1]} 45deg 90deg,
                                ${segColors[2]} 90deg 135deg,
                                ${segColors[3]} 135deg 180deg,
                                ${segColors[4]} 180deg 225deg,
                                ${segColors[5]} 225deg 270deg,
                                ${segColors[6]} 270deg 315deg,
                                ${segColors[7]} 315deg 360deg
                            )`
                        }}></div>

                        {/* Numbers */}
                        {segments.map((val, i) => (
                            <div 
                                key={i}
                                className="absolute top-0 left-1/2 -translate-x-1/2 h-1/2 origin-bottom pt-4 text-white font-bold text-lg drop-shadow-md"
                                style={{ transform: `rotate(${i * 45 + 22.5}deg)` }} // Center number in segment
                            >
                                {val}
                            </div>
                        ))}
                        
                        {/* Center Hub */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-12 h-12 bg-white rounded-full shadow-xl border-4 border-slate-200"></div>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleSpin}
                    disabled={isSpinning}
                    className="w-full max-w-xs py-4 rounded-xl font-bold text-lg shadow-lg bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-slate-900 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                >
                    {isSpinning ? 'Spinning...' : 'SPIN NOW'}
                </button>
                </>
            )}
        </div>
    );
};

// --- VIDEO WATCH PAGE ---
export const VideoPage: React.FC = () => {
    const { state, secureTaskComplete, showRewarded } = useUser();
    const [timeLeft, setTimeLeft] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const remaining = Math.max(0, state.videoLimit - state.videoCount);

    useEffect(() => {
        let interval: any;
        if (isPlaying && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isPlaying) {
            setIsPlaying(false);
            
            showRewarded(async () => {
                // Server determines reward
                const success = await secureTaskComplete('video', 0); 
                if (success) toast.success(`+30 Points Added!`);
            });
        }
        return () => clearInterval(interval);
    }, [isPlaying, timeLeft]);

    const startVideo = () => {
        setIsPlaying(true);
        setTimeLeft(10); 
    };

    return (
        <div className="p-6 h-full flex flex-col items-center">
             <div className="w-full max-w-sm mb-4 flex justify-between items-center px-2">
                <h3 className="font-bold text-green-200">Video Tasks</h3>
                <span className="text-xs bg-green-900 px-3 py-1 rounded-full text-green-300 font-bold border border-green-700">
                    {remaining} Left
                </span>
             </div>

             {remaining <= 0 ? (
                 <LimitExhausted task="video" />
             ) : (
                <div className="w-full max-w-sm bg-green-900 rounded-2xl overflow-hidden border border-green-700 shadow-2xl">
                    <div className="aspect-video bg-black relative flex items-center justify-center group">
                        {isPlaying ? (
                            <div className="text-center">
                                <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                <p className="text-white font-mono">Loading Reward... {timeLeft}s</p>
                            </div>
                        ) : (
                            <>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                <button 
                                    onClick={startVideo}
                                    className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all z-10 scale-100 active:scale-95"
                                >
                                    <Play className="w-8 h-8 text-white ml-1" />
                                </button>
                                <span className="absolute bottom-4 left-4 text-white font-bold text-sm">Watch to Earn</span>
                            </>
                        )}
                    </div>
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-white mb-2">Premium Video Ad</h3>
                        <p className="text-green-300 text-sm mb-4">Watch full video to get 30 Points.</p>
                        <div className="flex items-center space-x-2 text-sm text-green-200 bg-green-950 p-3 rounded-lg border border-green-800">
                            <Info className="w-4 h-4" />
                            <span>Verified Ad Network</span>
                        </div>
                    </div>
                </div>
             )}
        </div>
    );
};

// --- INVITE PAGE ---
export const InvitePage: React.FC = () => {
    const { state } = useUser();
    
    const copyCode = () => {
        navigator.clipboard.writeText(state.referralCode);
        toast.success('Code copied to clipboard!');
    };

    return (
        <div className="p-6 h-full flex flex-col items-center">
            <div className="w-full max-w-sm text-center mt-4">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Friends" className="w-32 h-32 mx-auto mb-6 drop-shadow-2xl" />
                <h2 className="text-3xl font-bold text-white mb-2">Refer & Earn</h2>
                <p className="text-green-300 mb-8">Share your code and earn <span className="text-yellow-400 font-bold">500 points</span>!</p>

                <div className="bg-green-900 border border-green-700 rounded-xl p-6 relative overflow-hidden group">
                    <p className="text-sm text-green-400 mb-2 uppercase tracking-wider font-bold">Your Referral Code</p>
                    <div className="flex items-center justify-center space-x-3 mb-2">
                        <span className="text-3xl font-mono font-bold text-white tracking-widest">{state.referralCode}</span>
                    </div>
                    <button onClick={copyCode} className="mt-4 w-full bg-green-800 hover:bg-green-700 py-3 rounded-lg text-white font-bold flex items-center justify-center transition-colors">
                        <Copy className="w-4 h-4 mr-2" /> Tap to Copy
                    </button>
                </div>

                <div className="mt-8 space-y-4">
                    <div className="flex items-center p-4 bg-green-900/50 rounded-lg border border-green-700/50">
                        <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center mr-4"><Check className="w-4 h-4 text-yellow-500" /></div>
                        <div className="text-left"><p className="text-white font-bold">You Earn</p><p className="text-xs text-green-400">Get 500 points per invite</p></div>
                    </div>
                </div>
            </div>
        </div>
    );
};