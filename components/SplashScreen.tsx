import React from 'react';

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-[100]">
      <img
        src="/assets/aguai/logo.png"
        alt="AGUAI Logo"
        className="w-48 h-48 md:w-64 md:h-64 animate-logo-in"
      />
    </div>
  );
};

export default SplashScreen;