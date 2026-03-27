'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SpeechModalProps {
  isOpen: boolean;
  isListening: boolean;
  transcript: string;
  isSupported: boolean;
  onStart: () => void;
  onStop: () => void;
  onConfirm: (text: string) => void;
  onClose: () => void;
}

export function SpeechModal({
  isOpen,
  isListening,
  transcript,
  isSupported,
  onStart,
  onStop,
  onConfirm,
  onClose,
}: SpeechModalProps) {
  // Auto-start listening when modal opens
  useEffect(() => {
    if (isOpen && isSupported && !isListening) {
      onStart();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isSupported) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm text-center"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <div className="text-5xl mb-4">😔</div>
              <h3 className="text-xl font-extrabold text-purple-800 mb-2">Ses Tanıma Desteklenmiyor</h3>
              <p className="text-purple-500 font-semibold mb-6 text-sm">
                Tarayıcın ses tanımayı desteklemiyor. Chrome veya Edge kullanmayı dene!
              </p>
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-2xl bg-purple-500 text-white font-bold hover:bg-purple-600 transition-all min-h-[48px]"
              >
                Tamam
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full text-center"
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
          >
            {/* Mic icon with wave animation */}
            <div className="relative flex items-center justify-center mb-6">
              {isListening && (
                <>
                  <motion.div
                    className="absolute w-24 h-24 rounded-full bg-red-200"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute w-32 h-32 rounded-full bg-red-100"
                    animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                  />
                </>
              )}
              <motion.div
                className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center text-4xl ${
                  isListening ? 'bg-red-500 shadow-lg shadow-red-300' : 'bg-purple-100'
                }`}
                animate={isListening ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                🎤
              </motion.div>
            </div>

            <h3 className="text-2xl font-extrabold text-purple-800 mb-2">
              {isListening ? 'Seni dinliyorum...' : 'Hazır!'}
            </h3>
            <p className="text-purple-400 font-semibold text-sm mb-4">
              {isListening
                ? 'Hayal ettiğin sahneyi anlat!'
                : 'Mikrofona tekrar bas veya metni onayla'}
            </p>

            {/* Live transcript */}
            <div className="min-h-[80px] bg-purple-50 rounded-2xl p-4 mb-6 border-2 border-purple-100">
              {transcript ? (
                <p className="text-lg font-bold text-purple-800">{transcript}</p>
              ) : (
                <p className="text-purple-300 font-semibold italic">
                  {isListening ? 'Konuşmaya başla...' : 'Henüz bir şey söylenmedi'}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 justify-center">
              {isListening ? (
                <button
                  onClick={onStop}
                  className="px-6 py-3 rounded-2xl bg-red-500 text-white font-bold text-lg hover:bg-red-600 transition-all min-h-[52px] flex items-center gap-2"
                >
                  ⏹️ Durdur
                </button>
              ) : (
                <button
                  onClick={onStart}
                  className="px-6 py-3 rounded-2xl bg-purple-100 text-purple-700 font-bold text-lg hover:bg-purple-200 transition-all min-h-[52px] flex items-center gap-2"
                >
                  🔄 Tekrar Dene
                </button>
              )}

              <button
                onClick={() => {
                  if (transcript) {
                    onConfirm(transcript);
                  }
                  onClose();
                }}
                disabled={!transcript}
                className="px-6 py-3 rounded-2xl bg-green-500 text-white font-bold text-lg hover:bg-green-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[52px] flex items-center gap-2"
              >
                ✅ Tamam
              </button>

              <button
                onClick={() => {
                  if (isListening) onStop();
                  onClose();
                }}
                className="px-6 py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all min-h-[52px]"
              >
                ✕
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
