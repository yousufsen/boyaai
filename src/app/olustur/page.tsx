'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { usePromptStore } from '@/store/promptStore';
import { useProfileStore } from '@/store/profileStore';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { LOADING_MESSAGES } from '@/constants/limits';
import { getDailyLimit, getDailyUsageCount, incrementDailyUsage } from '@/lib/storage';
import { getRandomSuggestions } from '@/constants/inspirations';
import type { GenerateResponse } from '@/types/canvas';
import { SpeechModal } from '@/components/ui/SpeechModal';

export default function OlusturPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><span className="text-4xl animate-spin">🎨</span></div>}>
      <OlusturPage />
    </Suspense>
  );
}


function OlusturPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { prompt, setPrompt, status, setStatus, imageUrl, setImageUrl, setError, error, reset } = usePromptStore();
  const profile = useProfileStore((s) => s.profile);
  const { isListening, transcript, isSupported, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [showSpeechModal, setShowSpeechModal] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(3);
  const [dailyUsed, setDailyUsed] = useState(0);
  const [suggestions, setSuggestions] = useState(getRandomSuggestions(6));

  // Reset state when profile changes
  useEffect(() => {
    reset();
    localStorage.removeItem('boyaai-current-image');
    setSuggestions(getRandomSuggestions(6));
    setDailyLimit(getDailyLimit());
    if (profile) {
      setDailyUsed(getDailyUsageCount(profile.id));
    }
  }, [profile?.id, reset]);

  // Set prompt from URL query
  useEffect(() => {
    const urlPrompt = searchParams.get('prompt');
    if (urlPrompt) {
      setPrompt(urlPrompt);
    }
  }, [searchParams, setPrompt]);

  // Cycle loading messages every 3 seconds
  useEffect(() => {
    if (status !== 'generating') return;
    const interval = setInterval(() => {
      setLoadingMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [status]);

  const remaining = dailyLimit - dailyUsed;

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || !profile) return;

    setStatus('generating');
    setLoadingMsgIndex(0);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = await res.json();

      if (data.success && data.imageUrl) {
        localStorage.setItem('boyaai-current-image', data.imageUrl);
        setImageUrl(data.imageUrl);
        incrementDailyUsage(profile.id);
        setDailyUsed(getDailyUsageCount(profile.id));
      } else {
        setError(data.error || 'Bir şeyler ters gitti, tekrar dene 🔄');
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('İstek zaman aşımına uğradı, tekrar dene 🔄');
      } else {
        setError('Bağlantı hatası. Lütfen tekrar deneyin.');
      }
    }
  }, [prompt, profile, dailyUsed, dailyLimit, setStatus, setImageUrl, setError]);

  const handleOpenSpeechModal = () => {
    resetTranscript();
    setShowSpeechModal(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-extrabold text-purple-800 mb-2">
          🎨 Boyama Sayfası Oluştur
        </h1>
        <p className="text-purple-500 font-semibold">
          Hayal ettiğin sahneyi anlat, sana boyama sayfası yapalım!
        </p>
        <Link
          href="/kutuphane"
          className="inline-block mt-3 text-sm font-bold text-purple-400 hover:text-purple-600 transition-colors"
        >
          veya 📚 hazır sayfalardan seç →
        </Link>
      </motion.div>

      {/* Daily limit indicator */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-purple-100 shadow-sm">
          <span className="text-sm font-bold text-purple-600">
            Bugün kalan hak:
          </span>
          <div className="flex gap-1">
            {Array.from({ length: dailyLimit }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all ${
                  i < remaining ? 'bg-green-400 shadow-sm shadow-green-200' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Input Area */}
      <motion.div
        className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-purple-100 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Örneğin: Uzayda yüzen bir astronot kedi 🐱🚀"
            className="w-full h-32 p-4 rounded-2xl bg-purple-50/50 border-2 border-purple-100 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none resize-none text-lg font-semibold text-purple-800 placeholder:text-purple-300 transition-all"
            disabled={status === 'generating'}
            maxLength={200}
          />
          <span className="absolute bottom-3 right-3 text-xs text-purple-300 font-semibold">
            {prompt.length}/200
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          {/* Microphone button — opens speech modal */}
          <button
            onClick={handleOpenSpeechModal}
            disabled={status === 'generating'}
            className="min-h-[56px] px-6 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:opacity-50"
          >
            🎤 Sesle Anlat
          </button>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || status === 'generating'}
            className="flex-1 min-h-[56px] px-6 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-extrabold text-lg shadow-lg shadow-purple-300/50 hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {status === 'generating' ? '⏳ Üretiliyor...' : '✨ Boyama Sayfası Üret'}
          </button>
        </div>

        {remaining <= 0 && (
          <p className="text-center text-red-400 font-bold mt-3 text-sm">
            Bugünlük hakkın doldu! Yarın tekrar gel 😊
          </p>
        )}
      </motion.div>

      {/* Loading Animation */}
      <AnimatePresence>
        {status === 'generating' && (
          <motion.div
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-purple-100 mb-8 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <motion.div
              className="text-5xl mb-4"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              🎨
            </motion.div>

            <div className="w-full max-w-xs mx-auto h-3 bg-purple-100 rounded-full overflow-hidden mb-4">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: '95%' }}
                transition={{ duration: 15, ease: 'easeOut' }}
              />
            </div>

            <AnimatePresence mode="wait">
              <motion.p
                key={loadingMsgIndex}
                className="text-lg font-bold text-purple-600"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {LOADING_MESSAGES[loadingMsgIndex]}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {status === 'done' && imageUrl && (
          <motion.div
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-purple-100 mb-8 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h2 className="text-2xl font-extrabold text-purple-800 mb-4">
              🎉 Boyama Sayfan Hazır!
            </h2>

            <div className="relative w-full max-w-md mx-auto aspect-square rounded-2xl overflow-hidden border-4 border-purple-200 shadow-lg mb-6 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Boyama sayfası"
                crossOrigin="anonymous"
                className="w-full h-full object-contain p-2"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push('/boya?source=generated')}
                className="min-h-[56px] px-8 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 text-white font-extrabold text-lg shadow-lg shadow-green-200 hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                🖌️ Boyamaya Başla!
              </button>
              <button
                onClick={() => { reset(); setSuggestions(getRandomSuggestions(6)); }}
                className="min-h-[56px] px-8 rounded-2xl bg-white border-2 border-purple-200 text-purple-600 font-bold text-lg hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
              >
                🔄 Yenisini Üret
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {status === 'error' && (
          <motion.div
            className="bg-red-50 rounded-3xl p-6 shadow-lg border border-red-200 mb-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-red-500 font-bold text-lg mb-3">😢 {error || 'Bir şeyler ters gitti!'}</p>
            <button
              onClick={() => { reset(); setSuggestions(getRandomSuggestions(6)); }}
              className="px-6 py-3 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all"
            >
              Tekrar Dene
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speech Modal */}
      <SpeechModal
        isOpen={showSpeechModal}
        isListening={isListening}
        transcript={transcript}
        isSupported={isSupported}
        onStart={startListening}
        onStop={stopListening}
        onConfirm={(text) => setPrompt(text)}
        onClose={() => {
          if (isListening) stopListening();
          setShowSpeechModal(false);
        }}
      />

      {/* Suggestion Cards */}
      {status === 'idle' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-xl font-extrabold text-purple-800 text-center mb-6">
            💡 Fikir mi lazım?
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => setPrompt(s.text)}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center shadow-md border border-purple-100 hover:shadow-lg hover:scale-105 hover:border-purple-300 transition-all min-h-[100px] flex flex-col items-center justify-center gap-2"
              >
                <span className="text-3xl">{s.emoji}</span>
                <span className="text-xs font-bold text-purple-700">{s.text}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
