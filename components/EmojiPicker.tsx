import React, { useState, useEffect, useRef } from 'react';
import CloseButton from './CloseButton';

interface EmojiPickerProps {
    onEmojiSelect: (emoji: string) => void;
    onClose: () => void;
}

const emojiData = {
    'Smileys & Emotion': ['😀', '😂', '😍', '😊', '🤔', '😴', '😭', '😠', '👍', '❤️'],
    'People & Body': ['👋', '👨‍💻', '👩‍🔬', '🧑‍🎨', '🏃‍♀️', '💪', '👀', '🧠', '🙏'],
    'Animals & Nature': ['🐶', '🐱', '🌍', '🌸', '☀️', '🔥', '💧', '🎉', '✨'],
    'Food & Drink': ['🍎', '🍔', '🍕', '☕️', '🍺', '🎂'],
    'Objects': ['💻', '📱', '💡', '💰', '🔑', '⚙️', '📈'],
};

type Category = keyof typeof emojiData;

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, onClose }) => {
    const [activeCategory, setActiveCategory] = useState<Category>('Smileys & Emotion');
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div ref={pickerRef} className="absolute bottom-full mb-2 w-full max-w-sm h-72 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col z-20"
            style={{ bottom: 'calc(100% + 8px)', right: '8px' }}
            role="dialog"
            aria-label="Emoji picker"
        >
            <CloseButton onClose={onClose} className="absolute top-1 right-1 p-1" iconClassName="w-4 h-4" />
            <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 p-2 mt-6">
                <div className="flex justify-around">
                    {Object.keys(emojiData).map((category, index) => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category as Category)}
                            className={`p-2 rounded-full text-xl transition-colors ${activeCategory === category ? 'bg-gray-200 dark:bg-gray-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            aria-label={category}
                            aria-pressed={activeCategory === category}
                        >
                           {['😀', '👋', '🐶', '🍎', '💻'][index]}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
                 <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">{activeCategory}</h3>
                <div className="grid grid-cols-8 gap-1">
                    {emojiData[activeCategory].map(emoji => (
                        <button
                            key={emoji}
                            onClick={() => onEmojiSelect(emoji)}
                            className="text-2xl rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 aspect-square flex items-center justify-center"
                            aria-label={`Select emoji: ${emoji}`}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EmojiPicker;