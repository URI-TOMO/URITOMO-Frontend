import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
import { meetingApi } from '../api/meeting';
import { createLocalVideoTrack, LocalVideoTrack } from 'livekit-client';
import { useTranslation } from '../hooks/useTranslation';

export function MeetingSetup() {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { t, language } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);

  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([]);

  const [selectedMicId, setSelectedMicId] = useState<string>('');
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>('');

  const [previewTrack, setPreviewTrack] = useState<LocalVideoTrack | null>(null);

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
    const savedUser = localStorage.getItem('uri-tomo-user');
    const savedProfile = localStorage.getItem('uri-tomo-user-profile');

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
  }, []);

  useEffect(() => {
    const getDevices = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();

        const micList = devices.filter(d => d.kind === 'audioinput');
        const camList = devices.filter(d => d.kind === 'videoinput');
        const spkList = devices.filter(d => d.kind === 'audiooutput');

        setMics(micList);
        setCameras(camList);
        setSpeakers(spkList);

        if (!selectedMicId && micList.length > 0) setSelectedMicId(micList[0].deviceId);
        if (!selectedCameraId && camList.length > 0) setSelectedCameraId(camList[0].deviceId);
        if (!selectedSpeakerId && spkList.length > 0) setSelectedSpeakerId(spkList[0].deviceId);

        stream.getTracks().forEach(t => t.stop());

      } catch (e) {
        console.error("Error accessing media devices:", e);
        toast.error(t('micPermissionError'));
      }
    };

    getDevices();
  }, [t]);

  useEffect(() => {
    let track: LocalVideoTrack | null = null;

    const startPreview = async () => {
      if (isVideoOn && selectedCameraId) {
        try {
          track = await createLocalVideoTrack({
            deviceId: selectedCameraId,
            resolution: { width: 1280, height: 720 }
          });
          setPreviewTrack(track);
          if (videoRef.current) {
            track.attach(videoRef.current);
          }
        } catch (e) {
          console.error("Failed to create preview track", e);
        }
      }
    };

    if (isVideoOn) {
      startPreview();
    } else {
      setPreviewTrack(null);
    }

    return () => {
      if (track) {
        track.stop();
      }
    };
  }, [isVideoOn, selectedCameraId]);

  useEffect(() => {
    if (previewTrack && videoRef.current) {
      previewTrack.attach(videoRef.current);
    }
  }, [previewTrack, isVideoOn]);

  const handleJoinMeeting = async () => {
    setIsLoading(true);
    try {
      if (previewTrack) {
        previewTrack.stop();
      }

      console.log(`[MeetingSetup] Requesting token for room_id: ${id}`);
      const data = await meetingApi.getLivekitToken(id || '');
      const { token, url } = data;

      if (!token || !url) throw new Error('Token generation failed');

      navigate(`/active-meeting/${id}`, {
        state: {
          livekitToken: token,
          livekitUrl: url,
          participantName: userName,
          initialMicOn: isMicOn,
          initialVideoOn: isVideoOn,
          audioDeviceId: selectedMicId,
          videoDeviceId: selectedCameraId,
          audioOutputDeviceId: selectedSpeakerId
        }
      });

    } catch (error) {
      console.error('Failed to join:', error);
      toast.error(t('joinError'));
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
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-400 to-amber-400 px-6 py-4">
            <div className="flex items-center justify-center">
              <h1 className="text-xl font-bold text-white">{t('deviceSettings')}</h1>
            </div>
          </div>

          {/* Video Preview Area */}
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t('readyToJoin')}
              </h2>
              <p className="text-gray-600">
                {t('checkSettings')}
              </p>
            </div>

            {/* Camera Preview */}
            <div className="mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-lg border-2 border-gray-700"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  {isVideoOn ? (
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover transform -scale-x-100"
                      autoPlay
                      muted
                      playsInline
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center gap-4">
                      <VideoOff className="h-16 w-16 text-gray-500" />
                      <p className="text-gray-400 text-lg">{t('cameraOff')}</p>
                    </div>
                  )}
                </div>

                {/* User Name Tag */}
                <div className="absolute bottom-4 left-4">
                  <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <span className="text-white font-semibold">
                      {userName} ({t('you')})
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
                    <div className={`p-3 rounded-full ${isMicOn ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                      {isMicOn ? (
                        <Mic className="h-6 w-6 text-green-600" />
                      ) : (
                        <MicOff className="h-6 w-6 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{t('mic')}</p>
                      <p className="text-sm text-gray-600">
                        {isMicOn ? t('on') : t('off')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMicOn(!isMicOn)}
                    className={`px-6 py-2 rounded-lg font-semibold transition-colors ${isMicOn
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                      }`}
                  >
                    {isMicOn ? t('turnOff') : t('turnOn')}
                  </button>
                </div>
                <div className="pl-16">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">{t('selectDevice')}</label>
                  <select
                    value={selectedMicId}
                    onChange={(e) => setSelectedMicId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-white text-sm"
                  >
                    {mics.map((mic) => (
                      <option key={mic.deviceId} value={mic.deviceId}>
                        {mic.label || `Microphone ${mic.deviceId.slice(0, 5)}...`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Camera Control */}
              <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${isVideoOn ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                      {isVideoOn ? (
                        <Video className="h-6 w-6 text-green-600" />
                      ) : (
                        <VideoOff className="h-6 w-6 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{t('camera')}</p>
                      <p className="text-sm text-gray-600">
                        {isVideoOn ? t('on') : t('off')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsVideoOn(!isVideoOn)}
                    className={`px-6 py-2 rounded-lg font-semibold transition-colors ${isVideoOn
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                      }`}
                  >
                    {isVideoOn ? t('turnOff') : t('turnOn')}
                  </button>
                </div>
                <div className="pl-16">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">{t('selectDevice')}</label>
                  <select
                    value={selectedCameraId}
                    onChange={(e) => setSelectedCameraId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-white text-sm"
                  >
                    {cameras.map((camera) => (
                      <option key={camera.deviceId} value={camera.deviceId}>
                        {camera.label || `Camera ${camera.deviceId.slice(0, 5)}...`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Audio/Speaker Control */}
              <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${isAudioOn ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                      {isAudioOn ? (
                        <Volume2 className="h-6 w-6 text-green-600" />
                      ) : (
                        <VolumeX className="h-6 w-6 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{t('speaker')}</p>
                      <p className="text-sm text-gray-600">
                        {isAudioOn ? t('on') : t('off')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsAudioOn(!isAudioOn)}
                    className={`px-6 py-2 rounded-lg font-semibold transition-colors ${isAudioOn
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                      }`}
                  >
                    {isAudioOn ? t('turnOff') : t('turnOn')}
                  </button>
                </div>
                <div className="pl-16">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">{t('selectDevice')}</label>
                  <select
                    value={selectedSpeakerId}
                    onChange={(e) => setSelectedSpeakerId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-white text-sm"
                    disabled={speakers.length === 0}
                  >
                    {speakers.length > 0 ? (
                      speakers.map((audio) => (
                        <option key={audio.deviceId} value={audio.deviceId}>
                          {audio.label || `Speaker ${audio.deviceId.slice(0, 5)}...`}
                        </option>
                      ))
                    ) : (
                      <option value="">{t('defaultDevice')}</option>
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Join Button */}
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={() => {
                  console.log('Setup cancelled, returning to room detail');
                  navigate(`/meeting/${id}`);
                }}
                variant="outline"
                className="px-8 py-6 text-lg font-semibold border-2 border-gray-300 hover:bg-gray-50"
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={handleJoinMeeting}
                disabled={isLoading}
                className="px-8 py-6 text-lg font-semibold bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 text-white shadow-lg"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('connecting')}
                  </span>
                ) : (
                  t('joinMeeting')
                )}
              </Button>
            </div>

            {/* Info Message */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 text-center">
                💡 {t('changeSettingsAnytime')}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Settings Modals */}
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
          toast.success(t('profileUpdated'));
          setShowProfileSettings(false);
        }}
      />

      <SystemSettingsModal
        isOpen={showSystemSettings}
        onClose={() => setShowSystemSettings(false)}
      />
    </div>
  );
}