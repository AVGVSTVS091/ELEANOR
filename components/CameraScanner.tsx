import React, { useState, useEffect, useRef } from 'react';
import { extractContactFromImage } from '../services/geminiService';
import { Client } from '../types';
import jsQR from 'jsqr';
import CloseButton from './CloseButton';

interface CameraScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (data: Partial<Omit<Client, 'id'>>) => void;
  scanMode: 'card' | 'qr';
}

const CameraScanner: React.FC<CameraScannerProps> = ({ isOpen, onClose, onScanComplete, scanMode }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const stopCamera = () => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    const startCamera = async () => {
      try {
        if (streamRef.current) stopCamera(); // Stop previous stream
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Could not access camera. Please check permissions.");
      }
    };
    
    startCamera();
    
    return () => {
        stopCamera();
    };
  }, [isOpen]);

  // QR Code scanning logic
  useEffect(() => {
      if (isOpen && scanMode === 'qr' && videoRef.current && canvasRef.current) {
          let animationFrameId: number;

          const tick = () => {
              if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
                  const canvas = canvasRef.current;
                  const video = videoRef.current;
                  if (!canvas || !video) return;

                  canvas.height = video.videoHeight;
                  canvas.width = video.videoWidth;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) return;

                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                  const code = jsQR(imageData.data, imageData.width, imageData.height, {
                      inversionAttempts: "dontInvert",
                  });

                  if (code) {
                      console.log("QR Code found:", code.data);
                      // Basic vCard parsing
                      const vCardData: Partial<Client> = {};
                      if (code.data.startsWith('BEGIN:VCARD')) {
                          const nameMatch = code.data.match(/FN:(.*)/);
                          if (nameMatch) vCardData.companyName = nameMatch[1].trim();
                          
                          const telMatch = code.data.match(/TEL.*?:(.*)/);
                          if (telMatch) vCardData.phoneNumber = telMatch[1].trim().replace(/[^\d+]/g, '');
                          
                          const titleMatch = code.data.match(/TITLE:(.*)/);
                          if (titleMatch) vCardData.industry = titleMatch[1].trim();
                      } else {
                          // Assume it's just a phone number or name if not a vCard
                          if (/\d{5,}/.test(code.data)) {
                            vCardData.phoneNumber = code.data;
                          } else {
                            vCardData.companyName = code.data;
                          }
                      }
                      
                      if (Object.keys(vCardData).length > 0) {
                        onScanComplete(vCardData);
                        onClose();
                      }
                  }
              }
              animationFrameId = requestAnimationFrame(tick);
          };

          animationFrameId = requestAnimationFrame(tick);

          return () => {
              cancelAnimationFrame(animationFrameId);
          };
      }
  }, [isOpen, scanMode, onScanComplete, onClose]);


  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsLoading(true);
    setError(null);
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
        setIsLoading(false);
        setError("Failed to get canvas context.");
        return;
    }
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    
    const dataUrl = canvas.toDataURL('image/jpeg');
    const base64 = dataUrl.split(',')[1];
    
    try {
        const contactData = await extractContactFromImage(base64, 'image/jpeg');
        onScanComplete(contactData);
        onClose();
    } catch (err) {
        setError("Failed to extract contact information. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
      <div className="relative bg-gray-900 rounded-lg w-full max-w-lg aspect-video flex flex-col items-center justify-center overflow-hidden">
        <CloseButton onClose={onClose} className="absolute top-2 right-2 z-20 bg-black/50 text-white hover:bg-black/70 dark:hover:bg-black/70" />
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />

        <div className="absolute inset-0 border-8 border-white/30 rounded-lg pointer-events-none" />
        
        {error && <div className="absolute bottom-16 p-2 bg-red-500 text-white rounded-md text-sm">{error}</div>}

        {scanMode === 'card' && (
            <div className="absolute bottom-4 z-10">
            <button
                onClick={handleCapture}
                disabled={isLoading}
                className="w-16 h-16 bg-white rounded-full border-4 border-gray-400 disabled:opacity-50 flex items-center justify-center"
            >
                {isLoading ? <div className="w-8 h-8 border-4 border-t-green-600 border-gray-200 rounded-full animate-spin" /> : <div className="w-12 h-12 bg-white rounded-full" />}
            </button>
            </div>
        )}
        {scanMode === 'qr' && (
            <div className="absolute top-4 text-white bg-black/50 px-3 py-1 rounded-md">
                <span>Scan QR Code</span>
            </div>
        )}
      </div>
    </div>
  );
};

export default CameraScanner;