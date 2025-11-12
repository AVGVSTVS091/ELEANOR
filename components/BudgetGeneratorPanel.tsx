import React, { useEffect, useState } from 'react';
import CloseButton from './CloseButton';

interface BudgetGeneratorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const BudgetGeneratorPanel: React.FC<BudgetGeneratorPanelProps> = ({ isOpen, onClose, children }) => {
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  if (!shouldRender) {
    return null;
  }

  return (
    <div className={`md:hidden fixed inset-0 z-40 pointer-events-none`}>
      {/* Panel */}
      <div className={`pointer-events-auto absolute bottom-0 left-0 right-0 max-h-[70vh] bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="relative">
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto my-3 cursor-pointer flex-shrink-0" onClick={onClose}></div>
            <CloseButton onClose={onClose} className="absolute top-1 right-2" />
        </div>
        <div className="flex-1 overflow-y-auto">
            {children}
        </div>
      </div>
    </div>
  );
};

export default BudgetGeneratorPanel;