import React from 'react';

// AdMob Configuration
const AD_CONFIG = {
    bannerId: "ca-app-pub-9513607309342670/2319634741"
};

export const AdBanner: React.FC = () => {
  return (
    <div className="w-full bg-green-950 border-t border-green-800 flex justify-center items-center overflow-hidden h-[50px] relative z-0">
      <div className="text-[10px] text-green-600 border border-green-800 px-4 py-1 rounded bg-green-900/50 select-none">
        <span className="font-bold text-green-500">AdMob Banner</span>
        <span className="block text-[9px] opacity-50">{AD_CONFIG.bannerId}</span>
      </div>
    </div>
  );
};