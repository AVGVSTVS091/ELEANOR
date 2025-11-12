import React, { useState, useEffect, useCallback } from 'react';
import { Client, Note } from '../types';
import { useTranslation } from '../hooks/useTranslation';

interface NotesSectionProps {
  client: Client;
  updateClient: (id: string, data: Partial<Client>) => void;
}

// Debounce hook
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

const NotesSection: React.FC<NotesSectionProps> = ({ client, updateClient }) => {
  const { t } = useTranslation();
  const note = client.notes && client.notes.length > 0 ? client.notes[0] : { id: crypto.randomUUID(), content: '', lastUpdated: new Date().toISOString() };
  const [text, setText] = useState(note.content);
  const debouncedText = useDebounce(text, 500);

  useEffect(() => {
    if (debouncedText !== note.content) {
      const updatedNote: Note = {
        ...note,
        content: debouncedText,
        lastUpdated: new Date().toISOString(),
      };
      updateClient(client.id, { notes: [updatedNote] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedText, client.id, updateClient]);
  
  const lastUpdatedDate = new Date(note.lastUpdated);

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('notes.placeholder')}
        className="w-full h-32 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      ></textarea>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
        {t('notes.lastSaved', { date: lastUpdatedDate.toLocaleString() })}
      </p>
    </div>
  );
};

export default NotesSection;