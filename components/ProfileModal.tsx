import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useSettings } from '../hooks/useSettings';
import { fileToBase64 } from '../utils/fileUtils';
import { UploadIcon, TrashIcon, GoogleIcon, CloudIcon } from './Icons';
import CloseButton from './CloseButton';
import { aguaiService, AguaiUserProfile } from '../services/aguaiService';


interface AguaiLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: (profile: AguaiUserProfile) => void;
}

const AguaiLoginModal: React.FC<AguaiLoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
    const { t } = useTranslation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const modalRef = useRef<HTMLDivElement>(null);
    const usernameRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setError('');
            setIsLoading(false);
            setUsername('');
            setPassword('');
            // Focus trap and initial focus
            setTimeout(() => usernameRef.current?.focus(), 100);

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Tab') {
                    const focusableElements = modalRef.current?.querySelectorAll('input, button');
                    if (!focusableElements) return;
                    const firstElement = focusableElements[0] as HTMLElement;
                    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
                    if (e.shiftKey && document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    } else if (!e.shiftKey && document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            };
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen]);
    
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const profile = await aguaiService.login({ username, password });
            onLoginSuccess(profile);
        } catch (err: any) {
            setError(t(err.message || 'aguaiLogin.error.invalid'));
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="aguai-login-title">
            <div ref={modalRef} className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 m-4 max-w-sm w-full">
                <CloseButton onClose={onClose} className="absolute top-3 right-3" />
                <h2 id="aguai-login-title" className="text-xl font-bold dark:text-gray-100 mb-4">{t('aguaiLogin.title')}</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('aguaiLogin.username')}</label>
                        <input ref={usernameRef} type="text" value={username} onChange={e => setUsername(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('aguaiLogin.password')}</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" required />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md font-medium">{t('aguaiLogin.cancel')}</button>
                        <button type="submit" disabled={isLoading} className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md font-medium disabled:bg-green-300">
                            {isLoading ? `${t('chatbot.listening')}...` : t('aguaiLogin.login')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const ProfileModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const { settings, setUserPhoto, setUserFullName, setUserNickname, setUserEmail, setUserPhone, setIsSessionPersistent, setGoogleDriveLinked, loginAguai, logoutAguai } = useSettings();

    const [fullName, setFullName] = useState(settings.userFullName);
    const [nickname, setNickname] = useState(settings.userNickname);
    const [email, setEmail] = useState(settings.userEmail);
    const [phone, setPhone] = useState(settings.userPhone);
    const photoInputRef = useRef<HTMLInputElement>(null);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [userMode, setUserMode] = useState<'guest' | 'aguai'>(settings.isAguaiUser ? 'aguai' : 'guest');

    useEffect(() => {
        if (isOpen) {
            setFullName(settings.userFullName);
            setNickname(settings.userNickname);
            setEmail(settings.userEmail);
            setPhone(settings.userPhone);
            setUserMode(settings.isAguaiUser ? 'aguai' : 'guest');
        }
    }, [isOpen, settings]);

    const handleSave = () => {
        if (!nickname.trim()) {
            alert(t('profile.nicknameRequired'));
            return;
        }
        if (!settings.isAguaiUser) {
            setUserFullName(fullName);
            setUserNickname(nickname);
            setUserEmail(email);
            setUserPhone(phone);
        }
        onClose();
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const base64 = await fileToBase64(file);
            setUserPhoto(`data:${file.type};base64,${base64}`);
        }
    };
    
    const handleUnlink = (service: 'google') => {
        if (window.confirm(t('profile.unlinkConfirm'))) {
            setGoogleDriveLinked(false);
        }
    };
    
    const handleModeChange = (mode: 'guest' | 'aguai') => {
        if (mode === 'aguai') {
            setIsLoginModalOpen(true);
        } else {
            if(settings.isAguaiUser) {
                if(window.confirm(t('profile.unlinkConfirm'))) {
                    logoutAguai();
                }
            } else {
                setUserMode('guest');
            }
        }
    };

    const handleLoginSuccess = (profile: AguaiUserProfile) => {
        loginAguai(profile);
        setIsLoginModalOpen(false);
        setUserMode('aguai');
        alert(t('aguaiLogin.success'));
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-gray-900 bg-opacity-50 dark:bg-black dark:bg-opacity-70 z-50 flex items-center justify-center p-4">
                <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 m-4 max-w-md w-full max-h-[90vh] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold dark:text-gray-100">{t('profile.title')}</h2>
                        <CloseButton onClose={onClose} />
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                        {/* User Mode */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('profile.userMode')}</label>
                            <select value={userMode} onChange={e => handleModeChange(e.target.value as 'guest' | 'aguai')} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">
                                <option value="guest">{t('profile.modeGuest')}</option>
                                <option value="aguai">{t('profile.modeAguai')}</option>
                            </select>
                        </div>

                        {/* Profile Photo */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">{t('profile.photo')}</h3>
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                                    {settings.userPhoto && <img src={settings.userPhoto} alt="Profile" className="w-full h-full object-cover" />}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button onClick={() => photoInputRef.current?.click()} className="text-sm font-medium text-sky-600 dark:text-sky-400 hover:underline">{t('profile.upload')}</button>
                                    {settings.userPhoto && <button onClick={() => setUserPhoto(null)} className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline">{t('profile.remove')}</button>}
                                    <input type="file" ref={photoInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                                </div>
                            </div>
                        </div>

                        {/* User Data */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile.fullName')}</label>
                                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" disabled={settings.isAguaiUser} />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile.nickname')}*</label>
                                <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" required disabled={settings.isAguaiUser} />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile.email')}</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" disabled={settings.isAguaiUser} />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile.phone')}</label>
                                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" disabled={settings.isAguaiUser} />
                            </div>
                        </div>

                        {/* Cloud Linking */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">{t('profile.cloudLink')}</h3>
                            <div className="space-y-3">
                                {settings.googleDriveLinked ? (
                                    <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg flex items-center justify-between">
                                        <span className="text-sm font-medium text-green-800 dark:text-green-200">{t('profile.linkedToGoogle')}</span>
                                        <button onClick={() => handleUnlink('google')} className="text-xs text-red-600 hover:underline">{t('profile.unlink')}</button>
                                    </div>
                                ) : (
                                    <button onClick={() => setGoogleDriveLinked(true)} className="w-full flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                                        <GoogleIcon className="w-6 h-6"/>
                                        <span className="font-medium text-gray-700 dark:text-gray-200">{t('profile.linkGoogle')}</span>
                                    </button>
                                )}
                                <button className="w-full flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 opacity-50 cursor-not-allowed">
                                    <CloudIcon className="w-6 h-6 text-gray-500"/>
                                    <span className="font-medium text-gray-500">{t('profile.linkCloud')}</span>
                                </button>
                                {!settings.googleDriveLinked && !settings.isAguaiUser && <p className="text-xs text-center text-gray-500 dark:text-gray-400">{t('profile.guestMode')}</p>}
                                {settings.isAguaiUser && <p className="text-xs text-center text-green-600 dark:text-green-400 font-semibold">{t('profile.aguaiStatus')}</p>}
                            </div>
                        </div>
                        
                        {/* Session */}
                         <div>
                            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">{t('profile.session')}</h3>
                            <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <label htmlFor="session-toggle" className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('profile.keepSession')}</label>
                                <button
                                    id="session-toggle"
                                    onClick={() => setIsSessionPersistent(!settings.isSessionPersistent)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.isSessionPersistent ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                                    role="switch"
                                    aria-checked={settings.isSessionPersistent}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.isSessionPersistent ? 'translate-x-6' : 'translate-x-1'}`}/>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                        <button onClick={handleSave} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors">{t('clientForm.save')}</button>
                    </div>
                </div>
            </div>
            <AguaiLoginModal
                isOpen={isLoginModalOpen}
                onClose={() => {
                    setIsLoginModalOpen(false);
                    setUserMode('guest'); // Revert dropdown on cancel
                }}
                onLoginSuccess={handleLoginSuccess}
            />
        </>
    );
};

export default ProfileModal;
