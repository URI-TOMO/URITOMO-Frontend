import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { 
  Video, VideoOff, Mic, MicOff, PhoneOff, Users, Settings, Bot,
  MessageSquare, Languages, Pin, ChevronRight, ChevronLeft,
  MonitorUp, Paperclip, Smile, AlertTriangle, Clock, Send, Monitor, X
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { ProfileSettingsModal, SystemSettingsModal } from '../components/SettingsModals';
import { toast } from 'sonner';
// LiveKit imports
import {
  LiveKitRoom,
  VideoTrack,
  useTracks,
  RoomAudioRenderer,
  useRoomContext,
  useLocalParticipant
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';

// --- Utils ---
const ensureMediaPermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    stream.getTracks().forEach(t => t.stop());
  } catch (e) {
    console.warn('Media permission check failed:', e);
  }
};

// --- Types ---
interface Participant {
  id: string;
  name: string;
  isVideoOn: boolean;
  isMuted: boolean;
  isSpeaking?: boolean;
  language?: 'ja' | 'ko';
}

interface TranslationLog {
  id: string;
  speaker: string;
  originalText: string;
  translatedText: string;
  originalLang: 'ja' | 'ko';
  timestamp: Date;
}

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
  isAI?: boolean;
}

interface TermExplanation {
  id: string;
  term: string;
  explanation: string;
  detectedFrom: string;
  timestamp: Date;
}

type SidebarTab = 'translation' | 'chat' | 'members';

