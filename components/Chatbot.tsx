import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Client } from '../types';
import { getChatbotResponse, getGroundedResponse } from '../services/geminiService';
import { PaperAirplaneIcon, MapPinIcon, MicrophoneIcon, SpeakerWaveIcon, SpeakerXMarkIcon, PaperClipIcon, XMarkIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';
import { fileToBase64 } from '../utils/fileUtils';
import CloseButton from './CloseButton';

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    webkitSpeechRecognition: { new(): SpeechRecognition };
  }
}

interface ChatbotProps {
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'whatsAppStatus' | 'nextFollowUpDate' | 'isPaused' | 'pausedTimeLeft' | 'status' | 'budgets' | 'clientType'>) => void;
  currentView: 'followUps' | 'clients' | 'budgets' | 'corporate' | 'tasks' | 'performance';
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

interface Message {
  sender: 'user' | 'bot';
  text: string;
  groundingChunks?: any[];
}

const Chatbot: React.FC<ChatbotProps> = ({ clients, addClient, currentView, isOpen, setIsOpen }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t, language } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [attachedFile, setAttachedFile] = useState<{ file: File; base64: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);
  
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      console.warn('Speech recognition not supported in this browser.');
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = language;

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };
    
    recognitionRef.current.onend = () => {
        setIsListening(false);
    }

  }, [language]);
  
  const speak = useCallback((text: string) => {
      if (!isSpeechEnabled || !window.speechSynthesis) return;
      window.speechSynthesis.cancel(); // Cancel any previous speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      window.speechSynthesis.speak(utterance);
  }, [isSpeechEnabled, language]);

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput && !attachedFile) return;

    const userMessage: Message = { sender: 'user', text: trimmedInput };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let fileParts: { inlineData: { data: string, mimeType: string } }[] = [];
    if (attachedFile) {
        fileParts.push({
            inlineData: {
                data: attachedFile.base64,
                mimeType: attachedFile.file.type
            }
        });
        setAttachedFile(null);
    }

    let botResponse: Message;

    if (trimmedInput.toLowerCase().includes('near') || trimmedInput.toLowerCase().includes('nearby') || trimmedInput.toLowerCase().includes('around')) {
        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            const { latitude, longitude } = position.coords;
            const { text, groundingChunks } = await getGroundedResponse(trimmedInput, latitude, longitude);
            botResponse = { sender: 'bot', text, groundingChunks };
        } catch (error) {
            botResponse = { sender: 'bot', text: t('chatbot.locationError') };
        }
    } else {
        const response = await getChatbotResponse(trimmedInput, clients, language, fileParts);
        const functionCalls = response.functionCalls;

        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            if (call.name === 'addContact') {
                const args = call.args as Omit<Client, 'id'>;
                addClient(args);
                const confirmationText = t('chatbot.contactAdded', { name: args.companyName });
                botResponse = { sender: 'bot', text: confirmationText };
            } else {
                botResponse = { sender: 'bot', text: response.text };
            }
        } else {
             botResponse = { sender: 'bot', text: response.text };
        }
    }
    
    setMessages(prev => [...prev, botResponse]);
    speak(botResponse.text);
    setIsLoading(false);
  };

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
    setIsListening(!isListening);
  };
  
  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
        const base64 = await fileToBase64(file);
        setAttachedFile({ file, base64 });
    } catch (error) {
        console.error("File to base64 conversion failed", error);
        alert(t('chatbot.fileAnalysisError'));
    }
  };

  const renderAttachedFile = () => (
    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md text-xs flex items-center justify-between">
        <span className="truncate">{attachedFile?.file.name}</span>
        <button onClick={() => setAttachedFile(null)}><XMarkIcon className="w-4 h-4" /></button>
    </div>
  );
  
  if (currentView === 'budgets' || currentView === 'corporate' || currentView === 'tasks' || currentView === 'performance') {
    return null;
  }

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-20 right-0 md:bottom-6 md:right-6 w-full h-full md:w-96 md:h-[32rem] bg-white dark:bg-gray-800 rounded-none md:rounded-lg shadow-2xl flex flex-col z-40">
          <header className="bg-gradient-to-r from-sky-600 to-emerald-600 text-white p-4 rounded-t-none md:rounded-t-lg flex justify-between items-center">
            <h3 className="font-bold text-lg">{t('chatbot.header')}</h3>
            <div className="flex items-center gap-4">
                <button onClick={() => setIsSpeechEnabled(!isSpeechEnabled)} title={isSpeechEnabled ? t('chatbot.stopSpeaking') : t('chatbot.speak')}>
                    {isSpeechEnabled ? <SpeakerWaveIcon className="w-5 h-5"/> : <SpeakerXMarkIcon className="w-5 h-5"/>}
                </button>
                <CloseButton onClose={() => setIsOpen(false)} className="text-white hover:bg-white/20 dark:text-white dark:hover:bg-white/20" />
            </div>
          </header>

          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
                <div className={`p-3 rounded-lg max-w-xs ${msg.sender === 'user' ? 'bg-sky-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                      <div className="mt-2 border-t border-gray-200 dark:border-gray-600 pt-2">
                          <p className="text-xs font-semibold mb-1">{t('chatbot.sources')}</p>
                          {msg.groundingChunks.map((chunk, i) => (
                              <a key={i} href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs text-blue-600 dark:text-blue-400 hover:underline">
                                  <MapPinIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                                  <span>{chunk.maps.title}</span>
                              </a>
                          ))}
                      </div>
                  )}
                </div>
              </div>
            ))}
             {isLoading && (
              <div className="flex justify-start mb-3">
                 <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                    <div className="flex items-center space-x-1">
                        <span className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce"></span>
                    </div>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 space-y-2">
            {attachedFile && renderAttachedFile()}
            <div className="flex items-center space-x-2">
              <input type="file" ref={fileInputRef} onChange={handleFileAttach} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-sky-500 dark:text-gray-400 dark:hover:text-sky-400" title="Attach file"><PaperClipIcon className="w-5 h-5"/></button>
              <input
                type="text"
                value={isListening ? t('chatbot.listening') : input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                placeholder={t('chatbot.inputPlaceholder')}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-sky-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                disabled={isLoading || isListening}
              />
              <button onClick={toggleListen} disabled={!recognitionRef.current} className={`p-2 rounded-full ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'}`}>
                <MicrophoneIcon className="w-5 h-5" />
              </button>
              <button onClick={handleSend} disabled={isLoading || (!input.trim() && !attachedFile)} className="bg-sky-500 text-white p-2 rounded-full hover:bg-sky-600 disabled:bg-sky-300">
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;