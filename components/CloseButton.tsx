import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { XMarkIcon } from './Icons';

interface CloseButtonProps {
  onClose: () => void;
  className?: string;
  ariaLabel?: string;
  iconClassName?: string;
}

const CloseButton: React.FC<CloseButtonProps> = ({ onClose, className = '', ariaLabel, iconClassName = 'w-6 h-6' }) => {
  const { t } = useTranslation();
  const label = ariaLabel || t('common.close');

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 ${
        className.includes('text-') ? '' : 'text-gray-500 dark:text-gray-400'
      } ${
        className.includes('bg-') ? '' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
      } ${className}`}
      aria-label={label}
      title={label}
    >
      <XMarkIcon className={iconClassName} />
    </button>
  );
};

export default CloseButton;