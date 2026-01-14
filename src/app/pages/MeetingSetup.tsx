import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Settings,
  ArrowLeft,
  Check,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { ProfileSettingsModal, SystemSettingsModal } from '../components/SettingsModals';
import { toast } from 'sonner';

declare global {
  interface Window {
    electron: {
      invokeApi: (channel: string, data: any) => Promise<any>;
    }
  }
}

export function MeetingSetup() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [selectedMic, setSelectedMic] = useState('default-mic');
  const [selectedCamera, setSelectedCamera] = useState('default-camera');
  const [selectedAudio, setSelectedAudio] = useState('default-audio');
  
  const [userName, setUserName] = useState(() => {
    const savedUser = localStorage.getItem('uri-tomo-user');
    return savedUser ? savedUser.split('@')[0] : 'Me';
  });

  // Profile and system settings states
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showSystemSettings, setShowSystemSettings] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [avatarType, setAvatarType] = useState<'emoji' | 'image' | 'none'>('none');
  const [editedUserName, setEditedUserName] = useState('');
  const [editedUserAvatar, setEditedUserAvatar] = useState('');
  const [editedAvatarType, setEditedAvatarType] = useState<'emoji' | 'image' | 'none'>('none');
  const [systemLanguage, setSystemLanguage] = useState<'ja' | 'ko' | 'en'>('ja');

  // Listen for sidebar button clicks
  useEffect(() => {
    const handleOpenProfile = () => {
      setEditedUserName(userName);
      setEditedUserAvatar(userAvatar);
      setEditedAvatarType(avatarType);
      setShowProfileSettings(true);
    };

    const handleOpenSettings = () => {
      setShowSystemSettings(true);
    };

    // Listen for profile updates from other pages
    const handleProfileUpdated = () => {
      const savedProfile = localStorage.getItem('uri-tomo-user-profile');
      if (savedProfile) {
        try {
          const profile = JSON.parse(savedProfile);
          setUserName(profile.name || 'ユーザー');
          setUserEmail(profile.email || '');
          setUserAvatar(profile.avatar || '');
          setAvatarType(profile.avatarType || 'none');
        } catch (e) {
          console.error('Failed to load profile:', e);
        }
      }
    };

    window.addEventListener('open-profile-settings', handleOpenProfile);
    window.addEventListener('open-system-settings', handleOpenSettings);
    window.addEventListener('profile-updated', handleProfileUpdated);

    return () => {
      window.removeEventListener('open-profile-settings', handleOpenProfile);
      window.removeEventListener('open-system-settings', handleOpenSettings);
      window.removeEventListener('profile-updated', handleProfileUpdated);
    };
  }, [userName, userAvatar, avatarType]);

  useEffect(() => {
    // Load user profile
    const savedUser = localStorage.getItem('uri-tomo-user');
    const savedProfile = localStorage.getItem('uri-tomo-user-profile');
    const savedLanguage = localStorage.getItem('uri-tomo-system-language');

    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        setUserName(profile.name || 'ユーザー');
        setUserEmail(profile.email || savedUser || '');
        setUserAvatar(profile.avatar || '');
        setAvatarType(profile.avatarType || 'none');
      } catch (e) {
        if (savedUser) {
          setUserEmail(savedUser);
          setUserName(savedUser.split('@')[0]);
        }
      }
    } else if (savedUser) {
      setUserEmail(savedUser);
      setUserName(savedUser.split('@')[0]);
    }

    if (savedLanguage) {
      setSystemLanguage(savedLanguage as 'ja' | 'ko' | 'en');
    }
  }, []);

  // Mock device lists
  const microphones = [
    { id: 'default-mic', name: 'デフォルト - 内蔵マイク' },
    { id: 'external-mic-1', name: '外部マイク 1 (USB)' },
    { id: 'external-mic-2', name: 'Bluetooth ヘッドセット' },
  ];

  const cameras = [
    { id: 'default-camera', name: 'デフォルト - 内蔵カメラ' },
    { id: 'external-camera-1', name: 'USB ウェブカメラ HD' },
    { id: 'external-camera-2', name: '仮想カメラ' },
  ];

  const audioDevices = [
    { id: 'default-audio', name: 'デフォルト - 内蔵スピーカー' },
    { id: 'external-audio-1', name: 'ヘッドホン (Bluetooth)' },
    { id: 'external-audio-2', name: '外部スピーカー (USB)' },
  ];

  const handleJoinMeeting = async () => {
    setIsLoading(true);
    try {
      let token, url;

      // 1. Electron Main Process에 토큰 요청
      if (window.electron) {
        console.log(`[MeetingSetup] Requesting token for room: ${id}`);
        const result = await window.electron.invokeApi('get-livekit-token', {
          roomName: id || 'default-room',
          participantName: userName
        });
        token = result.token;
        url = result.url;
      } else {
        // Electron이 감지되지 않을 때 (예외 처리)
        console.warn("Electron not detected.");
        throw new Error("Electron 환경에서 실행해주세요.");
      }

      if (!token || !url) throw new Error('Token generation failed');

      // 2. 토큰과 설정 상태(Mic/Video)를 가지고 ActiveMeeting으로 이동
      navigate(`/active-meeting/${id}`, { 
        state: { 
          livekitToken: token, 
          livekitUrl: url,
          participantName: userName,
          initialMicOn: isMicOn,    // 사용자가 Setup 화면에서 세팅한 값 전달
          initialVideoOn: isVideoOn 
        } 
      });

    } catch (error) {
      console.error('Failed to join:', error);
      toast.error('会議に参加できませんでした。'); // "회의 참가 실패"
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl w-full my-8"
      >
        <Card className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-400 to-amber-400 px-6 py-4">
            <div className="flex items-center justify-center">
              <h1 className="text-xl font-bold text-white">デバイス設定</h1>
            </div>
          </div>

          {/* Video Preview Area */}
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ミーティングに参加する準備ができました
              </h2>
              <p className="text-gray-600">
                カメラとマイクの設定を確認してください
              </p>
            </div>

            {/* Camera Preview */}
            <div className="mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative aspect-video bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl overflow-hidden shadow-lg"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  {isVideoOn ? (
                    <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 to-amber-400 flex items-center justify-center text-white font-bold text-5xl shadow-2xl">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center gap-4">
                      <VideoOff className="h-16 w-16 text-gray-500" />
                      <p className="text-gray-400 text-lg">カメラはオフです</p>
                    </div>
                  )}
                </div>

                {/* User Name Tag */}
                <div className="absolute bottom-4 left-4">
                  <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <span className="text-white font-semibold">
                      {userName} (あなた)
                    </span>
                  </div>
                </div>

                {/* Mic Status Indicator */}
                <div className="absolute bottom-4 right-4">
                  {isMicOn ? (
                    <div className="bg-green-600 p-3 rounded-lg shadow-lg">
                      <Mic className="h-5 w-5 text-white" />
                    </div>
                  ) : (
                    <div className="bg-red-600 p-3 rounded-lg shadow-lg">
                      <MicOff className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Device Controls */}
            <div className="space-y-4 mb-8">
              {/* Microphone Control */}
              <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${
                      isMicOn ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {isMicOn ? (
                        <Mic className="h-6 w-6 text-green-600" />
                      ) : (
                        <MicOff className="h-6 w-6 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">マイク</p>
                      <p className="text-sm text-gray-600">
                        {isMicOn ? 'オン - 音声が聞こえます' : 'オフ - ミュート中'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMicOn(!isMicOn)}
                    className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                      isMicOn
                        ? 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                    {isMicOn ? 'オフにする' : 'オンにする'}
                  </button>
                </div>
                <div className="pl-16">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">デバイス選択</label>
                  <select
                    value={selectedMic}
                    onChange={(e) => setSelectedMic(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-white text-sm"
                  >
                    {microphones.map((mic) => (
                      <option key={mic.id} value={mic.id}>
                        {mic.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Camera Control */}
              <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${
                      isVideoOn ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {isVideoOn ? (
                        <Video className="h-6 w-6 text-green-600" />
                      ) : (
                        <VideoOff className="h-6 w-6 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">カメラ</p>
                      <p className="text-sm text-gray-600">
                        {isVideoOn ? 'オン - 映像が表示されます' : 'オフ - 映像なし'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsVideoOn(!isVideoOn)}
                    className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                      isVideoOn
                        ? 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                    {isVideoOn ? 'オフにする' : 'オンにする'}
                  </button>
                </div>
                <div className="pl-16">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">デバイス選択</label>
                  <select
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-white text-sm"
                  >
                    {cameras.map((camera) => (
                      <option key={camera.id} value={camera.id}>
                        {camera.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Audio/Speaker Control */}
              <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${
                      isAudioOn ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {isAudioOn ? (
                        <Volume2 className="h-6 w-6 text-green-600" />
                      ) : (
                        <VolumeX className="h-6 w-6 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">スピーカー</p>
                      <p className="text-sm text-gray-600">
                        {isAudioOn ? 'オン - 音声が聞こえます' : 'オフ - ミュート中'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsAudioOn(!isAudioOn)}
                    className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                      isAudioOn
                        ? 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                    {isAudioOn ? 'オフにする' : 'オンにする'}
                  </button>
                </div>
                <div className="pl-16">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">デバイス選択</label>
                  <select
                    value={selectedAudio}
                    onChange={(e) => setSelectedAudio(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-white text-sm"
                  >
                    {audioDevices.map((audio) => (
                      <option key={audio.id} value={audio.id}>
                        {audio.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Join Button */}
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={() => navigate(`/meeting/${id}`)}
                variant="outline"
                className="px-8 py-6 text-lg font-semibold border-2 border-gray-300 hover:bg-gray-50"
              >
                キャンセル
              </Button>
              <Button
                onClick={handleJoinMeeting}
                disabled={isLoading}
                className="px-8 py-6 text-lg font-semibold bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 text-white shadow-lg"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    接続中...
                    </span>
                    ) : (
                      "ミーティングに参加" // 또는 기존 텍스트 유지
                      )}
              </Button>
            </div>

            {/* Info Message */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 text-center">
                💡 ミーティング中でもいつでもカメラとマイクの設定を変更できます
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        isOpen={showProfileSettings}
        onClose={() => setShowProfileSettings(false)}
        userName={userName}
        userEmail={userEmail}
        userAvatar={userAvatar}
        avatarType={avatarType}
        editedUserName={editedUserName}
        editedUserAvatar={editedUserAvatar}
        editedAvatarType={editedAvatarType}
        systemLanguage={systemLanguage}
        onNameChange={setEditedUserName}
        onAvatarChange={setEditedUserAvatar}
        onAvatarTypeChange={setEditedAvatarType}
        onAvatarImageUpload={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              setEditedUserAvatar(reader.result as string);
            };
            reader.readAsDataURL(file);
          }
        }}
        onSave={() => {
          setUserName(editedUserName);
          setUserAvatar(editedUserAvatar);
          setAvatarType(editedAvatarType);
          const profile = {
            name: editedUserName,
            email: userEmail,
            avatar: editedUserAvatar,
            avatarType: editedAvatarType,
          };
          localStorage.setItem('uri-tomo-user-profile', JSON.stringify(profile));
          window.dispatchEvent(new Event('profile-updated'));
          toast.success('プロフィールが更新されました');
          setShowProfileSettings(false);
        }}
      />

      {/* System Settings Modal */}
      <SystemSettingsModal
        isOpen={showSystemSettings}
        onClose={() => setShowSystemSettings(false)}
        systemLanguage={systemLanguage}
        onLanguageChange={setSystemLanguage}
      />
    </div>
  );
}

// Simple Card component for this page
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}