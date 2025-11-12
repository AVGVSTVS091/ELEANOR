import React, { useEffect, useRef } from 'react';

interface Action {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  actions: Action[];
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ isOpen, position, actions, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white dark:bg-gray-800 rounded-md shadow-2xl border border-gray-200 dark:border-gray-700 py-2 w-56"
      style={{ top: position.y, left: position.x }}
    >
      <ul>
        {actions.map((action, index) => (
          <li key={index}>
            <button
              onClick={() => {
                action.onClick();
                onClose();
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <span className="mr-3 w-5 h-5">{action.icon}</span>
              <span>{action.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ContextMenu;