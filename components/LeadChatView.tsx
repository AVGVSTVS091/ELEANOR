

import React, { useState, useRef, DragEvent, useEffect, useCallback, KeyboardEvent, useMemo } from 'react';
import { Client, Lead, Budget, Task, ConversationStatus } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { correctGrammar } from '../services/geminiService';
import { ChevronLeftIcon, DocumentTextIcon, PencilIcon, AddressBookPlusIcon, CheckIcon, XMarkIcon, PaperClipIcon, PaperAirplaneIcon, DocumentIcon, CameraIcon, UploadIcon, EmojiIcon, BrainIcon, UndoIcon, MicrophoneIcon, LockClosedIcon, TrashIcon, StopIcon, PlayIcon, PauseIcon, CalendarIcon, TaskIcon, CurrencyDollarIcon, EllipsisHorizontalIcon, CheckDoubleIcon } from './Icons';
import EmojiPicker from './EmojiPicker';
import SourceChooserModal from './SourceChooserModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import SaleModal from './SaleModal';
import { useSales } from '../hooks/useSales';
import { useSettings } from '../hooks/useSettings';

interface ChatViewProps {
  contact: Client | Lead;
  tasks: Task[];
  onOpenTaskEditor: (task: Task) => void;
  onBack: () => void;
  onGenerateBudget: (contact: Client | Lead) => void;
  onUpdateLeadName?: (leadId: string, newName: string) => void;
  onSaveToContacts?: (lead: Lead) => void;
  sharedBudget: Omit<Budget, 'id'> | null;
  onClearSharedBudget: () => void;
  onAddTask: (contact: Client | Lead) => void;
  updateTask: (id: string, data: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  onUpdateStatus: (id: string, status: ConversationStatus) => void;
  onQuickAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'status'>) => void;
}

const isLead = (contact: Client | Lead): contact is Lead => {
    return 'lastMessage' in contact;
}

type MessageStatus = 'sent' | 'delivered' | 'read';

type Message =
    | { type: 'text'; sender: 'user' | 'bot'; text: string; id: number; status?: MessageStatus }
    | { type: 'budget'; sender: 'user'; budget: Omit<Budget, 'id'>; id: number; status?: MessageStatus }
    | { type: 'audio'; sender: 'user'; audio: { url: string; duration: number }; id: number; status?: MessageStatus };

const formatDuration = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
};

