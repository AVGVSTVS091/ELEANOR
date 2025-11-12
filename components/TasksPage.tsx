

import React, { useState, useMemo, useEffect } from 'react';
import { Task } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { PlusCircleIcon, CheckIcon, CalendarIcon, TrashIcon, ChatBubbleIcon, XMarkIcon, RestoreIcon } from './Icons';
import { useLongPress } from '../hooks/useLongPress';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface TasksPageProps {
  tasks: Task[];
  onNewTask: () => void;
  onUpdateTask: (id: string, data: Partial<Omit<Task, 'id'>>) => void;
  onDeleteTask: (id: string) => void;
  onDeleteMultipleTasks: (ids: string[]) => void;
  onRescheduleTask: (task: Task) => void;
  onNavigateToChat: (chatId: string) => void;
}

const TaskListItem: React.FC<{ 
    task: Task; 
    onComplete: (id: string) => void; 
    onRestore?: (id: string) => void;
    onReschedule: (task: Task) => void; 
    onDelete: (id: string) => void; 
    onNavigateToChat: (chatId: string) => void;
    isSelectionMode?: boolean;
    isSelected?: boolean;
    onToggleSelection?: (id: string) => void;
    onLongPressSelection?: (id: string) => void;
}> = ({ task, onComplete, onRestore, onReschedule, onDelete, onNavigateToChat, isSelectionMode, isSelected, onToggleSelection, onLongPressSelection }) => {
    const { t } = useTranslation();
    const [isCompleting, setIsCompleting] = useState(false);
    const isOverdue = new Date(task.scheduledAt) < new Date() && task.status === 'pending';

    const handleComplete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsCompleting(true);
        setTimeout(() => onComplete(task.id), 300);
    }
    
    const handleItemClick = () => {
        if (isSelectionMode && onToggleSelection) {
            onToggleSelection(task.id);
        } else {
            onReschedule(task); 
        }
    }

    const longPressHandlers = useLongPress(
        (e) => {
            if (onLongPressSelection) onLongPressSelection(task.id);
        },
        handleItemClick,
        { delay: 500 }
    );
    
    return (
        <li 
            {...longPressHandlers}
            className={`p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-start gap-4 transition-all duration-300 cursor-pointer ${isCompleting ? 'bg-green-100 dark:bg-green-900 opacity-0' : ''} ${isSelected ? 'bg-sky-50 dark:bg-sky-900/50' : ''}`} 
            style={{ borderLeft: `5px solid ${task.color}`}}
        >
            {isSelectionMode && (
                <div className="mt-1">
                    <input type="checkbox" checked={isSelected} readOnly className="w-5 h-5 text-green-600 rounded focus:ring-green-500" />
                </div>
            )}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <p className={`font-semibold text-gray-800 dark:text-gray-100 truncate ${task.status === 'completed' ? 'line-through text-gray-500 dark:text-gray-500' : ''}`}>{task.title}</p>
                    {task.originType === 'chat' && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            <ChatBubbleIcon className="w-3 h-3 mr-1" />
                            Chat
                        </span>
                    )}
                </div>
                <p className={`text-sm text-gray-600 dark:text-gray-400 mt-1 truncate ${task.status === 'completed' ? 'line-through' : ''}`}>{task.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        <span className={isOverdue ? 'font-bold text-red-500' : ''}>
                            {new Date(task.scheduledAt).toLocaleString()}
                        </span>
                    </div>
                    {task.originName && (
                        <button onClick={(e) => { e.stopPropagation(); if (task.originId) onNavigateToChat(task.originId); }} className="hover:underline truncate max-w-[150px]">
                            {t('tasks.chatOrigin', { name: task.originName })}
                        </button>
                    )}
                </div>
            </div>
            
            {!isSelectionMode && (
                <div className="flex flex-col gap-2">
                    {task.status === 'pending' ? (
                        <button onClick={handleComplete} className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors" title={t('tasks.actions.complete')}>
                            <CheckIcon className="w-5 h-5" />
                        </button>
                    ) : (
                        <button onClick={(e) => { e.stopPropagation(); onRestore?.(task.id); }} className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors" title="Restore">
                            <RestoreIcon className="w-5 h-5" />
                        </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors" title={t('tasks.actions.delete')}>
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            )}
        </li>
    );
};

const TasksPage: React.FC<TasksPageProps> = ({ tasks, onNewTask, onUpdateTask, onDeleteTask, onDeleteMultipleTasks, onRescheduleTask, onNavigateToChat }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    const filteredTasks = useMemo(() => {
        return tasks
            .filter(t => t.status === activeTab)
            .sort((a, b) => {
                if (activeTab === 'pending') {
                    return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
                } else {
                    return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(); // Completed recent first
                }
            });
    }, [tasks, activeTab]);

    const handleToggleSelection = (id: string) => {
        setSelectedTaskIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleLongPressSelection = (id: string) => {
        if (!selectionMode) {
            setSelectionMode(true);
            setSelectedTaskIds(new Set([id]));
        } else {
            handleToggleSelection(id);
        }
    };

    const exitSelectionMode = () => {
        setSelectionMode(false);
        setSelectedTaskIds(new Set());
    };

    const handleDeleteSelected = () => {
        setIsDeleteConfirmOpen(true);
    };

    const confirmDeleteSelected = () => {
        onDeleteMultipleTasks(Array.from(selectedTaskIds));
        exitSelectionMode();
        setIsDeleteConfirmOpen(false);
    };

    return (
        <div className="flex flex-col h-full w-full bg-gray-50 dark:bg-gray-900 relative">
            {selectionMode ? (
                <div className="bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between animate-fade-in">
                    <div className="flex items-center gap-4">
                        <button onClick={exitSelectionMode} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                            <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                        </button>
                        <span className="font-semibold text-lg dark:text-white">{selectedTaskIds.size} {t('tasks.selected')}</span>
                    </div>
                    {selectedTaskIds.size > 0 && (
                        <button onClick={handleDeleteSelected} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full" title={t('tasks.actions.delete')}>
                            <TrashIcon className="w-6 h-6" />
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold dark:text-gray-100">{t('tasks.title')}</h2>
                    {activeTab === 'pending' && (
                        <button onClick={onNewTask} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-sm transition-colors">
                            <PlusCircleIcon className="w-5 h-5" />
                            <span className="hidden sm:inline">{t('tasks.newTask')}</span>
                        </button>
                    )}
                </div>
            )}

            {!selectionMode && (
                <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <button 
                        onClick={() => setActiveTab('pending')} 
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'pending' ? 'border-green-500 text-green-600 dark:text-green-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                    >
                        {t('tasks.pending')}
                    </button>
                    <button 
                        onClick={() => setActiveTab('completed')} 
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'completed' ? 'border-green-500 text-green-600 dark:text-green-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                    >
                        {t('tasks.completed')}
                    </button>
                </div>
            )}

            <div className="flex-1 overflow-y-auto">
                {filteredTasks.length > 0 ? (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700 pb-20">
                        {filteredTasks.map(task => (
                            <TaskListItem 
                                key={task.id} 
                                task={task} 
                                onComplete={(id) => onUpdateTask(id, { status: 'completed' })} 
                                onRestore={(id) => onUpdateTask(id, { status: 'pending' })}
                                onReschedule={onRescheduleTask}
                                onDelete={onDeleteTask}
                                onNavigateToChat={onNavigateToChat}
                                isSelectionMode={selectionMode}
                                isSelected={selectedTaskIds.has(task.id)}
                                onToggleSelection={handleToggleSelection}
                                onLongPressSelection={handleLongPressSelection}
                            />
                        ))}
                    </ul>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-4">
                            <CheckIcon className="w-8 h-8 text-green-500" />
                        </div>
                        <p className="text-lg font-medium">{activeTab === 'pending' ? t('tasks.noPending') : t('tasks.noCompleted')}</p>
                    </div>
                )}
            </div>

            <DeleteConfirmationModal 
                isOpen={isDeleteConfirmOpen}
                count={selectedTaskIds.size}
                onConfirm={confirmDeleteSelected}
                onCancel={() => setIsDeleteConfirmOpen(false)}
            />
        </div>
    );
};

export default TasksPage;