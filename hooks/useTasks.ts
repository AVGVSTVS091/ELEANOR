import { useState, useEffect, useCallback, useRef } from 'react';
import { Task } from '../types';

const TASKS_STORAGE_KEY = 'crm_tasks';

const getTasksFromStorage = (): Task[] => {
    try {
        const item = window.localStorage.getItem(TASKS_STORAGE_KEY);
        return item ? JSON.parse(item) : [];
    } catch (error) {
        console.error('Error reading tasks from localStorage', error);
        return [];
    }
}

export const useTasks = () => {
    const [tasks, setTasks] = useState<Task[]>(getTasksFromStorage);
    const notificationTimeoutsRef = useRef<Map<string, number>>(new Map());

    const cancelNotification = useCallback((taskId: string) => {
        const timeoutId = notificationTimeoutsRef.current.get(taskId);
        if (timeoutId) {
            clearTimeout(timeoutId);
            notificationTimeoutsRef.current.delete(taskId);
            console.log(`Cancelled scheduled notification for task: ${taskId}`);
        }
    }, []);

    const scheduleNotification = useCallback((task: Task): number | undefined => {
        const delay = new Date(task.scheduledAt).getTime() - Date.now();
        if (delay > 0) {
            const timeoutId = window.setTimeout(() => {
                console.log(`NOTIFICATION DUE: ${task.title} (ID: ${task.id})`);
                // In a real app, this would trigger a system notification.
                // The user's request was to ensure cancellation works.
            }, delay);
            notificationTimeoutsRef.current.set(task.id, timeoutId);
            return timeoutId;
        }
        return undefined;
    }, []);
    
    // Effect to schedule notifications for existing tasks on initial load
    useEffect(() => {
        const existingTasks = getTasksFromStorage();
        existingTasks.forEach(task => {
            if (task.status === 'pending') {
                scheduleNotification(task);
            }
        });
        
        // Cleanup on unmount
        return () => {
            notificationTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
        };
    }, [scheduleNotification]);


    useEffect(() => {
        try {
            window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
        } catch (error) {
            console.error('Error writing tasks to localStorage', error);
        }
    }, [tasks]);

    const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt' | 'status'>) => {
        const newTask: Task = {
            ...taskData,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            status: 'pending',
        };
        
        const notificationId = scheduleNotification(newTask);
        if (notificationId) {
            newTask.notificationId = notificationId;
        }

        setTasks(prev => [...prev, newTask]);
        // Analytics Event
        console.log('Analytics: task_created', { id: newTask.id, originType: newTask.originType });
        return newTask;
    }, [scheduleNotification]);

    const updateTask = useCallback((id: string, updatedData: Partial<Omit<Task, 'id'>>) => {
        setTasks(prev => prev.map(task => {
            if (task.id === id) {
                const updatedTask = { ...task, ...updatedData };
                
                // If date changed, reschedule notification
                if (updatedData.scheduledAt && updatedData.scheduledAt !== task.scheduledAt) {
                    cancelNotification(task.id);
                    const newNotificationId = scheduleNotification(updatedTask);
                    if (newNotificationId) {
                        updatedTask.notificationId = newNotificationId;
                    } else {
                        delete updatedTask.notificationId;
                    }
                }
                
                // If status changed to completed, cancel notification
                if (updatedData.status === 'completed' && task.status === 'pending') {
                    cancelNotification(task.id);
                    // Analytics Event
                    console.log('Analytics: task_completed', { id: task.id, originType: task.originType });
                }

                return updatedTask;
            }
            return task;
        }));
    }, [cancelNotification, scheduleNotification]);

    const deleteTask = useCallback((id: string) => {
        const taskToDelete = tasks.find(t => t.id === id);
        if (taskToDelete) {
            try {
                cancelNotification(id);
                // Analytics Event
                console.log('Analytics: task_deleted', { id: taskToDelete.id, originType: taskToDelete.originType });
            } catch (error) {
                console.warn(`Failed to cancel notification for task ${id}`, error);
            }
        } else {
             console.warn(`Task with id ${id} not found for deletion.`);
        }
        setTasks(prev => prev.filter(task => task.id !== id));
    }, [tasks, cancelNotification]);
    
    const deleteMultipleTasks = useCallback((ids: string[]) => {
        const idSet = new Set(ids);
        ids.forEach(id => {
            const taskToDelete = tasks.find(t => t.id === id);
             if (taskToDelete) {
                try {
                    cancelNotification(id);
                    // Analytics Event
                    console.log('Analytics: task_deleted', { id: taskToDelete.id, originType: taskToDelete.originType });
                } catch (error) {
                    console.warn(`Failed to cancel notification for task ${id}`, error);
                }
            }
        });
        setTasks(prev => prev.filter(task => !idSet.has(task.id)));
    }, [tasks, cancelNotification]);

    return { tasks, addTask, updateTask, deleteTask, deleteMultipleTasks };
}