const TaskItem: React.FC<{ task: Task; updateTask: (id: string, data: Partial<Task>) => void; onDelete: () => void; onEdit: () => void }> = ({ task, updateTask, onDelete, onEdit }) => {
    const { t } = useTranslation();
    const isOverdue = new Date(task.scheduledAt) < new Date();
    const displayColor = isOverdue ? '#ef4444' : task.color;
    const statusLabel = isOverdue ? t('tasks.notification.overdue', { title: '' }) : t('tasks.pending');

    const handleComplete = () => {
        updateTask(task.id, { status: 'completed' });
    };

    return (
        <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-md border-l-4 shadow-sm" style={{ borderLeftColor: displayColor }}>
            <div className="flex-1 min-w-0 pr-2">
                <p className="text-xs font-bold mb-0.5" style={{ color: displayColor }}>{statusLabel}</p>
                <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{task.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(task.scheduledAt).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={handleComplete} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-400 hover:text-green-500 transition-colors" aria-label={t('tasks.actions.complete')}>
                    <div className="w-5 h-5 border-2 border-current rounded-sm flex items-center justify-center">
                        <CheckIcon className="w-4 h-4 opacity-0 hover:opacity-100 transition-opacity" />
                    </div>
                </button>
                <button onClick={onEdit} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400" aria-label={t('tasks.actions.reschedule')}>
                    <CalendarIcon className="w-5 h-5" />
                </button>
                <button onClick={onDelete} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 hover:text-red-500" aria-label={t('tasks.actions.delete')}>
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

const AudioMessagePlayer: React.FC<{ audio: { url: string; duration: number } }> = ({ audio }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };
    
    useEffect(() => {
        const audioElement = audioRef.current;
        if (!audioElement) return;

        const handleTimeUpdate = () => {
            if(audioElement.duration > 0) {
               setProgress((audioElement.currentTime / audioElement.duration) * 100);
            }
        };
        const handleEnded = () => {
            setIsPlaying(false);
            setProgress(0);
        };

        audioElement.addEventListener('timeupdate', handleTimeUpdate);
        audioElement.addEventListener('ended', handleEnded);
        return () => {
            audioElement.removeEventListener('timeupdate', handleTimeUpdate);
            audioElement.removeEventListener('ended', handleEnded);
        };
    }, []);

    return (
        <div className="flex items-center gap-2 w-48 text-white">
             <audio ref={audioRef} src={audio.url} preload="metadata" />
            <button onClick={togglePlay} className="p-2 rounded-full bg-white/20 text-white flex-shrink-0">
                {isPlaying ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
            </button>
            <div className="flex-1 h-1 bg-white/30 rounded-full">
                <div className="h-1 bg-white rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="text-xs w-10 text-center">{formatDuration(audio.duration)}</span>
        </div>
    )
}

const ReadReceipt: React.FC<{ status?: MessageStatus }> = ({ status }) => {
    if (!status) return null;
    const isRead = status === 'read';
    const Icon = status === 'sent' ? CheckIcon : CheckDoubleIcon;
    return (
        <Icon className={`w-4 h-4 ${isRead ? 'text-blue-400' : 'text-white/70'}`} />
    );
};

const ChatView: React.FC<ChatViewProps> = ({ contact, tasks, onOpenTaskEditor, onBack, onGenerateBudget, onUpdateLeadName, onSaveToContacts, sharedBudget, onClearSharedBudget, onAddTask, updateTask, deleteTask, onUpdateStatus, onQuickAddTask }) => {
  const { t, language } = useTranslation();
  const { settings, playNotificationSound } = useSettings();
  const contactIsLead = isLead(contact);
  const contactName = contactIsLead ? contact.name : (contact as Client).companyName;
  const { addSale } = useSales();
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(contactName);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messageIdCounter = useRef(Date.now());
  
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const attachmentButtonRef = useRef<HTMLButtonElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const camInputRef = useRef<HTMLInputElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const [isSending, setIsSending] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [undoState, setUndoState] = useState<{ originalText: string; originalSelection: { start: number; end: number } } | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [attachedBudget, setAttachedBudget] = useState<Omit<Budget, 'id'> | null>(null);
  const [ariaLiveMessage, setAriaLiveMessage] = useState('');
  const [isEmojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [sourceChooser, setSourceChooser] = useState<{ open: boolean; type: 'document' | 'image' | null }>({ open: false, type: null });
  const [isTaskPanelOpen, setIsTaskPanelOpen] = useState(true);
  const [deleteConfirmTask, setDeleteConfirmTask] = useState<Task | null>(null);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  
  // Task Menu & Quick Task
  const [isTaskMenuOpen, setIsTaskMenuOpen] = useState(false);
  const taskMenuRef = useRef<HTMLDivElement>(null);
  const taskMenuButtonRef = useRef<HTMLButtonElement>(null);
  const [isQuickTaskOpen, setIsQuickTaskOpen] = useState(false);
  const [quickTaskType, setQuickTaskType] = useState(t('quickTask.followUp'));
  const [quickTaskDate, setQuickTaskDate] = useState('');

  // --- Voice Recording State ---
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingLocked, setIsRecordingLocked] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<{ url: string; blob: Blob; duration: number } | null>(null);
  const [gestureState, setGestureState] = useState<'idle' | 'recording' | 'locking' | 'cancelling'>('idle');
  const [cancelProgress, setCancelProgress] = useState(0);
  const [trashIconLeft, setTrashIconLeft] = useState(16);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialGesturePosRef = useRef<{ x: number, y: number } | null>(null);
  const micButtonRef = useRef<HTMLButtonElement>(null);
  const micButtonRectRef = useRef<DOMRect | null>(null);
  const discardTargetXRef = useRef(0);
  const stopActionRef = useRef<'send' | 'preview'>('preview');
  const recordingStartTimeRef = useRef(0);
  const wasDiscardedRef = useRef(false);
  
  const gestureStateRef = useRef(gestureState);
  useEffect(() => { gestureStateRef.current = gestureState; }, [gestureState]);
  const isRecordingLockedRef = useRef(isRecordingLocked);
  useEffect(() => { isRecordingLockedRef.current = isRecordingLocked; }, [isRecordingLocked]);
  const isRecordingRef = useRef(isRecording);
  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);
  const cancelProgressRef = useRef(cancelProgress);
  useEffect(() => { cancelProgressRef.current = cancelProgress; }, [cancelProgress]);

  // Overflow Menu State
  const [isOverflowMenuOpen, setOverflowMenuOpen] = useState(false);
  const overflowMenuRef = useRef<HTMLDivElement>(null);
  const overflowButtonRef = useRef<HTMLButtonElement>(null);

  const chatTasks = useMemo(() => {
    return tasks
        .filter(t => t.originId === contact.id && t.status === 'pending')
        .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  }, [tasks, contact.id]);

  const combinedItems = useMemo(() => {
    const chatMessages = messages.map(m => ({ ...m, timestamp: m.id, itemType: 'message' as const })); 
    return chatMessages.sort((a, b) => a.timestamp - b.timestamp);
  }, [messages]);

  const AudioPreviewPlayer: React.FC<{ audio: { url: string; duration: number }; onDiscard: () => void; }> = ({ audio, onDiscard }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);

    const togglePlay = (e: React.MouseEvent) => { e.stopPropagation(); if (audioRef.current) isPlaying ? audioRef.current.pause() : audioRef.current.play(); };

    useEffect(() => {
        const el = audioRef.current;
        if (!el) return;
        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onEnded = () => { setIsPlaying(false); setProgress(0); if (el) el.currentTime = 0; };
        const onTimeUpdate = () => { if (el && el.duration > 0) setProgress((el.currentTime / el.duration) * 100); };
        el.addEventListener('play', onPlay);
        el.addEventListener('pause', onPause);
        el.addEventListener('ended', onEnded);
        el.addEventListener('timeupdate', onTimeUpdate);
        return () => {
            el.removeEventListener('play', onPlay);
            el.removeEventListener('pause', onPause);
            el.removeEventListener('ended', onEnded);
            el.removeEventListener('timeupdate', onTimeUpdate);
        };
    }, []);

    return (
        <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-full flex-1 h-11">
            <audio ref={audioRef} src={audio.url} preload="metadata" />
            <button onClick={onDiscard} className="p-2 text-gray-500 hover:text-red-500 flex-shrink-0" aria-label="Discard recording"><TrashIcon className="w-5 h-5" /></button>
            <button onClick={togglePlay} className="p-2 text-sky-500 flex-shrink-0" aria-label={isPlaying ? "Pause" : "Play"}>{isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}</button>
            <div className="flex-1 h-1 bg-gray-300 dark:bg-gray-500 rounded-full cursor-pointer" onClick={(e) => {
                if (!audioRef.current) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const newTime = (clickX / rect.width) * audio.duration;
                audioRef.current.currentTime = newTime;
            }}>
                <div className="h-1 bg-sky-500 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-300 w-12 text-center flex-shrink-0">{formatDuration(audio.duration)}</span>
        </div>
    );
  };

  const playSoundCue = useCallback((type: 'start' | 'stop' | 'discard' | 'threshold') => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (!audioContext) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.type = 'sine';
        
        const cues = { 
          start: { freq: 880, gain: 0.05 },
          stop: { freq: 660, gain: 0.05 },
          discard: { freq: 440, gain: 0.08 },
          threshold: { freq: 1000, gain: 0.03 }
        };
        const cue = cues[type];

        oscillator.frequency.setValueAtTime(cue.freq, audioContext.currentTime);
        gainNode.gain.setValueAtTime(cue.gain, audioContext.currentTime);
        if (type === 'discard') {
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.15);
        }

        oscillator.start();
        oscillator.stop(audioContext.currentTime + (type === 'threshold' ? 0.05 : 0.15));
      } catch (e) {
        console.error("Could not play sound cue", e);
      }
  }, []);

  const stopAllRecordingProcesses = useCallback((wasDiscarded: boolean, fromUnmount = false) => {
    wasDiscardedRef.current = wasDiscarded;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    durationIntervalRef.current = null;
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    pressTimerRef.current = null;

    if (!fromUnmount) {
      if (wasDiscarded) setAriaLiveMessage('Recording discarded');
      else setAriaLiveMessage('Recording stopped');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (!isRecordingRef.current) return;
    playSoundCue('stop');
    if (navigator.vibrate) navigator.vibrate(20);
    stopAllRecordingProcesses(false);
  }, [playSoundCue, stopAllRecordingProcesses]);
  
  const cancelRecording = useCallback((fromUnmount = false) => {
    if (!isRecordingRef.current) return;
    playSoundCue('discard');
    if (navigator.vibrate) navigator.vibrate(50);
    stopAllRecordingProcesses(true, fromUnmount);
  }, [playSoundCue, stopAllRecordingProcesses]);
  
  const sendAudioMessage = useCallback((audioData: { url: string; blob: Blob; duration: number }) => {
    const newMessage: Message = { 
        type: 'audio', 
        sender: 'user', 
        audio: { url: audioData.url, duration: audioData.duration }, 
        id: messageIdCounter.current++,
        status: 'sent'
    };
    setMessages(prev => [...prev, newMessage]);
    
    // UI feedback
    setIsSending(true);
    const micButtonContainer = micButtonRef.current?.parentElement;
    if (micButtonContainer) {
        micButtonContainer.classList.add('animate-send-flash');
        setTimeout(() => {
            micButtonContainer.classList.remove('animate-send-flash');
            setIsSending(false);
        }, 300);
    } else {
        setIsSending(false);
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
        if (navigator.vibrate) navigator.vibrate(50);
        playSoundCue('start');
        setAriaLiveMessage('Recording started');

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = event => audioChunksRef.current.push(event.data);
        
        recorder.onstop = (event) => {
            stream.getTracks().forEach(track => track.stop());
            const finalDuration = (performance.now() - recordingStartTimeRef.current) / 1000;
            
            if (audioChunksRef.current.length > 0 && !wasDiscardedRef.current) {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                if (finalDuration > 0.5) {
                   const audioUrl = URL.createObjectURL(audioBlob);
                   const audioData = { url: audioUrl, blob: audioBlob, duration: finalDuration };
                   if (stopActionRef.current === 'send') {
                       sendAudioMessage(audioData);
                   } else {
                       setRecordedAudio(audioData);
                   }
                }
            }
            
            audioChunksRef.current = [];
            wasDiscardedRef.current = false;
            setIsRecording(false);
            setIsRecordingLocked(false);
            setRecordingDuration(0);
            setGestureState('idle');
            setCancelProgress(0);
        };

        recorder.start();
        recordingStartTimeRef.current = performance.now();
        setIsRecording(true);
        setRecordingDuration(0);
        durationIntervalRef.current = setInterval(() => setRecordingDuration(p => p + 1), 1000);

    } catch (err) {
        console.error("Microphone access denied:", err);
        alert("Microphone access is required for voice messages.");
        cancelRecording();
    }
  }, [cancelRecording, playSoundCue, sendAudioMessage]);

  const handleGestureMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isRecordingRef.current || isRecordingLockedRef.current || !initialGesturePosRef.current || !micButtonRectRef.current) return;
    e.preventDefault();

    const currentX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const currentY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const startX = micButtonRectRef.current.left + micButtonRectRef.current.width / 2;
    const startY = micButtonRectRef.current.top + micButtonRectRef.current.height / 2;

    const deltaX = currentX - startX;
    const deltaY = currentY - startY;

    const lockThreshold = -(micButtonRectRef.current.height + 8);
    const discardDistance = startX - discardTargetXRef.current;
    
    let nextState: 'recording' | 'locking' | 'cancelling' = 'recording';

    if (deltaY < lockThreshold - 20) { // Add buffer
      nextState = 'locking';
    } else if (deltaX < -8) { // Deadzone
      nextState = 'cancelling';
    }

    if(nextState !== gestureStateRef.current) {
      if ((nextState === 'locking' || nextState === 'cancelling')) {
        playSoundCue('threshold');
        if (navigator.vibrate) navigator.vibrate(20);
      }
      setGestureState(nextState);
    }
    
    if (nextState === 'cancelling') {
      const progressRatio = (startX - currentX) / discardDistance;
      setCancelProgress(Math.max(0, Math.min(1, progressRatio)));
    } else {
      setCancelProgress(0);
    }
  }, [playSoundCue]);

  const handleGestureEnd = useCallback(() => {
    window.removeEventListener('mousemove', handleGestureMove);
    window.removeEventListener('touchmove', handleGestureMove);
    window.removeEventListener('mouseup', handleGestureEnd, { capture: true });
    window.removeEventListener('touchend', handleGestureEnd, { capture: true });

    if (!isRecordingRef.current) return;
    
    const finalGestureState = gestureStateRef.current;
    if (finalGestureState === 'locking') {
        setIsRecordingLocked(true);
        setGestureState('idle');
        setCancelProgress(0);
    } else if (finalGestureState === 'cancelling' && cancelProgressRef.current >= 1) {
        cancelRecording();
    } else {
        stopActionRef.current = 'preview';
        stopRecording();
    }
    initialGesturePosRef.current = null;
  }, [handleGestureMove, stopRecording, cancelRecording]);
  
  const handleGestureStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (('button' in e && e.button !== 0) || recordedAudio) return;
    
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    
    pressTimerRef.current = setTimeout(() => {
        e.preventDefault();
        micButtonRectRef.current = micButtonRef.current?.getBoundingClientRect() || null;
        if (!micButtonRectRef.current) return;
        
        const inputRowElement = micButtonRef.current?.closest('footer');
        const overlayRect = inputRowElement?.getBoundingClientRect();
        if (overlayRect) {
            const iconHitboxHalfWidth = 22;
            const minX = overlayRect.left + iconHitboxHalfWidth;
            const maxX = overlayRect.right - iconHitboxHalfWidth;
            const targetX = Math.max(minX, Math.min(76, maxX));
            discardTargetXRef.current = targetX;
            
            const iconWidth = 24;
            setTrashIconLeft(targetX - overlayRect.left - (iconWidth / 2));
        } else {
            discardTargetXRef.current = 76;
            setTrashIconLeft(76 - (24 / 2));
        }

        initialGesturePosRef.current = {
            x: 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX,
            y: 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY,
        };
        startRecording();
        
        window.addEventListener('mousemove', handleGestureMove);
        window.addEventListener('touchmove', handleGestureMove, { passive: false });
        window.addEventListener('mouseup', handleGestureEnd, { once: true, capture: true });
        window.addEventListener('touchend', handleGestureEnd, { once: true, capture: true });
    }, 500);
  }, [startRecording, handleGestureMove, handleGestureEnd, recordedAudio]);
  
  const handleRelease = useCallback(() => {
    if (pressTimerRef.current) { 
        clearTimeout(pressTimerRef.current);
        pressTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const initialMessages: Message[] = [
        ...(contactIsLead ? [{ type: 'text' as const, sender: 'bot' as const, text: (contact as Lead).lastMessage, id: 1 }] : []),
        { type: 'text' as const, sender: 'user' as const, text: 'Of course, I can prepare a budget for you right away.', id: 2, status: 'read' },
    ];
    setMessages(initialMessages);
  }, [contact.id, contactIsLead]);

  useEffect(() => {
    if (sharedBudget) {
        setAttachedBudget(sharedBudget);
        onClearSharedBudget();
    }
  }, [sharedBudget, onClearSharedBudget]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isRecordingRef.current) {
        cancelRecording(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (isRecordingRef.current) {
        cancelRecording(true);
      }
    };
  }, [cancelRecording]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        overflowMenuRef.current &&
        !overflowMenuRef.current.contains(event.target as Node) &&
        overflowButtonRef.current &&
        !overflowButtonRef.current.contains(event.target as Node)
      ) {
        setOverflowMenuOpen(false);
      }
      if (
        attachmentMenuRef.current &&
        !attachmentMenuRef.current.contains(event.target as Node) &&
        attachmentButtonRef.current &&
        !attachmentButtonRef.current.contains(event.target as Node)
      ) {
        setIsAttachmentMenuOpen(false);
      }
      if (
        taskMenuRef.current &&
        !taskMenuRef.current.contains(event.target as Node) &&
        taskMenuButtonRef.current &&
        !taskMenuButtonRef.current.contains(event.target as Node)
      ) {
        setIsTaskMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOverflowMenuOpen(false);
        setIsAttachmentMenuOpen(false);
        setIsTaskMenuOpen(false);
        setEmojiPickerOpen(false);
        setIsQuickTaskOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSaveName = () => {
    if (contactIsLead && onUpdateLeadName && editedName.trim() && editedName.trim() !== contact.name) {
      onUpdateLeadName(contact.id, editedName.trim());
    }
    setIsEditingName(false);
  };

  const handleCancelEditName = () => {
    setEditedName(contactName);
    setIsEditingName(false);
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) setAttachedFiles(prev => [...prev, ...Array.from(event.target.files!)]);
    event.target.value = '';
    setIsAttachmentMenuOpen(false);
  };

  const handleDrag = (e: DragEvent, over: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(over);
  };

  const handleDrop = (e: DragEvent) => {
    handleDrag(e, false);
    if (e.dataTransfer.files) setAttachedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
  };

  const handleSendMessage = () => {
      if (!message.trim() && attachedFiles.length === 0 && !attachedBudget && !recordedAudio) return;
      
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      setUndoState(null);

      setIsSending(true);
      
      const newMessages: Message[] = [];
      const newIds: number[] = [];

      const createMessage = (msg: 
        | { type: 'text'; sender: 'user' | 'bot'; text: string }
        | { type: 'budget'; sender: 'user'; budget: Omit<Budget, 'id'> }
        | { type: 'audio'; sender: 'user'; audio: { url: string; duration: number } }
      ): Message => {
          const id = messageIdCounter.current++;
          newIds.push(id);
          switch (msg.type) {
            case 'text':
                return { ...msg, id, status: 'sent' };
            case 'budget':
                return { ...msg, id, status: 'sent' };
            case 'audio':
                return { ...msg, id, status: 'sent' };
          }
      };
      
      if (message.trim()) newMessages.push(createMessage({ type: 'text', sender: 'user', text: message }));
      if (attachedBudget) newMessages.push(createMessage({ type: 'budget', sender: 'user', budget: attachedBudget }));
      if (recordedAudio) newMessages.push(createMessage({ type: 'audio', sender: 'user', audio: { url: recordedAudio.url, duration: recordedAudio.duration } }));

      if (newMessages.length > 0) {
        setMessages(prev => [...prev, ...newMessages]);
        
        // Simulate status updates for read receipts
        setTimeout(() => {
            setMessages(prev => prev.map(m => newIds.includes(m.id) ? { ...m, status: 'delivered' } : m));
        }, 1200);

        if (settings.readReceiptsEnabled) {
            setTimeout(() => {
                setMessages(prev => prev.map(m => newIds.includes(m.id) ? { ...m, status: 'read' } : m));
            }, 3500);
        }
      }
      
      setMessage('');
      setAttachedFiles([]);
      setAttachedBudget(null);
      setRecordedAudio(null);
      
      const sendButton = document.getElementById('send-button');
      sendButton?.classList.add('animate-send-flash');
      setTimeout(() => sendButton?.classList.remove('animate-send-flash'), 300);

      setTimeout(() => {
        setIsSending(false);
        // Simulate bot reply and play sound
        setTimeout(() => {
            const botReply: Message = { type: 'text', sender: 'bot', text: 'Thanks for your message. We will get back to you shortly.', id: messageIdCounter.current++ };
            setMessages(prev => [...prev, botReply]);
            playNotificationSound();
        }, 1500);
      }, 300);
  }

  const handleCorrectGrammar = async () => {
    if (!message.trim() || isCorrecting) return;

    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoState(null);

    setIsCorrecting(true);
    const originalText = message;
    const textarea = textareaRef.current;
    const originalSelection = textarea ? { start: textarea.selectionStart, end: textarea.selectionEnd } : { start: originalText.length, end: originalText.length };

    try {
        const correctedText = await correctGrammar(message, language);
        if (correctedText.toLowerCase() !== originalText.toLowerCase()) {
            setMessage(correctedText);
            setUndoState({ originalText, originalSelection });
            setAriaLiveMessage("Correction applied");

            undoTimerRef.current = setTimeout(() => {
                setUndoState(null);
            }, 30000);
        }
    } catch (e) {
        console.warn("Correction failed", e);
    } finally {
        setIsCorrecting(false);
    }
  };

  const handleUndo = () => {
    if (!undoState) return;
    setMessage(undoState.originalText);
    setUndoState(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

    setTimeout(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.focus();
            textarea.setSelectionRange(undoState.originalSelection.start, undoState.originalSelection.end);
        }
    }, 0);
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const newText = text.substring(0, start) + emoji + text.substring(end);
        setMessage(newText);
        
        setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
            textarea.focus();
        }, 0);
    }
  };
  
  const attachmentMenuActions = [
    { label: t('chat.attach.document'), icon: <DocumentIcon className="w-5 h-5"/>, action: () => { setIsAttachmentMenuOpen(false); setSourceChooser({ open: true, type: 'document' }) } },
    { label: t('chat.attach.image'), icon: <CameraIcon className="w-5 h-5"/>, action: () => { setIsAttachmentMenuOpen(false); setSourceChooser({ open: true, type: 'image' }) } },
  ];

  const removeAttachedFile = (indexToRemove: number) => {
    setAttachedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };
  
  const AttachedFilesPreview = () => {
      const [previewUrls, setPreviewUrls] = useState<string[]>([]);
      useEffect(() => {
          const urls = attachedFiles.map(file => URL.createObjectURL(file));
          setPreviewUrls(urls);
          return () => {
              urls.forEach(url => URL.revokeObjectURL(url));
          };
      }, [attachedFiles]);
      
      return (
        <div className="p-2 mb-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2 overflow-x-auto">
            {attachedFiles.map((file, index) => {
              const isImage = file.type.startsWith('image/');
              return (
                <div key={`${file.name}-${index}`} className="relative w-20 h-20 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                  {isImage && previewUrls[index] ? (
                    <img src={previewUrls[index]} alt={file.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-1">
                      <DocumentIcon className="w-8 h-8 mx-auto text-gray-500" />
                      <p className="text-xs text-gray-600 dark:text-gray-300 truncate mt-1">{file.name}</p>
                    </div>
                  )}
                  <button
                    onClick={() => removeAttachedFile(index)}
                    className="absolute -top-1 -right-1 bg-gray-800/60 text-white rounded-full p-0.5"
                    aria-label={`Remove ${file.name}`}
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )
  };

  const handleSaveQuickTask = () => {
      if (!quickTaskDate) return;
      onQuickAddTask({
          title: `${quickTaskType}: ${contactName}`,
          description: '',
          scheduledAt: new Date(quickTaskDate).toISOString(),
          color: '#fecaca', // Default color
          originType: 'chat',
          originId: contact.id,
          originName: contactName
      });
      setIsQuickTaskOpen(false);
      setIsTaskMenuOpen(false);
      setQuickTaskDate('');
  }
  
  const handleSaveSale = (saleData: { clientName: string; amount: number; date: string; invoiceRef: string }) => {
      addSale({
          ...saleData,
          originId: contact.id
      });
      alert(t('sale.success'));
  }

  const showSendButton = message.trim() || attachedFiles.length > 0 || attachedBudget || recordedAudio;

  const contactActions = useMemo(() => {
    const actions = [
        { id: 'sale', label: t('sale.register'), icon: <CurrencyDollarIcon className="w-6 h-6" />, action: () => setIsSaleModalOpen(true) },
        { id: 'task', label: t('tasks.newTask'), icon: <TaskIcon className="w-5 h-5" />, action: () => setIsTaskMenuOpen(prev => !prev) },
        { id: 'budget', label: t('budget.generatorTitle'), icon: <DocumentTextIcon className="w-5 h-5" />, action: () => onGenerateBudget(contact) },
    ];
    if (contactIsLead && onSaveToContacts) {
        actions.push({ id: 'saveContact', label: t('lead.saveToContacts'), icon: <AddressBookPlusIcon className="w-5 h-5" />, action: () => onSaveToContacts(contact as Lead) });
    }
    return actions;
  }, [contact, contactIsLead, onGenerateBudget, onSaveToContacts, t]);

  return (
    <div className="flex flex-col w-full h-full bg-white dark:bg-gray-900 relative" onDragEnter={(e) => handleDrag(e, true)}>
        <div className="sr-only" aria-live="polite" aria-atomic="true">{ariaLiveMessage}</div>
        <style>{`
            /* Webkit (Chrome, Safari, Edge) */
            .chat-input-scrollbar::-webkit-scrollbar {
                width: 6px;
                background: transparent;
            }
            .chat-input-scrollbar::-webkit-scrollbar-track {
                background: transparent;
            }
            .chat-input-scrollbar::-webkit-scrollbar-thumb {
                background-color: rgba(255, 255, 255, 0);
                border-radius: 20px;
            }
            .chat-input-scrollbar:hover::-webkit-scrollbar-thumb,
            .chat-input-scrollbar:active::-webkit-scrollbar-thumb {
                background-color: rgba(255, 255, 255, 0.3);
            }
            
            /* Firefox */
            .chat-input-scrollbar {
                scrollbar-width: thin;
                scrollbar-color: rgba(255, 255, 255, 0) transparent;
            }
            .chat-input-scrollbar:hover,
            .chat-input-scrollbar:active {
                scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
            }
        `}</style>
      <header className="flex items-center p-3 border-b border-gray-200 dark:border-gray-700 gap-2">
        <button onClick={onBack} className="p-2 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0">
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <div className="flex-1 min-w-0">
            {contactIsLead && isEditingName ? (
                <div className="flex items-center gap-1 md:gap-2 w-full">
                    <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveName();
                            if (e.key === 'Escape') handleCancelEditName();
                        }}
                        className="flex-1 min-w-0 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        autoFocus
                    />
                    <button onClick={handleSaveName} className="p-2 text-green-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('clientForm.save')} aria-label="Save name">
                        <CheckIcon className="w-6 h-6" />
                    </button>
                    <button onClick={handleCancelEditName} className="p-2 text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('clientForm.cancel')} aria-label="Cancel edit">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
            ) : (
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate" title={contactName}>
                            {contactName}
                        </h2>
                        {contactIsLead && onUpdateLeadName && (
                            <button onClick={() => setIsEditingName(true)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" title={t('lead.editName')}>
                                <PencilIcon className="w-4 h-4" />
                            </button>
                        )}
                        <select
                            value={contact.conversationStatus || 'Ninguno'}
                            onChange={(e) => onUpdateStatus(contact.id, e.target.value as ConversationStatus)}
                            className="text-xs text-gray-500 dark:text-gray-400 bg-transparent border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-sky-500"
                            aria-label={t('chat.status.label')}
                        >
                            <option value="Ninguno">{t('chat.status.none')}</option>
                            <option value="En seguimiento">{t('chat.status.tracking')}</option>
                            <option value="Fidelizado">{t('chat.status.loyal')}</option>
                            <option value="Sin contacto">{t('chat.status.noContact')}</option>
                            <option value="Perdido">{t('chat.status.lost')}</option>
                        </select>
                    </div>
                </div>
            )}
        </div>
        
        <div className="flex items-center flex-shrink-0 relative">
             {/* Regular buttons: Show on desktop always, or on mobile when NOT editing */}
            <div className={`items-center gap-1 ${isEditingName ? 'hidden md:flex' : 'flex'}`}>
                {contactActions.map(action => (
                    <button 
                        key={action.id}
                        ref={action.id === 'task' ? taskMenuButtonRef : null}
                        onClick={action.action}
                        className="p-2 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                        title={action.label}
                        aria-label={action.label}
                    >
                        {action.icon}
                    </button>
                ))}
            </div>

            {/* Overflow menu button: Show on mobile ONLY when editing */}
            {isEditingName && (
                <div className="md:hidden">
                    <button
                        ref={overflowButtonRef}
                        onClick={() => setOverflowMenuOpen(true)}
                        className="p-2 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                        title="More actions"
                        aria-label="More actions"
                    >
                        <EllipsisHorizontalIcon className="w-6 h-6" />
                    </button>
                </div>
            )}
            
            {isTaskMenuOpen && (
                <div ref={taskMenuRef} className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 z-30">
                    <button onClick={() => { setIsTaskMenuOpen(false); setIsQuickTaskOpen(true); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">
                        {t('tasks.quickTask')}
                    </button>
                    <button onClick={() => { setIsTaskMenuOpen(false); onAddTask(contact); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">
                        {t('tasks.newTask')}
                    </button>
                </div>
            )}
            {isOverflowMenuOpen && (
                 <div ref={overflowMenuRef} className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 z-30">
                    {contactActions.map(action => (
                        <button
                            key={action.id}
                            onClick={() => {
                                action.action();
                                setOverflowMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                            {React.cloneElement(action.icon, { className: 'w-5 h-5' })}
                            <span>{action.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
      </header>
      
      {isQuickTaskOpen && (
          <div className="p-4 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold mb-3 dark:text-gray-200">{t('tasks.quickTask')}</h3>
              <div className="flex flex-col gap-3">
                  <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('quickTask.type')}</label>
                      <div className="flex flex-wrap gap-2">
                          {[t('quickTask.followUp'), t('quickTask.call'), t('quickTask.meeting'), t('quickTask.budget')].map(type => (
                              <button
                                key={type}
                                onClick={() => setQuickTaskType(type)}
                                className={`px-3 py-1.5 text-xs rounded-full border ${quickTaskType === type ? 'bg-sky-100 border-sky-500 text-sky-700 dark:bg-sky-900 dark:border-sky-400 dark:text-sky-200' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
                              >
                                  {type}
                              </button>
                          ))}
                      </div>
                  </div>
                  <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                          <input
                            type="datetime-local"
                            value={quickTaskDate}
                            onChange={(e) => setQuickTaskDate(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                          />
                          <CalendarIcon className="w-4 h-4 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"/>
                      </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-1">
                      <button onClick={() => setIsQuickTaskOpen(false)} className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md">{t('clientForm.cancel')}</button>
                      <button onClick={() => { setIsQuickTaskOpen(false); onAddTask(contact); }} className="px-3 py-1.5 text-xs font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-md">{t('quickTask.edit')}</button>
                      <button onClick={handleSaveQuickTask} disabled={!quickTaskDate} className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white hover:bg-green-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">{t('quickTask.save')}</button>
                  </div>
              </div>
          </div>
      )}
      
      <main className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-800">
        {combinedItems.map(item => {
            const msg = item as Message;
            return (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
                    <div className={`p-3 rounded-lg max-w-xs ${msg.sender === 'user' ? 'bg-sky-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                    {msg.type === 'text' ? (
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    ) : msg.type === 'budget' ? (
                            <div className="text-sm">
                                <p className="font-bold mb-1">{t('budgets.title')}</p>
                                <div className="border-t border-b border-white/30 dark:border-black/30 my-1 py-1">
                                    {msg.budget.items.map(item => (
                                        <p key={item.product.id}>{item.quantity} x {item.product.name}</p>
                                    ))}
                                </div>
                                <p className="font-bold mt-1 text-right">{t('budgets.total')}: ${msg.budget.total.toFixed(2)}</p>
                            </div>
                    ) : (
                            <AudioMessagePlayer audio={msg.audio} />
                    )}
                    {msg.sender === 'user' && (
                        <div className="flex justify-end items-center mt-1 text-xs text-white/70">
                            <ReadReceipt status={msg.status} />
                        </div>
                    )}
                    </div>
                </div>
            );
        })}
      </main>

      <footer className="relative p-3 border-t bg-white dark:bg-gray-900/80 border-gray-200 dark:border-gray-700">
        {chatTasks.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 bg-white/95 dark:bg-gray-800/95 border-t border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-300 z-20">
                <div className="flex justify-center">
                    <button 
                        onClick={() => setIsTaskPanelOpen(!isTaskPanelOpen)} 
                        className="bg-gray-200 dark:bg-gray-700 px-4 py-0.5 rounded-t-md -mt-4 border border-b-0 border-gray-300 dark:border-gray-600 text-xs text-gray-500 font-bold"
                        aria-label="Alternar panel de tareas"
                    >
                        {isTaskPanelOpen ? '―' : `Tareas (${chatTasks.length})`}
                    </button>
                </div>
                {isTaskPanelOpen && (
                    <div className="max-h-60 overflow-y-auto p-2 space-y-2">
                        {chatTasks.map(task => (
                            <TaskItem key={task.id} task={task} updateTask={updateTask} onDelete={() => setDeleteConfirmTask(task)} onEdit={() => onOpenTaskEditor(task)} />
                        ))}
                    </div>
                )}
            </div>
        )}

        {attachedFiles.length > 0 && <AttachedFilesPreview />}
        {attachedBudget && ( <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm flex items-center justify-between mb-2"> <div className="flex items-center gap-2"> <DocumentTextIcon className="w-5 h-5 text-green-500"/> <span className="font-semibold">{t('budgets.title')}: ${attachedBudget.total.toFixed(2)}</span> </div> <button onClick={() => setAttachedBudget(null)}><XMarkIcon className="w-4 h-4" /></button> </div> )}
        
        <div className="flex items-end space-x-2">
           {recordedAudio ? (
                <AudioPreviewPlayer audio={recordedAudio} onDiscard={() => setRecordedAudio(null)} />
            ) : (
              <div className="relative flex-1 flex items-end">
                  <div className={`w-full flex items-end transition-opacity duration-200 ${isRecording || isRecordingLocked ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                      <div className="flex-1 flex items-center bg-gray-100 dark:bg-gray-700 rounded-full relative" style={{minHeight: '44px'}}>
                          {undoState && (
                                <button
                                    onClick={handleUndo}
                                    className="p-3 text-gray-500 hover:text-sky-500 dark:text-gray-400 dark:hover:text-sky-400"
                                    title="Undo correction"
                                    aria-label="Undo correction"
                                >
                                    <UndoIcon className="w-6 h-6" />
                                </button>
                          )}
                          <button onClick={() => setEmojiPickerOpen(prev => !prev)} className="p-3 text-gray-500 hover:text-sky-500 dark:text-gray-400 dark:hover:text-sky-400" title={t('chat.addEmoji')} aria-haspopup="dialog" aria-expanded={isEmojiPickerOpen}>
                              <EmojiIcon className="w-6 h-6"/>
                          </button>
                          <div className="relative flex-1 self-stretch flex items-center">
                              <textarea 
                                ref={textareaRef} 
                                rows={1} 
                                value={message} 
                                onChange={(e) => {
                                  setMessage(e.target.value);
                                  if (undoState) {
                                      setUndoState(null);
                                      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
                                  }
                                }} 
                                onKeyDown={(e: KeyboardEvent) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())} 
                                placeholder={t('chatbot.inputPlaceholder')} 
                                style={{boxSizing: 'border-box'}} 
                                className="w-full h-[44px] bg-transparent focus:outline-none dark:text-white pr-10 resize-none chat-input-scrollbar py-[10px] overflow-y-auto" 
                              />
                              <button onClick={handleCorrectGrammar} disabled={isCorrecting || !message.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-yellow-500 disabled:opacity-50" title={t('chat.correctGrammar')} aria-busy={isCorrecting}>{isCorrecting ? <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div> : <BrainIcon className="w-5 h-5"/>}</button>
                          </div>
                          <div className="relative">
                              <button ref={attachmentButtonRef} onClick={() => setIsAttachmentMenuOpen(prev => !prev)} className="p-3 text-gray-500 hover:text-sky-500 dark:text-gray-400 dark:hover:text-sky-400" title={t('chat.attachFile')}><PaperClipIcon className="w-6 h-6"/></button>
                              {isAttachmentMenuOpen && (<div ref={attachmentMenuRef} className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 z-10">{attachmentMenuActions.map(action => (<button key={action.label} onClick={action.action} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">{action.icon}<span>{action.label}</span></button>))}</div>)}
                          </div>
                          {isEmojiPickerOpen && <EmojiPicker onEmojiSelect={handleEmojiSelect} onClose={() => setEmojiPickerOpen(false)} />}
                      </div>
                  </div>

                  <div className={`absolute inset-0 flex items-center transition-opacity duration-200 ${isRecording || isRecordingLocked ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                      <div className="absolute left-0 top-0 bottom-0 bg-red-500/20 rounded-full" style={{ width: `${cancelProgress * 100}%` }} />
                      <div style={{ left: `${trashIconLeft}px` }} className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center transition-opacity duration-200 ${gestureState === 'cancelling' ? 'opacity-100' : 'opacity-0'}`}>
                          <TrashIcon className={`w-6 h-6 transition-transform duration-200 ${cancelProgress >= 1 ? 'text-red-500 scale-125' : 'text-gray-500'}`} />
                      </div>
                      {isRecordingLocked && <button onClick={() => cancelRecording()} className="p-2 text-gray-500 hover:text-red-500 flex-shrink-0" aria-label="Discard recording"><TrashIcon className="w-5 h-5" /></button>}
                      <div className="flex items-center gap-2 text-red-500 font-mono px-4">
                          <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
                          <span>{formatDuration(recordingDuration)}</span>
                      </div>
                      <div className={`flex-1 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 transition-opacity duration-200 ${gestureState === 'cancelling' ? 'opacity-100' : 'opacity-0'}`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                          <span>{t('chat.slideToCancel')}</span>
                      </div>
                  </div>
              </div>
            )}

            {showSendButton ? (
                <button id="send-button" onClick={handleSendMessage} disabled={isSending} className="p-3 text-white bg-sky-500 rounded-full hover:bg-sky-600 disabled:bg-sky-300 dark:disabled:bg-sky-800 transition-colors flex-shrink-0" style={{width: '44px', height: '44px'}} title={t('chat.sendMessage')}><PaperAirplaneIcon className="w-5 h-5"/></button>
            ) : isRecordingLocked ? (
                <button onClick={() => {
                    stopActionRef.current = 'preview';
                    stopRecording();
                }} className="p-3 text-white bg-red-500 rounded-full hover:bg-red-700 flex-shrink-0 flex items-center justify-center" style={{width: '44px', height: '44px'}} title="Stop Recording"><StopIcon className="w-5 h-5"/></button>
            ) : (
                <div className="relative flex-shrink-0" style={{width: '44px', height: '44px'}}>
                    <button 
                        ref={micButtonRef}
                        onMouseDown={handleGestureStart} 
                        onTouchStart={handleGestureStart} 
                        onMouseUp={handleRelease}
                        onTouchEnd={handleRelease}
                        onContextMenu={(e) => e.preventDefault()}
                        className={`p-3 text-white bg-sky-500 rounded-full transition-transform duration-200 will-change-transform flex items-center justify-center ${isRecording ? 'scale-125' : ''}`}
                        style={{width: '44px', height: '44px', transform: `translateX(${gestureState === 'cancelling' ? -cancelProgress * 80 : 0}px)` }}
                        title={t('chat.recordMessage')}
                        aria-label="Hold to record voice message"
                    >
                        <MicrophoneIcon className="w-5 h-5"/>
                    </button>
                    <div className={`absolute bottom-full right-1/2 translate-x-1/2 mb-2 w-12 h-20 flex flex-col items-center justify-end transition-opacity duration-300 pointer-events-none ${isRecording && !isRecordingLocked ? 'opacity-100' : 'opacity-0'}`}>
                        <LockClosedIcon className={`w-7 h-7 p-1 rounded-full border border-gray-400 bg-white dark:bg-gray-700 text-gray-500 transition-all duration-200 ${gestureState === 'locking' ? 'text-yellow-500 bg-yellow-100 border-yellow-400 scale-125 -translate-y-2' : ''}`} />
                    </div>
                </div>
            )}
        </div>
      </footer>

      <SourceChooserModal
        isOpen={sourceChooser.open}
        onClose={() => setSourceChooser({ open: false, type: null })}
        showCameraOption={sourceChooser.type === 'image'}
        onDevice={() => {
            if (sourceChooser.type === 'document') docInputRef.current?.click();
            if (sourceChooser.type === 'image') imgInputRef.current?.click();
            setSourceChooser({ open: false, type: null });
        }}
        onDrive={() => {
            alert(t('chat.driveUnavailable'));
            setSourceChooser({ open: false, type: null });
        }}
        onCamera={() => {
            camInputRef.current?.click();
            setSourceChooser({ open: false, type: null });
        }}
      />
      <div className="hidden">
        <input type="file" ref={docInputRef} onChange={handleFileChange} accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx" multiple />
        <input type="file" ref={imgInputRef} onChange={handleFileChange} accept="image/*" multiple />
        <input type="file" ref={camInputRef} onChange={handleFileChange} accept="image/*" capture="environment" />
      </div>
      
      {isDraggingOver && (
        <div 
          className="absolute inset-0 bg-sky-500/20 border-4 border-dashed border-sky-500 rounded-lg flex flex-col items-center justify-center pointer-events-none z-50"
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={(e) => handleDrag(e, false)}
          onDrop={handleDrop}
        >
          <UploadIcon className="w-16 h-16 text-white"/>
          <p className="mt-4 text-2xl font-bold text-white">{t('chat.dropFilesHere')}</p>
        </div>
      )}

      <DeleteConfirmationModal 
        isOpen={!!deleteConfirmTask}
        count={1}
        taskTitle={deleteConfirmTask?.title}
        onConfirm={() => {
            if (deleteConfirmTask) deleteTask(deleteConfirmTask.id);
            setDeleteConfirmTask(null);
        }}
        onCancel={() => setDeleteConfirmTask(null)}
      />
      
      <SaleModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        onSave={handleSaveSale}
        initialClientName={contactName}
      />
    </div>
  );
};

export default ChatView;