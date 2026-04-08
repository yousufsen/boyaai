'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProfiles, saveProfile, setActiveProfileId } from '@/lib/storage';
import { useProfileStore } from '@/store/profileStore';
import { usePromptStore } from '@/store/promptStore';
import type { ChildProfile } from '@/types/canvas';
import { useTranslation } from '@/lib/i18n';

const AVATAR_EMOJIS = ['🦁', '🐱', '🐶', '🦄', '🐰', '🐼', '🦊', '🐸', '🦋', '🐙'];

export function ProfileSelector() {
  const { setProfile } = useProfileStore();
  const { t } = useTranslation();
  const [profiles] = useState<ChildProfile[]>(getProfiles());
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState(6);
  const [avatar, setAvatar] = useState('🦁');

  const handleSelect = (profile: ChildProfile) => {
    setActiveProfileId(profile.id);
    setProfile(profile);
    usePromptStore.getState().reset();
    localStorage.removeItem('boyaai-current-image');
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    const newProfile = saveProfile({ name: name.trim(), age, avatar });
    setActiveProfileId(newProfile.id);
    setProfile(newProfile);
    usePromptStore.getState().reset();
    localStorage.removeItem('boyaai-current-image');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        className="max-w-lg w-full text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-6xl mb-4">🎨</div>
        <h1 className="text-4xl font-black bg-gradient-to-r from-purple-600 via-pink-500 to-amber-400 bg-clip-text text-transparent mb-2">
          ColorWish
        </h1>
        <p className="text-xl font-bold text-purple-600 mb-10">{t('profile.whoColors')}</p>

        {/* Existing profiles */}
        {profiles.length > 0 && !showCreate && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            {profiles.map((p, i) => (
              <motion.button
                key={p.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => handleSelect(p)}
                className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border-2 border-purple-100 hover:border-purple-400 hover:shadow-2xl hover:scale-105 transition-all flex flex-col items-center gap-2"
              >
                <span className="text-5xl">{p.avatar}</span>
                <span className="text-lg font-extrabold text-purple-800">{p.name}</span>
                <span className="text-xs font-bold text-purple-400">{p.age} yaş</span>
              </motion.button>
            ))}
          </div>
        )}

        {/* Create new profile form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-purple-100 mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <h2 className="text-2xl font-extrabold text-purple-800 mb-6">{t('profile.newProfileTitle')}</h2>

              {/* Name */}
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('profile.nameLabel')}
                maxLength={20}
                className="w-full px-5 py-4 rounded-2xl bg-purple-50 border-2 border-purple-100 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none text-lg font-bold text-purple-800 placeholder:text-purple-300 mb-4"
              />

              {/* Age slider */}
              <div className="mb-6">
                <p className="text-sm font-bold text-purple-500 mb-2">{t('profile.ageLabel')} <span className="text-purple-800 text-lg">{age}</span></p>
                <input
                  type="range"
                  min={3}
                  max={10}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full h-3 rounded-full appearance-none bg-purple-100 accent-purple-500"
                />
                <div className="flex justify-between text-xs font-bold text-purple-300 mt-1">
                  <span>3</span><span>10</span>
                </div>
              </div>

              {/* Avatar selection */}
              <p className="text-sm font-bold text-purple-500 mb-3">{t('profile.avatarLabel')}</p>
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                {AVATAR_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setAvatar(emoji)}
                    className={`w-14 h-14 rounded-2xl text-3xl flex items-center justify-center transition-all ${
                      avatar === emoji
                        ? 'bg-purple-500 shadow-lg shadow-purple-300 scale-110 ring-2 ring-purple-300'
                        : 'bg-purple-50 hover:bg-purple-100'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 min-h-[52px] rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!name.trim()}
                  className="flex-1 min-h-[52px] rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-extrabold shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50"
                >
                  {t('profile.create')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full min-h-[56px] rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-extrabold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            {t('profile.newProfile')}
          </button>
        )}
      </motion.div>
    </div>
  );
}
