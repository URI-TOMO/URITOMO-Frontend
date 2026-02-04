import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Settings, Globe, Image as ImageIcon } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { useTranslation } from '../hooks/useTranslation';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userEmail: string;
  userAvatar: string;
  avatarType: 'emoji' | 'image' | 'none';
  editedUserName: string;
  editedUserAvatar: string;
  editedAvatarType: 'emoji' | 'image' | 'none';
  onNameChange: (name: string) => void;
  onAvatarChange: (avatar: string) => void;
  onAvatarTypeChange: (type: 'emoji' | 'image' | 'none') => void;
  onAvatarImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
}

export function ProfileSettingsModal({
  isOpen,
  onClose,
  userName,
  userEmail,
  editedUserName,
  editedUserAvatar,
  editedAvatarType,
  onNameChange,
  onAvatarChange,
  onAvatarTypeChange,
  onAvatarImageUpload,
  onSave,
}: ProfileSettingsModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        {/* Hidden File Input */}
        <input
          type="file"
          id="avatar-upload"
          className="hidden"
          accept="image/*"
          onChange={onAvatarImageUpload}
        />

        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-amber-400 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">{t('profileSettings')}</h2>
              <p className="text-yellow-100 text-xs">Profile Settings</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full w-8 h-8 p-0"
          >
            ✕
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Avatar Selection */}
          <div>
            <Label className="text-base font-semibold text-gray-900 mb-3 block">
              {t('avatar')}
            </Label>

            <div className="flex items-start gap-6">
              {/* Current Avatar Display */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-amber-400 flex items-center justify-center text-4xl overflow-hidden border-4 border-white shadow-lg">
                    {editedAvatarType === 'emoji' && editedUserAvatar && (
                      <span>{editedUserAvatar}</span>
                    )}
                    {editedAvatarType === 'image' && editedUserAvatar && (
                      <img src={editedUserAvatar} alt="Avatar" className="w-full h-full object-cover" />
                    )}
                    {editedAvatarType === 'none' && (
                      <User className="h-12 w-12 text-white" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 text-center">{t('clickToChange')}</p>
              </div>

              {/* Avatar Options */}
              <div className="flex-1 space-y-3">
                <button
                  onClick={() => {
                    onAvatarTypeChange('emoji');
                    if (!editedUserAvatar || editedAvatarType !== 'emoji') {
                      onAvatarChange('😊');
                    }
                  }}
                  className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${editedAvatarType === 'emoji' ? 'border-yellow-400 bg-yellow-50' : 'hover:border-yellow-400 hover:bg-yellow-50'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-100 to-amber-100 flex items-center justify-center text-xl">
                    😊
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-gray-900">{t('chooseEmoji')}</p>
                    <p className="text-xs text-gray-500">{t('selectFromEmojis')}</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    document.getElementById('avatar-upload')?.click();
                  }}
                  className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${editedAvatarType === 'image' ? 'border-yellow-400 bg-yellow-50' : 'hover:border-yellow-400 hover:bg-yellow-50'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-100 to-amber-100 flex items-center justify-center text-xl">
                    <ImageIcon className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-gray-900">{t('chooseImage')}</p>
                    <p className="text-xs text-gray-500">{t('uploadPhoto')}</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onAvatarTypeChange('none');
                    onAvatarChange('');
                  }}
                  className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${editedAvatarType === 'none' ? 'border-gray-400 bg-gray-50' : 'hover:border-gray-400 hover:bg-gray-50'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-gray-900">{t('removeAvatar')}</p>
                    <p className="text-xs text-gray-500">{t('useDefaultIcon')}</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Emoji Picker - Shows when emoji type is selected */}
            {editedAvatarType === 'emoji' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-4 bg-gray-50 rounded-lg"
              >
                <p className="text-sm font-semibold text-gray-700 mb-3">{t('selectEmoji')}</p>
                <div className="grid grid-cols-8 gap-2">
                  {['😊', '😎', '🤗', '🥳', '😇', '🤩', '😺', '🐶', '🐱', '🦊', '🐼', '🐨', '🦁', '🐯', '🐸', '🐵'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => onAvatarChange(emoji)}
                      className={`text-3xl p-3 rounded-lg transition-all hover:scale-110 ${editedUserAvatar === emoji
                        ? 'bg-yellow-100 ring-2 ring-yellow-400'
                        : 'hover:bg-white'
                        }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Name Input */}
          <div>
            <Label htmlFor="edit-user-name" className="text-base font-semibold text-gray-900">
              {t('name')}
            </Label>
            <Input
              id="edit-user-name"
              value={editedUserName}
              onChange={(e) => onNameChange(e.target.value)}
              className="mt-2"
              placeholder={t('enterName')}
            />
          </div>

          {/* Email Display (Read-only) */}
          <div>
            <Label className="text-base font-semibold text-gray-900">
              {t('email')}
            </Label>
            <div className="mt-2 px-4 py-2 bg-gray-100 rounded-lg text-gray-600">
              {userEmail}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={onSave}
            className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg font-semibold"
          >
            {t('save')}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

interface SystemSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SystemSettingsModal({
  isOpen,
  onClose,
}: SystemSettingsModalProps) {
  const { t, language, setSystemLanguage } = useTranslation();
  const [localLanguage, setLocalLanguage] = useState(language);

  // Sync local state with global state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalLanguage(language);
    }
  }, [isOpen, language]);

  const handleSave = () => {
    setSystemLanguage(localLanguage);

    // Show toast in the NEW language
    const messages = {
      ja: '言語を変更しました',
      ko: '언어가 변경되었습니다',
      en: 'Language changed successfully'
    };

    toast.success(messages[localLanguage]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-amber-400 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <Settings className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">{t('systemSettings')}</h2>
              <p className="text-yellow-100 text-xs">System Settings</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full w-8 h-8 p-0"
          >
            ✕
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Language Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-5 w-5 text-gray-700" />
              <h3 className="font-bold text-gray-900">{t('languageSettings')}</h3>
            </div>
            <div className="space-y-2">
              {[
                { value: 'ja', label: '日本語 (Japanese)', flag: '🇯🇵' },
                { value: 'ko', label: '한국어 (Korean)', flag: '🇰🇷' },
                { value: 'en', label: 'English', flag: '🇺🇸' },
              ].map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => setLocalLanguage(lang.value as 'ja' | 'ko' | 'en')}
                  className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${localLanguage === lang.value
                    ? 'border-yellow-400 bg-yellow-50'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="font-semibold text-gray-900">{lang.label}</span>
                  {localLanguage === lang.value && (
                    <span className="ml-auto text-yellow-600 font-bold">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSave}
            className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg font-semibold"
          >
            {t('save')}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
