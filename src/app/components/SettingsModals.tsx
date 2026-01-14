import { motion } from 'motion/react';
import { User, Settings, Globe, Mic, Video, Bot, Languages, Image as ImageIcon } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { toast } from 'sonner';

// Simple translation helper
const t = (lang: 'ja' | 'ko' | 'en', key: string): string => {
  const translations: Record<string, Record<'ja' | 'ko' | 'en', string>> = {
    profileSettings: { ja: 'プロフィール設定', ko: '프로필 설정', en: 'Profile Settings' },
    systemSettings: { ja: 'システム設定', ko: '시스템 설정', en: 'System Settings' },
    avatar: { ja: 'アバター', ko: '아바타', en: 'Avatar' },
    emoji: { ja: '絵文字', ko: '이모지', en: 'Emoji' },
    image: { ja: '画像', ko: '이미지', en: 'Image' },
    none: { ja: 'なし', ko: '없음', en: 'None' },
    name: { ja: '名前', ko: '이름', en: 'Name' },
    email: { ja: 'メールアドレス', ko: '이메일 주소', en: 'Email Address' },
    cancel: { ja: 'キャンセル', ko: '취소', en: 'Cancel' },
    save: { ja: '保存', ko: '저장', en: 'Save' },
    languageSettings: { ja: '言語設定', ko: '언어 설정', en: 'Language Settings' },
    audioSettings: { ja: 'オーディオ設定', ko: '오디오 설정', en: 'Audio Settings' },
    videoSettings: { ja: 'ビデオ設定', ko: '비디오 설정', en: 'Video Settings' },
    translationSettings: { ja: 'Uri-Tomo AI翻訳設定', ko: 'Uri-Tomo AI 번역 설정', en: 'Uri-Tomo AI Translation' },
    generalSettings: { ja: '一般設定', ko: '일반 설정', en: 'General Settings' },
    microphone: { ja: 'マイク', ko: '마이크', en: 'Microphone' },
    speaker: { ja: 'スピーカー', ko: '스피커', en: 'Speaker' },
    camera: { ja: 'カメラ', ko: '카메라', en: 'Camera' },
    resolution: { ja: '解像度', ko: '해상도', en: 'Resolution' },
    noiseCancellation: { ja: 'ノイズキャンセル', ko: '노이즈 제거', en: 'Noise Cancellation' },
    beautyFilter: { ja: 'ビューティーフィルター', ko: '뷰티 필터', en: 'Beauty Filter' },
    realtimeTranslation: { ja: 'リアルタイム翻訳', ko: '실시간 번역', en: 'Realtime Translation' },
    termDescription: { ja: '用語解説', ko: '용어 설명', en: 'Term Description' },
    translationPair: { ja: '翻訳言語ペア', ko: '번역 언어 쌍', en: 'Translation Pair' },
    autoRecord: { ja: '会議の自動録画', ko: '회의 자동 녹화', en: 'Auto Record Meeting' },
    notificationSound: { ja: '通知音', ko: '알림음', en: 'Notification Sound' },
    clickToChange: { ja: 'クリックして変更', ko: '클릭하여 변경', en: 'Click to change' },
    chooseEmoji: { ja: '絵文字を選択', ko: '이모지 선택', en: 'Choose Emoji' },
    selectFromEmojis: { ja: '絵文字から選択します', ko: '이모지에서 선택합니다', en: 'Select from emojis' },
    uploadImage: { ja: '画像をアップロード', ko: '이미지 업로드', en: 'Upload Image' },
    uploadYourPhoto: { ja: '写真をアップロードします', ko: '사진을 업로드합니다', en: 'Upload your photo' },
    removeAvatar: { ja: 'アバターを削除', ko: '아바타 제거', en: 'Remove Avatar' },
    useDefaultIcon: { ja: 'デフォルトアイコンを使用', ko: '기본 아이콘 사용', en: 'Use default icon' },
    selectEmoji: { ja: '絵文字を選択', ko: '이모지 선택', en: 'Select Emoji' },
  };
  return translations[key]?.[lang] || key;
};

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
  systemLanguage: 'ja' | 'ko' | 'en';
  onNameChange: (name: string) => void;
  onAvatarChange: (avatar: string) => void;
  onAvatarTypeChange: (type: 'emoji' | 'image' | 'none') => void;
  onSave: () => void;
  onAvatarImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ProfileSettingsModal({
  isOpen,
  onClose,
  userName,
  userEmail,
  editedUserName,
  editedUserAvatar,
  editedAvatarType,
  systemLanguage,
  onNameChange,
  onAvatarChange,
  onAvatarTypeChange,
  onSave,
  onAvatarImageUpload,
}: ProfileSettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-amber-400 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">{t(systemLanguage, 'profileSettings')}</h2>
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
              {t(systemLanguage, 'avatar')}
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
                <p className="text-xs text-gray-500 text-center">{t(systemLanguage, 'clickToChange')}</p>
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
                  className="w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 hover:border-yellow-400 hover:bg-yellow-50"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-100 to-amber-100 flex items-center justify-center text-xl">
                    😊
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-gray-900">{t(systemLanguage, 'chooseEmoji')}</p>
                    <p className="text-xs text-gray-500">{t(systemLanguage, 'selectFromEmojis')}</p>
                  </div>
                </button>

                <label className="w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 hover:border-yellow-400 hover:bg-yellow-50 cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-gray-900">{t(systemLanguage, 'uploadImage')}</p>
                    <p className="text-xs text-gray-500">{t(systemLanguage, 'uploadYourPhoto')}</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onAvatarImageUpload}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={() => {
                    onAvatarTypeChange('none');
                    onAvatarChange('');
                  }}
                  className="w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 hover:border-gray-400 hover:bg-gray-50"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-gray-900">{t(systemLanguage, 'removeAvatar')}</p>
                    <p className="text-xs text-gray-500">{t(systemLanguage, 'useDefaultIcon')}</p>
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
                <p className="text-sm font-semibold text-gray-700 mb-3">{t(systemLanguage, 'selectEmoji')}</p>
                <div className="grid grid-cols-8 gap-2">
                  {['😊', '😎', '🤗', '🥳', '😇', '🤩', '😺', '🐶', '🐱', '🦊', '🐼', '🐨', '🦁', '🐯', '🐸', '🐵'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => onAvatarChange(emoji)}
                      className={`text-3xl p-3 rounded-lg transition-all hover:scale-110 ${
                        editedUserAvatar === emoji
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
              {t(systemLanguage, 'name')}
            </Label>
            <Input
              id="edit-user-name"
              value={editedUserName}
              onChange={(e) => onNameChange(e.target.value)}
              className="mt-2"
              placeholder="名前を入力"
            />
          </div>

          {/* Email Display (Read-only) */}
          <div>
            <Label className="text-base font-semibold text-gray-900">
              {t(systemLanguage, 'email')}
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
            {t(systemLanguage, 'cancel')}
          </Button>
          <Button
            onClick={onSave}
            className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg font-semibold"
          >
            {t(systemLanguage, 'save')}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

interface SystemSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemLanguage: 'ja' | 'ko' | 'en';
  onLanguageChange: (lang: 'ja' | 'ko' | 'en') => void;
}

export function SystemSettingsModal({
  isOpen,
  onClose,
  systemLanguage,
  onLanguageChange,
}: SystemSettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-amber-400 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <Settings className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">{t(systemLanguage, 'systemSettings')}</h2>
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
        <div className="overflow-y-auto max-h-[calc(90vh-160px)]">
          {/* Language Settings */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-5 w-5 text-gray-700" />
              <h3 className="font-bold text-gray-900">{t(systemLanguage, 'languageSettings')}</h3>
            </div>
            <div className="space-y-2">
              {[
                { value: 'ja', label: '日本語 (Japanese)', flag: '🇯🇵' },
                { value: 'ko', label: '한국어 (Korean)', flag: '🇰🇷' },
                { value: 'en', label: 'English', flag: '🇺🇸' },
              ].map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => {
                    onLanguageChange(lang.value as 'ja' | 'ko' | 'en');
                    localStorage.setItem('uri-tomo-system-language', lang.value);
                    toast.success(
                      lang.value === 'ja' ? '言語を変更しました' :
                      lang.value === 'ko' ? '언어가 변경되었습니다' :
                      'Language changed successfully'
                    );
                  }}
                  className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                    systemLanguage === lang.value
                      ? 'border-yellow-400 bg-yellow-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="font-semibold text-gray-900">{lang.label}</span>
                  {systemLanguage === lang.value && (
                    <span className="ml-auto text-yellow-600 font-bold">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Audio Settings */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Mic className="h-5 w-5 text-gray-700" />
              <h3 className="font-bold text-gray-900">{t(systemLanguage, 'audioSettings')}</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t(systemLanguage, 'microphone')}
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm">
                  <option>デフォルト - 内蔵マイク (Built-in)</option>
                  <option>外部マイク (USB)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t(systemLanguage, 'speaker')}
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm">
                  <option>デフォルト - 内蔵スピーカー (Built-in)</option>
                  <option>外部スピーカー (USB)</option>
                  <option>ヘッドフォン (Bluetooth)</option>
                </select>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t(systemLanguage, 'noiseCancellation')}</p>
                  <p className="text-xs text-gray-500">バックグラウンドノイズを低減</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-yellow-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Video Settings */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Video className="h-5 w-5 text-gray-700" />
              <h3 className="font-bold text-gray-900">{t(systemLanguage, 'videoSettings')}</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t(systemLanguage, 'camera')}
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm">
                  <option>デフォルト - 内蔵カメラ (Built-in)</option>
                  <option>外部カメラ (USB)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t(systemLanguage, 'resolution')}
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm">
                  <option>HD (720p)</option>
                  <option>Full HD (1080p)</option>
                  <option>4K (2160p)</option>
                </select>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t(systemLanguage, 'beautyFilter')}</p>
                  <p className="text-xs text-gray-500">映像を自動補正</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-yellow-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Translation Settings */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1">
                <Bot className="h-5 w-5 text-yellow-600" />
                <Languages className="h-5 w-5 text-yellow-600" />
              </div>
              <h3 className="font-bold text-gray-900">{t(systemLanguage, 'translationSettings')}</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t(systemLanguage, 'realtimeTranslation')}</p>
                  <p className="text-xs text-gray-500">日韓自動翻訳を有効化</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-yellow-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t(systemLanguage, 'termDescription')}</p>
                  <p className="text-xs text-gray-500">専門用語を自動で解説</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-yellow-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
                </label>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t(systemLanguage, 'translationPair')}
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm">
                  <option>🇯🇵 日本語 ⇄ 🇰🇷 韓国語</option>
                  <option>🇯🇵 日本語 ⇄ 🇺🇸 英語</option>
                  <option>🇰🇷 韓国語 ⇄ 🇺🇸 英語</option>
                </select>
              </div>
            </div>
          </div>

          {/* General Settings */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5 text-gray-700" />
              <h3 className="font-bold text-gray-900">{t(systemLanguage, 'generalSettings')}</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t(systemLanguage, 'autoRecord')}</p>
                  <p className="text-xs text-gray-500">開始時に自動で記録</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-yellow-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t(systemLanguage, 'notificationSound')}</p>
                  <p className="text-xs text-gray-500">参加者の入退室を通知</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-yellow-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
                </label>
              </div>
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
            {t(systemLanguage, 'cancel')}
          </Button>
          <Button
            onClick={onClose}
            className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg font-semibold"
          >
            {t(systemLanguage, 'save')}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