// --- Content Component ---
function ActiveMeetingContent({ 
  meetingId, 
  currentUserProp,
  devices: initialDevices, 
  initialSettings
}: { 
  meetingId: string, 
  currentUserProp: any,
  devices?: { audioInputId?: string; videoInputId?: string; audioOutputId?: string },
  initialSettings?: { isMicOn: boolean, isVideoOn: boolean }
}) {
  const navigate = useNavigate();
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();

  // Tracks
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], { onlySubscribed: false });
  const localCameraTrack = tracks.find(t => t.participant.isLocal && t.source === Track.Source.Camera);
  const localScreenTrack = tracks.find(t => t.participant.isLocal && t.source === Track.Source.ScreenShare);
  const remoteTracks = tracks.filter(t => !t.participant.isLocal);
  
  const [currentUser] = useState(currentUserProp);
  const [isMicOn, setIsMicOn] = useState(initialSettings?.isMicOn ?? true);
  const [isVideoOn, setIsVideoOn] = useState(initialSettings?.isVideoOn ?? true);

  // Device List State
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState(initialDevices?.audioInputId || '');
  const [selectedCameraId, setSelectedCameraId] = useState(initialDevices?.videoInputId || '');
  const [selectedSpeakerId, setSelectedSpeakerId] = useState(initialDevices?.audioOutputId || '');

  // Screen Share State
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showScreenPickerModal, setShowScreenPickerModal] = useState(false);
  const [availableScreens, setAvailableScreens] = useState<Array<{ id: string, name: string, thumbnail: string }>>([]);

  // UI State
  const [showSettings, setShowSettings] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showEndMeetingConfirm, setShowEndMeetingConfirm] = useState(false);
  
  const [activeTab, setActiveTab] = useState<SidebarTab>('translation');
  const [chatInput, setChatInput] = useState('');
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [duration, setDuration] = useState(0);
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [translationLogs, setTranslationLogs] = useState<TranslationLog[]>([]);
  const [termExplanations, setTermExplanations] = useState<TermExplanation[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [meetingTitle] = useState('日韓プロジェクト会議');
  const [startTime] = useState(new Date());

  // Profile Settings State
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showSystemSettings, setShowSystemSettings] = useState(false);
  const [userName, setUserName] = useState('ユーザー');
  const [userEmail, setUserEmail] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [avatarType, setAvatarType] = useState<'emoji' | 'image' | 'none'>('none');
  const [editedUserName, setEditedUserName] = useState('');
  const [editedUserAvatar, setEditedUserAvatar] = useState('');
  const [editedAvatarType, setEditedAvatarType] = useState<'emoji' | 'image' | 'none'>('none');
  const [systemLanguage, setSystemLanguage] = useState<'ja' | 'ko' | 'en'>('ja');

  // --- Logic 1: Screen Share IPC Listener ---
  useEffect(() => {
    if ((window as any).ipcRenderer) {
      (window as any).ipcRenderer.onOpenScreenPicker((sources: any) => {
        setAvailableScreens(sources);
        setShowScreenPickerModal(true);
      });
    }
  }, []);

  useEffect(() => {
    if (localParticipant) {
      setIsScreenSharing(localParticipant.isScreenShareEnabled);
    }
  }, [localParticipant, tracks]);

  // --- Logic 2: Device Sync ---
  useEffect(() => {
    if (!showSettings) return;
    const syncDevices = async () => {
      await ensureMediaPermission();
      const list = await navigator.mediaDevices.enumerateDevices();
      const micList = list.filter(d => d.kind === 'audioinput');
      const camList = list.filter(d => d.kind === 'videoinput');
      const spkList = list.filter(d => d.kind === 'audiooutput');
      setMics(micList); setCameras(camList); setSpeakers(spkList);

      if (room) {
        let tm = room.getActiveDevice('audioinput') || selectedMicId;
        let tc = room.getActiveDevice('videoinput') || selectedCameraId;
        let ts = room.getActiveDevice('audiooutput') || selectedSpeakerId;
        if (micList.length && !micList.find(d => d.deviceId === tm)) tm = micList[0].deviceId;
        if (camList.length && !camList.find(d => d.deviceId === tc)) tc = camList[0].deviceId;
        if (spkList.length && !spkList.find(d => d.deviceId === ts)) ts = spkList[0].deviceId;
        setSelectedMicId(tm); setSelectedCameraId(tc); setSelectedSpeakerId(ts);
      }
    };
    syncDevices();
    navigator.mediaDevices.addEventListener('devicechange', syncDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', syncDevices);
  }, [showSettings, room]);

  // --- Handlers ---
  const handleDeviceChange = async (kind: MediaDeviceKind, id: string) => {
    if (!room) return;
    try {
      await room.switchActiveDevice(kind, id);
      if (kind === 'audioinput') setSelectedMicId(id);
      if (kind === 'videoinput') setSelectedCameraId(id);
      if (kind === 'audiooutput') setSelectedSpeakerId(id);
      toast.success('デバイスを変更しました');
    } catch (e) {
      console.error(e);
      toast.error('切り替えに失敗しました');
    }
  };

  const toggleScreenShare = async () => {
    if (!localParticipant) {
      toast.error('ユーザー情報が取得できません');
      return;
    }
    const newState = !isScreenSharing;
    try {
      await localParticipant.setScreenShareEnabled(newState, { audio: false });
      setIsScreenSharing(newState);
    } catch (e: any) {
      console.warn('Screen share failed:', e);
      if (e.name === 'NotAllowedError' || e.message?.includes('Permission denied')) {
        toast.info('キャンセルしました');
      } else {
        toast.error('画面共有を開始できませんでした');
      }
      setIsScreenSharing(false);
    }
  };

  const handleScreenSelect = (id: string) => {
    (window as any).ipcRenderer?.selectScreenSource(id);
    setShowScreenPickerModal(false);
  };

  const handleScreenPickerCancel = () => {
    (window as any).ipcRenderer?.selectScreenSource(null);
    setShowScreenPickerModal(false);
    setIsScreenSharing(false);
  };

  const toggleMic = async () => {
    const newState = !isMicOn;
    setIsMicOn(newState);
    if (localParticipant) await localParticipant.setMicrophoneEnabled(newState);
  };

  const toggleVideo = async () => {
    const newState = !isVideoOn;
    setIsVideoOn(newState);
    if (localParticipant) await localParticipant.setCameraEnabled(newState);
  };

  // --- Chat & Meeting Actions ---
  const handleSendChat = () => {
    if (chatInput.trim()) {
      setChatMessages([...chatMessages, { id: Date.now().toString(), sender: currentUser.name, message: chatInput, timestamp: new Date() }]);
      setChatInput('');
    }
  };

  const handleFileAttach = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) setChatMessages([...chatMessages, { id: Date.now().toString(), sender: currentUser.name, message: `📎 ${file.name}`, timestamp: new Date() }]);
    };
    input.click();
  };

  // ★ここに追加: スタンプ選択ハンドラ
  const handleStickerSelect = (sticker: string) => {
    setChatMessages([...chatMessages, { id: Date.now().toString(), sender: currentUser.name, message: sticker, timestamp: new Date() }]);
    setShowStickerPicker(false);
  };

  // ★ここに追加: 会議終了ハンドラ
  const handleEndMeeting = () => setShowEndMeetingConfirm(true);
  
  // ★ここに追加: 会議終了確定ハンドラ
  const confirmEndMeeting = () => {
    // 実際の議事録保存処理などがここに入ります
    navigate(`/minutes/${meetingId || Date.now()}`);
  };

  // --- Initial Data ---
  useEffect(() => {
    const loadProfile = () => {
      const savedUser = localStorage.getItem('uri-tomo-user');
      const savedProfile = localStorage.getItem('uri-tomo-user-profile');
      const savedLanguage = localStorage.getItem('uri-tomo-system-language');
      if (savedProfile) {
        try {
          const p = JSON.parse(savedProfile);
          setUserName(p.name); setUserEmail(p.email); setUserAvatar(p.avatar); setAvatarType(p.avatarType);
        } catch (e) {}
      } else if (savedUser) {
        setUserEmail(savedUser); setUserName(savedUser.split('@')[0]);
      }
      if (savedLanguage) setSystemLanguage(savedLanguage as 'ja' | 'ko' | 'en');
    };
    loadProfile();

    setParticipants([
      { id: '1', name: 'User A', isVideoOn: true, isMuted: false, language: 'ja' },
      { id: '2', name: 'User B', isVideoOn: true, isMuted: false, language: 'ko' }
    ]);
    setTranslationLogs([
      { id: '1', speaker: 'User A', originalText: 'プロジェクトの進捗について報告します', translatedText: '프로젝트 진행 상황에 대해 보고합니다', originalLang: 'ja', timestamp: new Date(Date.now() - 5000) },
      { id: '2', speaker: 'User B', originalText: '感사します。次のステップについて論議したいです', translatedText: 'ありがとうございます。次のステップについて議論したいです', originalLang: 'ko', timestamp: new Date(Date.now() - 3000) },
    ]);
    setTermExplanations([
      { id: '1', term: 'プロジェクトの進捗', explanation: 'プロジェクトがどれだけ進んでいるかを示す指標。', detectedFrom: 'User Aの発言', timestamp: new Date(Date.now() - 4000) },
    ]);
    const timer = setInterval(() => setDuration(p => p + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  return (
    <div className="h-screen w-full flex flex-col bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-white font-bold text-lg">{meetingTitle}</h1>
          <div className="flex items-center gap-2 px-3 py-1 bg-red-600 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-sm font-semibold">{formatDuration(duration)}</span>
          </div>
        </div>
      </header>

      {/* Main Area */}
      <div className="flex-1 overflow-hidden relative min-h-0">
        {!isSidebarOpen && (
          <motion.button initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} onClick={() => setIsSidebarOpen(true)} className="absolute top-4 right-4 z-10 bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 font-semibold transition-all">
            <Bot className="h-5 w-5" /><span>Uri-Tomoを開く</span><ChevronLeft className="h-5 w-5" />
          </motion.button>
        )}

        <PanelGroup direction="horizontal" className="h-full">
          {/* Video Grid */}
          <Panel defaultSize={isSidebarOpen ? 70 : 100} minSize={50}>
            <div className="h-full p-4 bg-gray-900 flex flex-col">
              <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
                {/* Uri-Tomo Bot */}
                <motion.div className="relative bg-gradient-to-br from-yellow-900 to-amber-900 rounded-xl overflow-hidden border-2 border-yellow-400 transition-all">
                  <div className="absolute top-3 right-3 z-10 bg-yellow-400 p-2 rounded-lg shadow-lg"><Pin className="h-4 w-4 text-gray-900" /></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-full bg-gradient-to-br from-yellow-400/20 to-amber-400/20 flex items-center justify-center">
                      <Bot className="h-12 w-12 text-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <div className="bg-black/70 backdrop-blur-sm px-3 py-1 rounded-lg flex items-center gap-2"><span className="text-white text-sm font-semibold">Uri-Tomo</span><span className="text-xs text-yellow-300 bg-yellow-600 px-2 py-0.5 rounded font-semibold">AI</span></div>
                    <div className="bg-green-600 p-2 rounded-lg animate-pulse"><Mic className="h-4 w-4 text-white" /></div>
                  </div>
                </motion.div>

                {/* Local User (Camera) */}
                <motion.div className="relative bg-gray-800 rounded-xl overflow-hidden border-2 border-gray-700 hover:border-yellow-400 transition-all">
                  <div className="absolute inset-0 flex items-center justify-center">
                    {localCameraTrack?.publication?.isSubscribed ? (
                      <VideoTrack trackRef={localCameraTrack} className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center"><div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-amber-400 flex items-center justify-center text-white font-bold text-3xl">{currentUser?.name?.charAt(0) || '?'}</div></div>
                    )}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <div className="bg-black/70 backdrop-blur-sm px-3 py-1 rounded-lg flex items-center gap-2"><span className="text-white text-sm font-semibold">{currentUser.name} (あなた)</span></div>
                    {!isMicOn && <div className="bg-red-600 p-2 rounded-lg"><MicOff className="h-4 w-4 text-white" /></div>}
                  </div>
                </motion.div>

                {/* Local User (Screen Share) */}
                {localScreenTrack && (
                  <motion.div className="relative bg-gray-800 rounded-xl overflow-hidden border-2 border-yellow-400 transition-all">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <VideoTrack trackRef={localScreenTrack} className="w-full h-full object-contain bg-black" />
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <div className="bg-black/70 backdrop-blur-sm px-3 py-1 rounded-lg flex items-center gap-2">
                        <span className="text-white text-sm font-semibold">{currentUser.name} (画面共有)</span>
                        <span className="text-xs bg-white text-black px-2 py-0.5 rounded font-bold">YOU</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Remote Participants */}
                {remoteTracks.map((track) => (
                  <motion.div key={track.participant.identity + track.source} className="relative bg-gray-800 rounded-xl overflow-hidden border-2 border-gray-700 hover:border-yellow-400 transition-all">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <VideoTrack 
                        trackRef={track} 
                        className={`w-full h-full ${track.source === Track.Source.ScreenShare ? 'object-contain bg-black' : 'object-cover'}`} 
                      />
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <div className="bg-black/70 backdrop-blur-sm px-3 py-1 rounded-lg flex items-center gap-2">
                        <span className="text-white text-sm font-semibold">{track.participant.identity}</span>
                        {track.source === Track.Source.ScreenShare ? 
                          <span className="text-xs bg-white text-black px-2 py-0.5 rounded font-bold">画面共有</span> : 
                          <span className="text-xs text-gray-300 bg-gray-600 px-2 py-0.5 rounded">REMOTE</span>
                        }
                      </div>
                      {!track.participant.isMicrophoneEnabled && track.source !== Track.Source.ScreenShare && <div className="bg-red-600 p-2 rounded-lg"><MicOff className="h-4 w-4 text-white" /></div>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Panel>

          {/* Sidebar */}
          {isSidebarOpen && (
            <>
              <PanelResizeHandle className="w-2 bg-gray-700 hover:bg-yellow-400 transition-colors cursor-col-resize" />
              <Panel defaultSize={30} minSize={25} maxSize={50}>
                <div className="h-full bg-white flex flex-col">
                  {/* Uri-Tomo Header */}
                  <div className="bg-gradient-to-r from-yellow-400 to-amber-400 px-4 py-3 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><div className="w-8 h-8 bg-white rounded-full flex items-center justify-center"><Bot className="h-5 w-5 text-yellow-600" /></div><div><h3 className="text-white font-bold text-sm">Uri-Tomo</h3><p className="text-yellow-100 text-xs">AI翻訳アシスタント</p></div></div>
                      <button onClick={() => setIsSidebarOpen(false)} className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"><ChevronRight className="h-5 w-5" /></button>
                    </div>
                  </div>
                  
                  {/* Description Section */}
                  <div className="border-b border-gray-200 bg-white max-h-48 overflow-y-auto flex-shrink-0">
                    <div className="sticky top-0 bg-white px-4 pt-4 pb-2 border-b border-gray-100"><div className="flex items-center gap-2"><Bot className="h-4 w-4 text-yellow-600" /><h4 className="font-bold text-gray-900 text-sm">Description</h4><span className="text-xs text-gray-500">({termExplanations.length}件の用語解説)</span></div></div>
                    <div className="p-4">
                      {termExplanations.map((term, index) => (
                        <div key={term.id} className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg p-3 border border-yellow-200 mb-2">
                          <p className="font-bold text-sm text-gray-900 mb-1">{term.term}</p>
                          <p className="text-xs text-gray-700">{term.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-gray-200 bg-gray-50 flex-shrink-0">
                    <button onClick={() => setActiveTab('translation')} className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'translation' ? 'bg-white text-yellow-600 border-b-2 border-yellow-400' : 'text-gray-600'}`}>Translation</button>
                    <button onClick={() => setActiveTab('chat')} className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'chat' ? 'bg-white text-yellow-600 border-b-2 border-yellow-400' : 'text-gray-600'}`}>Chat</button>
                    <button onClick={() => setActiveTab('members')} className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'members' ? 'bg-white text-yellow-600 border-b-2 border-yellow-400' : 'text-gray-600'}`}>Members</button>
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                    {/* Chat Tab */}
                    {activeTab === 'chat' && (
                      <div className="h-full flex flex-col">
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                          {chatMessages.length === 0 ? <p className="text-center text-sm text-gray-500 mt-4">メッセージなし</p> : chatMessages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.sender === currentUser.name ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] rounded-lg p-3 ${msg.sender === currentUser.name ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}><p className="text-sm">{msg.message}</p></div></div>
                          ))}
                        </div>
                        <div className="border-t border-gray-200 p-4 flex gap-2 flex-shrink-0">
                          <button onClick={handleFileAttach} className="p-2 rounded hover:bg-gray-100"><Paperclip className="h-5 w-5" /></button>
                          <button onClick={() => setShowStickerPicker(!showStickerPicker)} className="p-2 rounded hover:bg-gray-100"><Smile className="h-5 w-5" /></button>
                          <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendChat()} className="flex-1 border rounded px-3 py-2 text-sm" placeholder="メッセージ..." />
                          <Button onClick={handleSendChat}><Send className="h-4 w-4" /></Button>
                        </div>
                        {showStickerPicker && (
                          <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                            <div className="grid grid-cols-5 gap-2">{['👍', '👏', '😊', '❤️', '🎉', '✨', '💡', '🔥', '👌', '🙌'].map((s) => (<button key={s} onClick={() => handleStickerSelect(s)} className="text-2xl p-2 hover:bg-gray-200 rounded">{s}</button>))}</div>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Translation Tab */}
                    {activeTab === 'translation' && (
                      <div className="h-full overflow-y-auto p-4 space-y-4 min-h-0">
                        {translationLogs.map(log => (
                          <div key={log.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                            <div className="flex justify-between mb-2"><span className="font-bold text-sm">{log.speaker}</span><span className="text-xs text-gray-500">{log.timestamp.toLocaleTimeString()}</span></div>
                            <p className="text-sm font-bold mb-1">{log.translatedText}</p><p className="text-xs text-gray-500">{log.originalText}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Members Tab */}
                    {activeTab === 'members' && (
                      <div className="h-full overflow-y-auto p-4 space-y-2 min-h-0">
                        {participants.map(p => <div key={p.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded"><span className="text-sm">{p.name}</span></div>)}
                      </div>
                    )}
                  </div>
                </div>
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>

      <footer className="bg-gray-800 border-t border-gray-700 px-6 py-4 flex-shrink-0">
        <div className="flex justify-center gap-4">
          <Button onClick={toggleMic} className={`rounded-full w-12 h-12 ${isMicOn ? 'bg-gray-700' : 'bg-red-600'}`}>{isMicOn ? <Mic className="h-5 w-5 text-white" /> : <MicOff className="h-5 w-5 text-white" />}</Button>
          <Button onClick={toggleVideo} className={`rounded-full w-12 h-12 ${isVideoOn ? 'bg-gray-700' : 'bg-red-600'}`}>{isVideoOn ? <Video className="h-5 w-5 text-white" /> : <VideoOff className="h-5 w-5 text-white" />}</Button>
          <Button onClick={handleEndMeeting} className="rounded-full w-12 h-12 bg-red-600"><PhoneOff className="h-5 w-5 text-white" /></Button>
          <Button onClick={toggleScreenShare} className={`rounded-full w-12 h-12 ${isScreenSharing ? 'bg-yellow-400 hover:bg-yellow-500 text-gray-900' : 'bg-gray-700 hover:bg-gray-600'}`}><MonitorUp className={`h-5 w-5 ${isScreenSharing ? 'text-gray-900' : 'text-white'}`} /></Button>
          <Button onClick={() => setShowSettings(true)} className="rounded-full w-12 h-12 bg-gray-700"><Settings className="h-5 w-5 text-white" /></Button>
        </div>
      </footer>

      {/* Screen Picker Modal (IPC連携) */}
      {showScreenPickerModal && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50"><h3 className="font-bold flex items-center gap-2"><Monitor className="text-blue-600" /> 共有する画面を選択</h3><button onClick={handleScreenPickerCancel}><X className="h-5 w-5" /></button></div>
            <div className="p-6 overflow-y-auto bg-gray-100 grid grid-cols-2 md:grid-cols-3 gap-4">
              {availableScreens.map(s => (
                <button key={s.id} onClick={() => handleScreenSelect(s.id)} className="flex flex-col gap-2 p-2 rounded-xl hover:bg-blue-50 ring-1 ring-gray-200 hover:ring-blue-400 bg-white transition-all">
                  <div className="relative aspect-video bg-gray-800 rounded overflow-hidden"><img src={s.thumbnail} alt={s.name} className="w-full h-full object-contain" /></div>
                  <span className="text-sm font-medium text-gray-700 truncate w-full px-1">{s.name}</span>
                </button>
              ))}
            </div>
            <div className="p-4 border-t bg-white flex justify-end"><Button onClick={handleScreenPickerCancel} variant="outline">キャンセル</Button></div>
          </div>
        </div>
      )}

      {/* Settings Modal (Fixed: Empty Select Fix + Original UI) */}
      {showSettings && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" onClick={() => setShowSettings(false)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-yellow-400 to-amber-400 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3"><div className="w-10 h-10 bg-white rounded-full flex items-center justify-center"><Settings className="h-5 w-5 text-yellow-600" /></div><div><h2 className="text-white font-bold text-lg">システム設定</h2><p className="text-yellow-100 text-xs">Device & Meeting Settings</p></div></div>
              <Button variant="ghost" onClick={() => setShowSettings(false)} className="text-white hover:bg-white/20 rounded-full w-8 h-8 p-0">✕</Button>
            </div>
            
            <div className="overflow-y-auto p-6 space-y-6">
              {/* Audio Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200 pb-2"><Mic className="h-5 w-5 text-gray-700" /><h3 className="font-bold text-gray-900">オーディオ設定</h3></div>
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">マイク</label>
                    <select 
                      value={selectedMicId} 
                      onChange={(e) => handleDeviceChange('audioinput', e.target.value)} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 text-sm bg-white"
                    >
                      {!selectedMicId && <option value="" disabled>デバイスを選択中...</option>}
                      {mics.map(m => <option key={m.deviceId} value={m.deviceId}>{m.label || `Microphone ${m.deviceId.slice(0,5)}...`}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">スピーカー</label>
                    <select 
                      value={selectedSpeakerId} 
                      onChange={(e) => handleDeviceChange('audiooutput', e.target.value)} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 text-sm bg-white"
                      disabled={speakers.length === 0}
                    >
                      {!selectedSpeakerId && <option value="" disabled>デバイスを選択中...</option>}
                      {speakers.map(s => <option key={s.deviceId} value={s.deviceId}>{s.label || `Speaker ${s.deviceId.slice(0,5)}...`}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><div><p className="text-sm font-semibold text-gray-900">ノイズキャンセル</p><p className="text-xs text-gray-500">バックグラウンドノイズを低減</p></div><input type="checkbox" className="toggle" defaultChecked /></div>
                </div>
              </div>

              {/* Video Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200 pb-2"><Video className="h-5 w-5 text-gray-700" /><h3 className="font-bold text-gray-900">ビデオ設定</h3></div>
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">カメラ</label>
                    <select 
                      value={selectedCameraId} 
                      onChange={(e) => handleDeviceChange('videoinput', e.target.value)} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 text-sm bg-white"
                    >
                      {!selectedCameraId && <option value="" disabled>デバイスを選択中...</option>}
                      {cameras.map(c => <option key={c.deviceId} value={c.deviceId}>{c.label || `Camera ${c.deviceId.slice(0,5)}...`}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">解像度</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 text-sm bg-white"><option>HD (720p)</option><option>Full HD (1080p)</option><option>4K (2160p)</option></select>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><div><p className="text-sm font-semibold text-gray-900">ビューティーフィルター</p><p className="text-xs text-gray-500">映像を自動補正</p></div><input type="checkbox" className="toggle" /></div>
                </div>
              </div>

              {/* Translation Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200 pb-2"><Languages className="h-5 w-5 text-yellow-600" /><h3 className="font-bold text-gray-900">Uri-Tomo AI翻訳設定</h3></div>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200"><div><p className="text-sm font-semibold text-gray-900">リアルタイム翻訳</p><p className="text-xs text-gray-500">日韓自動翻訳を有効化</p></div><input type="checkbox" className="toggle" defaultChecked /></div>
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200"><div><p className="text-sm font-semibold text-gray-900">用語解説 (Description)</p><p className="text-xs text-gray-500">専門用語を自動で解説</p></div><input type="checkbox" className="toggle" defaultChecked /></div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">翻訳言語ペア</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 text-sm bg-white"><option>🇯🇵 日本語 ⇄ 🇰🇷 韓国語</option><option>🇯🇵 日本語 ⇄ 🇺🇸 英語</option><option>🇰🇷 韓国語 ⇄ 🇺🇸 英語</option></select>
                  </div>
                </div>
              </div>

              {/* General Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200 pb-2"><Settings className="h-5 w-5 text-gray-700" /><h3 className="font-bold text-gray-900">一般設定</h3></div>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><div><p className="text-sm font-semibold text-gray-900">会議の自動録画</p><p className="text-xs text-gray-500">開始時に自動で記録</p></div><input type="checkbox" className="toggle" defaultChecked /></div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><div><p className="text-sm font-semibold text-gray-900">通知音</p><p className="text-xs text-gray-500">参加者の入退室を通知</p></div><input type="checkbox" className="toggle" defaultChecked /></div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3 shrink-0">
              <Button variant="ghost" onClick={() => setShowSettings(false)} className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg">キャンセル</Button>
              <Button onClick={() => setShowSettings(false)} className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg font-semibold">保存</Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* End Meeting Confirmation Modal */}
      {showEndMeetingConfirm && (
        <motion.div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
           <div className="bg-white p-6 rounded-xl w-96 shadow-2xl">
              <div className="flex flex-col items-center gap-4 mb-6"><div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center"><AlertTriangle className="h-8 w-8 text-red-600" /></div><h2 className="text-xl font-bold text-gray-900">会議を終了しますか？</h2></div>
              <div className="flex justify-end gap-3"><Button onClick={() => setShowEndMeetingConfirm(false)} variant="outline" className="flex-1">キャンセル</Button><Button onClick={confirmEndMeeting} variant="destructive" className="flex-1">終了する</Button></div>
           </div>
        </motion.div>
      )}

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
        onAvatarImageUpload={(e) => {}}
        onSave={() => setShowProfileSettings(false)}
      />
    </div>
  );
}

// --- Main Wrapper ---
export function ActiveMeeting() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { livekitToken, livekitUrl, participantName, initialMicOn, initialVideoOn, audioDeviceId, videoDeviceId, audioOutputDeviceId } = location.state || {};

  useEffect(() => {
    if (!livekitToken || !livekitUrl) {
      toast.error('接続情報がありません。');
      navigate(`/meeting-setup/${id}`);
    }
  }, [livekitToken, livekitUrl, navigate, id]);

  if (!livekitToken || !livekitUrl) return null;

  return (
    <LiveKitRoom
      token={livekitToken}
      serverUrl={livekitUrl}
      video={initialVideoOn ? { deviceId: videoDeviceId } : false}
      audio={initialMicOn ? { deviceId: audioDeviceId } : false}
      onDisconnected={() => navigate('/')}
      className="h-screen w-full bg-gray-900"
    >
      <ActiveMeetingContent 
        meetingId={id || ''} 
        currentUserProp={{ name: participantName || 'Me', language: 'ja' }} 
        devices={{ audioInputId: audioDeviceId, videoInputId: videoDeviceId, audioOutputId: audioOutputDeviceId }}
        initialSettings={{ isMicOn: initialMicOn, isVideoOn: initialVideoOn }}
      />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}