import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import CloseButton from './CloseButton';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt' | 'status'> | Task) => void;
  task: Task | null;
  origin?: { originType: 'chat', originId: string, originName: string };
}

const colors = ['#fecaca', '#fed7aa', '#fef08a', '#d9f99d', '#bfdbfe', '#e9d5ff']; // red, orange, yellow, green, blue, purple

const TaskFormModal: React.FC<TaskFormModalProps> = ({ isOpen, onClose, onSave, task, origin }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [color, setColor] = useState(colors[0]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (task) {
        setTitle(task.title);
        setDescription(task.description || '');
        // Format for datetime-local input which needs YYYY-MM-DDTHH:mm
        setScheduledAt(new Date(task.scheduledAt).toISOString().slice(0, 16));
        setColor(task.color);
      } else {
        // Default to 1 hour from now
        const defaultDate = new Date(Date.now() + 60 * 60 * 1000);
        setScheduledAt(new Date(defaultDate.getTime() - (defaultDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16));
        setTitle('');
        setDescription('');
        setColor(colors[Math.floor(Math.random() * colors.length)]);
      }
      setError('');
    }
  }, [task, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(scheduledAt) < new Date()) {
      setError(t('tasks.form.error.past'));
      return;
    }
    
    const taskData = {
      title,
      description,
      scheduledAt: new Date(scheduledAt).toISOString(),
      color,
      originType: (origin?.originType || 'manual') as 'chat' | 'manual',
      originId: origin?.originId,
      originName: origin?.originName,
    };

    if (task) {
        onSave({ ...task, ...taskData });
    } else {
        onSave(taskData as Omit<Task, 'id' | 'createdAt' | 'status'>);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 dark:bg-black dark:bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 m-4 max-w-lg w-full">
        <CloseButton onClose={onClose} className="absolute top-4 right-4" />
        <h2 className="text-2xl font-bold mb-6 dark:text-gray-100">
          {task ? t('tasks.editTask') : t('tasks.newTask')}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('tasks.form.title')}</label>
              <input type="text" name="title" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('tasks.form.description')}</label>
              <textarea name="description" id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label htmlFor="scheduledAt" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('tasks.form.scheduledAt')}</label>
              <input type="datetime-local" name="scheduledAt" id="scheduledAt" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('tasks.form.color')}</label>
              <div className="mt-2 flex space-x-2">
                {colors.map(c => (
                  <button type="button" key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full focus:outline-none ring-2 ring-offset-2 dark:ring-offset-gray-800 ${color === c ? 'ring-green-500' : 'ring-transparent'}`} style={{ backgroundColor: c }} aria-label={`Color ${c}`}></button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="bg-white dark:bg-gray-600 py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none">{t('clientForm.cancel')}</button>
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none">{t('tasks.form.save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskFormModal;