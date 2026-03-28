'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  getProfiles,
  deleteProfile,
  getParentSettings,
  saveParentSettings,
  verifyPin,
  clearAllData,
  getArtworksForProfile,
} from '@/lib/storage';
import type { ChildProfile, ParentSettings } from '@/types/canvas';
import { Toast } from '@/components/ui/Toast';

export default function EbeveynPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [settings, setSettings] = useState<ParentSettings>({ pin: '1234', dailyLimit: 3 });
  const [newPin, setNewPin] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setProfiles(getProfiles());
      setSettings(getParentSettings());
    }
  }, [isAuthenticated]);

  const handlePinSubmit = () => {
    if (verifyPin(pin)) {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPin('');
    }
  };

  const handleDeleteProfile = (id: string) => {
    deleteProfile(id);
    setProfiles(getProfiles());
    setDeleteTargetId(null);
  };

  const showToastMessage = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
  };

  const handleSaveSettings = () => {
    const updated = { ...settings };
    const pinChanged = newPin.length === 4 && newPin !== settings.pin;
    if (pinChanged) {
      updated.pin = newPin;
      setNewPin('');
    }
    saveParentSettings(updated);
    setSettings(updated);
    showToastMessage(pinChanged ? '🔒 PIN güncellendi!' : '✅ Ayarlar kaydedildi!');
  };

  const handleClearAll = () => {
    clearAllData();
    setShowClearConfirm(false);
    setIsAuthenticated(false);
    setPin('');
    window.location.href = '/';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // PIN entry screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <motion.div
          className="max-w-sm w-full text-center bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-purple-100"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-extrabold text-purple-800 mb-2">Ebeveyn Paneli</h1>
          <p className="text-purple-500 font-semibold text-sm mb-6">4 haneli PIN kodunu gir</p>

          <div className="flex justify-center gap-3 mb-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-2xl font-black transition-all ${
                  pin.length > i
                    ? 'border-purple-500 bg-purple-50 text-purple-800'
                    : 'border-purple-200 bg-white'
                }`}
              >
                {pin.length > i ? '●' : ''}
              </div>
            ))}
          </div>

          <input
            type="number"
            value={pin}
            onChange={(e) => {
              const v = e.target.value.slice(0, 4);
              setPin(v);
              setPinError(false);
            }}
            className="opacity-0 absolute w-0 h-0"
            autoFocus
            inputMode="numeric"
          />

          {/* Number pad */}
          <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((n, i) => (
              <button
                key={i}
                onClick={() => {
                  if (n === null) return;
                  if (n === 'del') {
                    setPin((p) => p.slice(0, -1));
                  } else {
                    if (pin.length < 4) setPin((p) => p + n);
                  }
                  setPinError(false);
                }}
                disabled={n === null}
                className={`h-14 rounded-2xl font-extrabold text-xl transition-all ${
                  n === null
                    ? 'invisible'
                    : n === 'del'
                    ? 'bg-red-50 text-red-500 hover:bg-red-100'
                    : 'bg-purple-50 text-purple-800 hover:bg-purple-100 active:scale-95'
                }`}
              >
                {n === 'del' ? '⌫' : n}
              </button>
            ))}
          </div>

          {pinError && (
            <p className="text-red-500 font-bold text-sm mb-3">Yanlış PIN! Tekrar dene.</p>
          )}

          <button
            onClick={handlePinSubmit}
            disabled={pin.length !== 4}
            className="w-full min-h-[48px] rounded-2xl bg-purple-500 text-white font-bold hover:bg-purple-600 transition-all disabled:opacity-40"
          >
            Giriş Yap
          </button>

          <Link href="/" className="inline-block mt-4 text-sm font-bold text-purple-400 hover:text-purple-600">
            ← Ana Sayfaya Dön
          </Link>
        </motion.div>
      </div>
    );
  }

  // Authenticated panel
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Toast message={toastMessage} show={showToast} onClose={() => setShowToast(false)} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-purple-800">👨‍👩‍👧 Ebeveyn Paneli</h1>
          <Link href="/" className="px-4 py-2 rounded-full bg-purple-100 text-purple-700 font-bold text-sm hover:bg-purple-200 transition-all">
            ← Geri
          </Link>
        </div>

        {/* Profiles section */}
        <section className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-purple-100 mb-6">
          <h2 className="text-xl font-extrabold text-purple-800 mb-4">👧 Çocuk Profilleri</h2>

          {profiles.length === 0 ? (
            <p className="text-purple-400 font-semibold text-center py-4">Henüz profil yok</p>
          ) : (
            <div className="space-y-3">
              {profiles.map((p) => {
                const artworks = getArtworksForProfile(p.id);
                const lastArtwork = artworks[0];
                return (
                  <div key={p.id} className="flex items-center gap-4 p-4 rounded-2xl bg-purple-50 border border-purple-100">
                    <span className="text-4xl">{p.avatar}</span>
                    <div className="flex-1">
                      <p className="font-extrabold text-purple-800">{p.name}</p>
                      <p className="text-xs font-semibold text-purple-400">
                        {p.age} yaş · {artworks.length} eser
                        {lastArtwork && ` · Son: ${formatDate(lastArtwork.createdAt)}`}
                      </p>
                    </div>
                    <button
                      onClick={() => setDeleteTargetId(p.id)}
                      className="px-3 py-2 rounded-xl bg-red-50 text-red-500 font-bold text-sm hover:bg-red-100 transition-all min-h-[44px]"
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Settings section */}
        <section className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-purple-100 mb-6">
          <h2 className="text-xl font-extrabold text-purple-800 mb-4">⚙️ Ayarlar</h2>

          {/* Daily limit */}
          <div className="mb-6">
            <label className="text-sm font-bold text-purple-600 mb-2 block">
              Günlük Kullanım Limiti: <span className="text-purple-800 text-lg">{settings.dailyLimit}</span>
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={settings.dailyLimit}
              onChange={(e) => setSettings({ ...settings, dailyLimit: Number(e.target.value) })}
              className="w-full h-3 rounded-full appearance-none bg-purple-100 accent-purple-500"
            />
            <div className="flex justify-between text-xs font-bold text-purple-300 mt-1">
              <span>1</span><span>10</span>
            </div>
            <p className="text-xs text-purple-400 mt-2">Çocuğunuz günde kaç boyama sayfası üretebilsin?</p>
          </div>

          {/* Change PIN */}
          <div className="mb-6">
            <label className="text-sm font-bold text-purple-600 mb-2 block">Yeni PIN (4 haneli):</label>
            <input
              type="number"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.slice(0, 4))}
              placeholder="Yeni PIN"
              inputMode="numeric"
              className="w-full px-4 py-3 rounded-2xl bg-purple-50 border-2 border-purple-100 focus:border-purple-400 outline-none font-bold text-purple-800 placeholder:text-purple-300"
            />
          </div>

          <button
            onClick={handleSaveSettings}
            className="w-full min-h-[48px] rounded-2xl bg-purple-500 text-white font-bold hover:bg-purple-600 transition-all"
          >
            Ayarları Kaydet
          </button>
        </section>

        {/* Danger zone */}
        <section className="bg-red-50/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-red-200">
          <h2 className="text-xl font-extrabold text-red-600 mb-4">⚠️ Tehlikeli Bölge</h2>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="w-full min-h-[48px] rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all"
          >
            Tüm Verileri Sil
          </button>
        </section>
      </motion.div>

      {/* Delete profile confirm */}
      <AnimatePresence>
        {deleteTargetId && (
          <motion.div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm mx-4 text-center" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
              <div className="text-5xl mb-4">👧</div>
              <h3 className="text-xl font-extrabold text-purple-800 mb-2">Profili silmek istediğine emin misin?</h3>
              <p className="text-purple-500 font-semibold mb-6 text-sm">Tüm eserleri de silinecek!</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setDeleteTargetId(null)} className="px-6 py-3 rounded-2xl bg-gray-100 text-gray-700 font-bold min-h-[48px]">Vazgeç</button>
                <button onClick={() => handleDeleteProfile(deleteTargetId)} className="px-6 py-3 rounded-2xl bg-red-500 text-white font-bold min-h-[48px]">Evet, Sil</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear all confirm */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm mx-4 text-center" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-extrabold text-red-600 mb-2">Tüm veriler silinecek!</h3>
              <p className="text-red-400 font-semibold mb-6 text-sm">Profiller, eserler, ayarlar... Her şey gidecek!</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setShowClearConfirm(false)} className="px-6 py-3 rounded-2xl bg-gray-100 text-gray-700 font-bold min-h-[48px]">Vazgeç</button>
                <button onClick={handleClearAll} className="px-6 py-3 rounded-2xl bg-red-500 text-white font-bold min-h-[48px]">Evet, Sil</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
