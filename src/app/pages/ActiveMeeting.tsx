import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Users,
  Settings,
  Maximize2,
  Bot,
  MessageSquare,
  FileText,
  Languages,
  Pin,
  Send,
  ChevronRight,
  ChevronLeft,
  MonitorUp,
  Paperclip,
  Smile,
  Image as ImageIcon,
  File,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { ProfileSettingsModal, SystemSettingsModal } from '../components/SettingsModals';
import { toast } from 'sonner';
// 기존 import 아래에 추가
import {
  LiveKitRoom,
  VideoTrack,
  useTracks,
  RoomAudioRenderer,
  useRoomContext, // 추가
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';

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

function ActiveMeetingContent({ meetingId, currentUserProp }: { meetingId: string, currentUserProp: any }) {
  const navigate = useNavigate();
  const id = meetingId;
  const room = useRoomContext();
  const tracks = useTracks(
    [Track.Source.Camera],
    { onlySubscribed: false } // 내 비디오도 포함
  );
  const localTrack = tracks.find(t => t.participant.isLocal);
  const remoteTracks = tracks.filter(t => !t.participant.isLocal);
  const [currentUser] = useState(currentUserProp);
  
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [translationLogs, setTranslationLogs] = useState<TranslationLog[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState<SidebarTab>('translation');
  const [termExplanations, setTermExplanations] = useState<TermExplanation[]>([]);
  const [meetingTitle] = useState('日韓プロジェクト会議');
  const [startTime] = useState(new Date());
  const [duration, setDuration] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showEndMeetingConfirm, setShowEndMeetingConfirm] = useState(false);

  // Profile and system settings states
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

  // Listen for sidebar button clicks
  useEffect(() => {
    const handleOpenProfile = () => {
      // Initialize edited values with current values
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

  useEffect(() => {
    // Initialize participants
    const defaultParticipants: Participant[] = [
      { id: '1', name: 'User A', isVideoOn: true, isMuted: false, language: 'ja' },
      { id: '2', name: 'User B', isVideoOn: true, isMuted: false, language: 'ko' },
      { id: '3', name: 'User C', isVideoOn: false, isMuted: true, language: 'ja' },
    ];
    setParticipants(defaultParticipants);

    // Simulate translation logs
    const sampleLogs: TranslationLog[] = [
      {
        id: '1',
        speaker: 'User A',
        originalText: 'プロジェクトの進捗について報告します',
        translatedText: '프로젝트 진행 상황에 대해 보고합니다',
        originalLang: 'ja',
        timestamp: new Date(Date.now() - 5000),
      },
      {
        id: '2',
        speaker: 'User B',
        originalText: '感사します。次のステップについて論議したいです',
        translatedText: 'ありがとうございます。次のステップについて議論したいです',
        originalLang: 'ko',
        timestamp: new Date(Date.now() - 3000),
      },
    ];
    setTranslationLogs(sampleLogs);

    // Simulate term explanations
    const sampleTerms: TermExplanation[] = [
      {
        id: '1',
        term: 'プロジェクトの進捗',
        explanation: 'プロジェクトがどれだけ進んでいるかを示す指標。タスクの完了状況、スケジュール通りに進んでいるか、問題点などを含みます。',
        detectedFrom: 'User Aの発言',
        timestamp: new Date(Date.now() - 4000),
      },
      {
        id: '2',
        term: '次のステップ',
        explanation: 'これから行うべき次の行動や段階。プロジェクトの次のフェーズや、議論された内容を実行に移すための具体的なアクションプランを指します。',
        detectedFrom: 'User Bの発言',
        timestamp: new Date(Date.now() - 2000),
      },
    ];
    setTermExplanations(sampleTerms);

    // Timer for meeting duration
    const timer = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndMeeting = () => {
    setShowEndMeetingConfirm(true);
  };

  const confirmEndMeeting = () => {
    const endTime = new Date();
      
      // Create a comprehensive meeting record
      const meetingRecord = {
        id: id || Date.now().toString(),
        title: meetingTitle,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        participants: [
          {
            id: 'me',
            name: currentUser.name,
            language: currentUser.language,
          },
          ...participants.map(p => ({
            id: p.id,
            name: p.name,
            language: p.language || 'ja',
          })),
        ],
        translationLog: translationLogs.map(log => ({
          id: log.id,
          speaker: log.speaker,
          originalText: log.originalText,
          translatedText: log.translatedText,
          originalLang: log.originalLang === 'ja' ? '🇯🇵 日本語' : '🇰🇷 한국어',
          translatedLang: log.originalLang === 'ja' ? '🇰🇷 한국어' : '🇯🇵 日本語',
          timestamp: log.timestamp.toISOString(),
        })),
        chatMessages: chatMessages.map(msg => ({
          id: msg.id,
          userName: msg.sender,
          message: msg.message,
          timestamp: msg.timestamp.toISOString(),
          isAI: msg.isAI,
        })),
        summary: {
          keyPoints: [
            'プロジェクトの進捗状況について全体的な共有が行われました',
            '次期スプリントの計画とマイルストーンが確認されました',
            '日韓チーム間のコラボレーションが順調に進んでいることが報告されました',
            '技術的な課題について建設的な議論が行われました',
          ],
          actionItems: [
            '次回ミーティングまでに各チームがタスクを完了する（' + participants[0]?.name + '）',
            'KPI レポートを作成し共有する（' + participants[1]?.name + '）',
            'デザインレビューを実施する（' + currentUser.name + '）',
            '技術ドキメントを更新する（Uri-Tomo AI）',
          ],
          decisions: [
            '次期スプリントのリリース日を2週間後に設定',
            '隔週で日韓合同ミーティングを継続実施',
            'Uri-TomoのAI翻訳機能を全プロジェクトに展開',
          ],
        },
      };

    // Save to localStorage
    const savedMeetings = JSON.parse(localStorage.getItem('meetings') || '[]');
    const updatedMeetings = [...savedMeetings, meetingRecord];
    localStorage.setItem('meetings', JSON.stringify(updatedMeetings));

    // Navigate to minutes page to show the meeting summary
    navigate(`/minutes/${id || Date.now()}`);
  };

  const handleSendChat = () => {
    if (chatInput.trim()) {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: currentUser.name,
        message: chatInput,
        timestamp: new Date(),
      };
      setChatMessages([...chatMessages, newMessage]);
      setChatInput('');
    }
  };

  const handleFileAttach = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf,.doc,.docx,.txt';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const newMessage: ChatMessage = {
          id: Date.now().toString(),
          sender: currentUser.name,
          message: `📎 ${file.name}`,
          timestamp: new Date(),
        };
        setChatMessages([...chatMessages, newMessage]);
      }
    };
    input.click();
  };

  const handleStickerSelect = (sticker: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: currentUser.name,
      message: sticker,
      timestamp: new Date(),
    };
    setChatMessages([...chatMessages, newMessage]);
    setShowStickerPicker(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-900">
      {/* Top Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-white font-bold text-lg">{meetingTitle}</h1>
          <div className="flex items-center gap-2 px-3 py-1 bg-red-600 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-sm font-semibold">
              {formatDuration(duration)}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        {/* Toggle Sidebar Button */}
        {!isSidebarOpen && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-4 right-4 z-10 bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 font-semibold transition-all"
          >
            <Bot className="h-5 w-5" />
            <span>Uri-Tomoを開く</span>
            <ChevronLeft className="h-5 w-5" />
          </motion.button>
        )}

        <PanelGroup direction="horizontal">
          {/* Video Grid Panel */}
          <Panel defaultSize={isSidebarOpen ? 70 : 100} minSize={50}>
            <div className="h-full p-4 bg-gray-900">
              {/* Grid Layout for participants */}
              <div className="h-full grid grid-cols-2 gap-4">
                {/* Uri-Tomo AI Assistant - Pinned */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative bg-gradient-to-br from-yellow-900 to-amber-900 rounded-xl overflow-hidden border-2 border-yellow-400 transition-all"
                >
                  {/* Pinned Badge */}
                  <div className="absolute top-3 right-3 z-10 bg-yellow-400 p-2 rounded-lg shadow-lg">
                    <Pin className="h-4 w-4 text-gray-900" />
                  </div>
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-full bg-gradient-to-br from-yellow-400/20 to-amber-400/20 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-amber-400 flex items-center justify-center shadow-2xl">
                        <Bot className="h-12 w-12 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <div className="bg-black/70 backdrop-blur-sm px-3 py-1 rounded-lg flex items-center gap-2">
                      <span className="text-white text-sm font-semibold">
                        Uri-Tomo
                      </span>
                      <span className="text-xs text-yellow-300 bg-yellow-600 px-2 py-0.5 rounded font-semibold">
                        AI
                      </span>
                    </div>
                    <div className="bg-green-600 p-2 rounded-lg animate-pulse">
                      <Mic className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </motion.div>

                {/* Current User (내 비디오) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative bg-gray-800 rounded-xl overflow-hidden border-2 border-gray-700 hover:border-yellow-400 transition-all"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    {/* LiveKit VideoTrack 연결 */}
                    {localTrack?.publication?.isSubscribed ? (
                      <VideoTrack trackRef={localTrack} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        {/* 카메라 꺼졌을 때 아이콘 */}
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-amber-400 flex items-center justify-center text-white font-bold text-3xl">
                          {currentUser?.name?.charAt(0) || '?'}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* 하단 이름표 (기존 디자인 유지) */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <div className="bg-black/70 backdrop-blur-sm px-3 py-1 rounded-lg flex items-center gap-2">
                      <span className="text-white text-sm font-semibold">
                        {currentUser.name} (あなた)
                      </span>
                    </div>
                    {/* 마이크 상태 표시 */}
                    {localTrack?.participant.isMicrophoneEnabled === false && (
                      <div className="bg-red-600 p-2 rounded-lg">
                        <MicOff className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Other Participants (다른 참가자들) - LiveKit Remote Tracks 매핑 */}
                {remoteTracks.map((track) => (
                  <motion.div
                    key={track.participant.identity}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative bg-gray-800 rounded-xl overflow-hidden border-2 border-gray-700 hover:border-yellow-400 transition-all"
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      {/* LiveKit VideoTrack 연결 */}
                      <VideoTrack trackRef={track} className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <div className="bg-black/70 backdrop-blur-sm px-3 py-1 rounded-lg flex items-center gap-2">
                        <span className="text-white text-sm font-semibold">
                          {track.participant.identity} {/* 참가자 이름 */}
                        </span>
                        <span className="text-xs text-gray-300 bg-gray-600 px-2 py-0.5 rounded">
                          REMOTE
                        </span>
                      </div>
                      {!track.participant.isMicrophoneEnabled && (
                        <div className="bg-red-600 p-2 rounded-lg">
                          <MicOff className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Panel>

          {/* Resize Handle - Only show when sidebar is open */}
          {isSidebarOpen && (
            <>
              <PanelResizeHandle className="w-2 bg-gray-700 hover:bg-yellow-400 transition-colors cursor-col-resize" />

              {/* Right Sidebar Panel */}
              <Panel defaultSize={30} minSize={25} maxSize={50}>
                <div className="h-full bg-white flex flex-col">
                  {/* Uri-Tomo Header */}
                  <div className="bg-gradient-to-r from-yellow-400 to-amber-400 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                          <Bot className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-sm">Uri-Tomo</h3>
                          <p className="text-yellow-100 text-xs">AI翻訳アシスタント</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                        title="閉じる"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Description Section - Term Explanations */}
                  <div className="border-b border-gray-200 bg-white max-h-48 overflow-y-auto">
                    <div className="sticky top-0 bg-white px-4 pt-4 pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-yellow-600" />
                        <h4 className="font-bold text-gray-900 text-sm">Description</h4>
                        <span className="text-xs text-gray-500">
                          ({termExplanations.length}件の用語解説)
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      {termExplanations.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-xs text-gray-500">
                            まだ解説はありません
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            会話中の専門用語や分かりにくい表現を自動で解説します
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {termExplanations.map((term, index) => (
                            <motion.div
                              key={term.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg p-3 border border-yellow-200"
                            >
                              <div className="flex items-start gap-2 mb-1">
                                <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-1.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-sm text-gray-900">
                                      {term.term}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      {term.timestamp.toLocaleTimeString('ja-JP', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-700 leading-relaxed">
                                    {term.explanation}
                                  </p>
                                  <p className="text-xs text-yellow-700 mt-1">
                                    ��� {term.detectedFrom}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tab Navigation */}
                  <div className="flex border-b border-gray-200 bg-gray-50">
                    <button
                      onClick={() => setActiveTab('translation')}
                      className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                        activeTab === 'translation'
                          ? 'bg-white text-yellow-600 border-b-2 border-yellow-400'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Languages className="h-4 w-4" />
                        <span>Realtime Translation</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('chat')}
                      className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                        activeTab === 'chat'
                          ? 'bg-white text-yellow-600 border-b-2 border-yellow-400'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>チャット</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('members')}
                      className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                        activeTab === 'members'
                          ? 'bg-white text-yellow-600 border-b-2 border-yellow-400'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>メンバー</span>
                      </div>
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 overflow-hidden">
                    {/* RT Translation Tab */}
                    {activeTab === 'translation' && (
                      <div className="h-full flex flex-col bg-gradient-to-b from-yellow-50 to-white">
                        {/* Scrollable Translation Log */}
                        <div className="flex-1 overflow-y-auto p-4">
                          {translationLogs.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                                  <Languages className="h-8 w-8 text-yellow-600" />
                                </div>
                                <p className="text-sm font-semibold text-gray-700 mb-1">
                                  翻訳待機中...
                                </p>
                                <p className="text-xs text-gray-500">
                                  会話が始まると自動で翻訳されます
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {translationLogs.map((log, index) => (
                                <motion.div
                                  key={log.id}
                                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  transition={{ 
                                    delay: index * 0.05,
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 20
                                  }}
                                  className={`bg-white rounded-xl p-4 shadow-md border-2 transition-all ${
                                    index === translationLogs.length - 1
                                      ? 'border-yellow-400 ring-2 ring-yellow-200'
                                      : 'border-gray-200 hover:border-yellow-300'
                                  }`}
                                >
                                  {/* Header: Speaker and Time */}
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white font-bold text-sm">
                                        {log.speaker.charAt(0)}
                                      </div>
                                      <span className="text-sm font-bold text-gray-900">
                                        {log.speaker}
                                      </span>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      {log.timestamp.toLocaleTimeString('ja-JP', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                      })}
                                    </span>
                                  </div>

                                  {/* Original Text */}
                                  <div className="mb-3 pb-3 border-b border-gray-200">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                        {log.originalLang === 'ja' ? '🇯🇵 日本語' : '🇰🇷 韓国語'}
                                      </span>
                                      <span className="text-xs text-gray-500">Original</span>
                                    </div>
                                    <p className="text-base text-gray-900 leading-relaxed">
                                      {log.originalText}
                                    </p>
                                  </div>

                                  {/* Translated Text */}
                                  <div className="bg-gradient-to-br from-yellow-100 to-amber-100 rounded-lg p-3 border-2 border-yellow-300">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Languages className="h-4 w-4 text-yellow-700" />
                                      <span className="text-xs font-bold text-yellow-800 bg-yellow-200 px-2 py-1 rounded">
                                        {log.originalLang === 'ja' ? '🇰🇷 韓国語訳' : '🇯🇵 日本語訳'}
                                      </span>
                                      <span className="text-xs text-yellow-700">Translation</span>
                                      {index === translationLogs.length - 1 && (
                                        <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded ml-auto animate-pulse">
                                          LIVE
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-base text-gray-900 font-semibold leading-relaxed">
                                      {log.translatedText}
                                    </p>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Chat Tab */}
                    {activeTab === 'chat' && (
                      <div className="h-full flex flex-col">
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                          {chatMessages.length === 0 ? (
                            <div className="text-center py-8">
                              <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                                <MessageSquare className="h-6 w-6 text-gray-400" />
                              </div>
                              <p className="text-sm text-gray-500">
                                まだメッセージがありません
                              </p>
                            </div>
                          ) : (
                            chatMessages.map((msg) => (
                              <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${
                                  msg.sender === currentUser.name ? 'justify-end' : 'justify-start'
                                }`}
                              >
                                <div
                                  className={`max-w-[80%] rounded-lg p-3 ${
                                    msg.isAI
                                      ? 'bg-gradient-to-r from-yellow-100 to-amber-100 border border-yellow-300'
                                      : msg.sender === currentUser.name
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-100'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    {msg.isAI && (
                                      <Bot className="h-3 w-3 text-yellow-600" />
                                    )}
                                    <span className="text-xs font-semibold">
                                      {msg.sender}
                                    </span>
                                    <span className="text-xs opacity-60">
                                      {msg.timestamp.toLocaleTimeString('ja-JP', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-sm">{msg.message}</p>
                                </div>
                              </motion.div>
                            ))
                          )}
                        </div>
                        
                        {/* Chat Input */}
                        <div className="border-t border-gray-200 p-4">
                          {/* Sticker Picker */}
                          {showStickerPicker && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mb-3 p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border-2 border-yellow-300 shadow-lg"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                  <Smile className="h-4 w-4 text-yellow-600" />
                                  スタンプを選択
                                </h4>
                                <button
                                  onClick={() => setShowStickerPicker(false)}
                                  className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="grid grid-cols-5 gap-2">
                                {['👍', '👏', '😊', '❤️', '🎉', '✨', '💡', '🔥', '👌', '🙌', '💪', '🚀', '⭐', '✅', '📌'].map((sticker) => (
                                  <button
                                    key={sticker}
                                    onClick={() => handleStickerSelect(sticker)}
                                    className="text-3xl p-3 rounded-lg hover:bg-yellow-200 transition-all transform hover:scale-110 active:scale-95"
                                    title="スタンプを送信"
                                  >
                                    {sticker}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                          
                          <div className="flex gap-2">
                            {/* File Attach Button */}
                            <button
                              onClick={handleFileAttach}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="ファイルを添付"
                            >
                              <Paperclip className="h-5 w-5" />
                            </button>
                            
                            {/* Sticker Button */}
                            <button
                              onClick={() => setShowStickerPicker(!showStickerPicker)}
                              className={`p-2 rounded-lg transition-colors ${
                                showStickerPicker
                                  ? 'bg-yellow-200 text-yellow-700'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                              title="スタンプを選択"
                            >
                              <Smile className="h-5 w-5" />
                            </button>
                            
                            <input
                              type="text"
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                              placeholder="メッセージを入力..."
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                            />
                            <Button
                              onClick={handleSendChat}
                              disabled={!chatInput.trim()}
                              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg px-4"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Members Tab */}
                    {activeTab === 'members' && (
                      <div className="h-full overflow-y-auto p-4">
                        <div className="mb-4">
                          <h4 className="text-sm font-bold text-gray-900 mb-1">
                            参加者 ({participants.length + 2}人)
                          </h4>
                          <p className="text-xs text-gray-500">
                            {participants.filter(p => !p.isMuted).length + (isMicOn ? 1 : 0)}人が発言中
                          </p>
                        </div>

                        <div className="space-y-2">
                          {/* Uri-Tomo */}
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200"
                          >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-400 flex items-center justify-center">
                              <Bot className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-900">
                                  Uri-Tomo
                                </span>
                                <span className="text-xs bg-yellow-400 text-gray-900 px-2 py-0.5 rounded font-semibold">
                                  AI
                                </span>
                                <Pin className="h-3 w-3 text-yellow-600" />
                              </div>
                              <p className="text-xs text-gray-600">AI翻訳アシスタント</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                              <Mic className="h-4 w-4 text-green-600" />
                            </div>
                          </motion.div>

                          {/* Current User */}
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.05 }}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-400 flex items-center justify-center text-white font-bold">
                              {currentUser.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-900">
                                  {currentUser.name} (あなた)
                                </span>
                                <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                                  JA
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {isMicOn ? (
                                <>
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                  <Mic className="h-4 w-4 text-green-600" />
                                </>
                              ) : (
                                <MicOff className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                          </motion.div>

                          {/* Other Participants */}
                          {participants.map((participant, index) => (
                            <motion.div
                              key={participant.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: (index + 2) * 0.05 }}
                              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                            >
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-bold">
                                {participant.name.charAt(0)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-gray-900">
                                    {participant.name}
                                  </span>
                                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                                    {participant.language === 'ja' ? 'JA' : 'KO'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {!participant.isMuted ? (
                                  <>
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <Mic className="h-4 w-4 text-green-600" />
                                  </>
                                ) : (
                                  <MicOff className="h-4 w-4 text-red-600" />
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>

      {/* Bottom Controls */}
      <footer className="bg-gray-800 border-t border-gray-700 px-6 py-4">
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={() => setIsMicOn(!isMicOn)}
            className={`rounded-full w-12 h-12 ${
              isMicOn
                ? 'bg-gray-700 hover:bg-gray-600'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isMicOn ? (
              <Mic className="h-5 w-5 text-white" />
            ) : (
              <MicOff className="h-5 w-5 text-white" />
            )}
          </Button>

          <Button
            onClick={() => setIsVideoOn(!isVideoOn)}
            className={`rounded-full w-12 h-12 ${
              isVideoOn
                ? 'bg-gray-700 hover:bg-gray-600'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isVideoOn ? (
              <Video className="h-5 w-5 text-white" />
            ) : (
              <VideoOff className="h-5 w-5 text-white" />
            )}
          </Button>

          <Button
            onClick={handleEndMeeting}
            className="rounded-full w-12 h-12 bg-red-600 hover:bg-red-700"
          >
            <PhoneOff className="h-5 w-5 text-white" />
          </Button>

          <Button
            onClick={() => setIsScreenSharing(!isScreenSharing)}
            variant="ghost"
            className={`rounded-full w-12 h-12 ${
              isScreenSharing
                ? 'bg-yellow-400 hover:bg-yellow-500'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={isScreenSharing ? '画面共有を停止' : '画面を共有'}
          >
            <MonitorUp className={`h-5 w-5 ${
              isScreenSharing ? 'text-gray-900' : 'text-white'
            }`} />
          </Button>

          <Button
            variant="ghost"
            onClick={() => setShowSettings(true)}
            className="rounded-full w-12 h-12 bg-gray-700 hover:bg-gray-600"
          >
            <Settings className="h-5 w-5 text-white" />
          </Button>
        </div>
      </footer>

      {/* Settings Modal */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={() => setShowSettings(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 20 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-400 to-amber-400 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <Settings className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">システム設定</h2>
                  <p className="text-yellow-100 text-xs">Meeting Settings</p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowSettings(false)}
                className="text-white hover:bg-white/20 rounded-full w-8 h-8 p-0"
              >
                ✕
              </Button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
              {/* Audio Settings */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <Mic className="h-5 w-5 text-gray-700" />
                  <h3 className="font-bold text-gray-900">オーディオ設定</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      マイク
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm">
                      <option>デフォルト - 内蔵マイク (Built-in)</option>
                      <option>外部マイク (USB)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      スピーカー
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm">
                      <option>デフォルト - 内蔵スピーカー (Built-in)</option>
                      <option>外部スピーカー (USB)</option>
                      <option>ヘッドフォン (Bluetooth)</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">ノイズキャンセル</p>
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
                  <h3 className="font-bold text-gray-900">ビデオ設定</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      カメラ
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm">
                      <option>デフォルト - 内蔵カメラ (Built-in)</option>
                      <option>外部カメラ (USB)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      解像度
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm">
                      <option>HD (720p)</option>
                      <option>Full HD (1080p)</option>
                      <option>4K (2160p)</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">ビューティーフィルター</p>
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
                  <h3 className="font-bold text-gray-900">Uri-Tomo AI翻訳設定</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">リアルタイム翻訳</p>
                      <p className="text-xs text-gray-500">日韓自動翻訳を有効化</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-yellow-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">用語解説 (Description)</p>
                      <p className="text-xs text-gray-500">専門用語を自動で解説</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-yellow-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      翻訳言語ペア
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
                  <h3 className="font-bold text-gray-900">一般設定</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">会議の自動録画</p>
                      <p className="text-xs text-gray-500">開始時に自動で記録</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-yellow-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">通知音</p>
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
                onClick={() => setShowSettings(false)}
                className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                キャンセル
              </Button>
              <Button
                onClick={() => setShowSettings(false)}
                className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg font-semibold"
              >
                保存
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* End Meeting Confirmation Modal */}
      {showEndMeetingConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowEndMeetingConfirm(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Warning */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", damping: 15 }}
                className="relative z-10"
              >
                <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <PhoneOff className="h-10 w-10 text-red-600" />
                </div>
                <h2 className="text-white font-bold text-2xl mb-2">
                  ミーティングを終了しますか？
                </h2>
                <p className="text-red-100 text-sm">
                  End Meeting
                </p>
              </motion.div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-4">
                {/* Meeting Info */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-400 rounded-full flex items-center justify-center">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-sm">{meetingTitle}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <Clock className="h-3 w-3" />
                        <span>時間: {formatDuration(duration)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                      <Users className="h-4 w-4 text-gray-600 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">参加者</p>
                      <p className="text-lg font-bold text-gray-900">{participants.length + 2}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                      <Languages className="h-4 w-4 text-yellow-600 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">翻訳</p>
                      <p className="text-lg font-bold text-gray-900">{translationLogs.length}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                      <MessageSquare className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">チャット</p>
                      <p className="text-lg font-bold text-gray-900">{chatMessages.length}</p>
                    </div>
                  </div>
                </div>

                {/* Warning Message */}
                <div className="bg-amber-50 border-l-4 border-amber-400 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900 mb-1">
                        終了すると以下の処理が行われます
                      </p>
                      <ul className="text-xs text-amber-800 space-y-1">
                        <li>• ミーティング記録を自動保存</li>
                        <li>• Uri-TomoがAIサマリーを生成</li>
                        <li>• 議事録ページに移動します</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex gap-3">
              <Button
                onClick={() => setShowEndMeetingConfirm(false)}
                className="flex-1 px-6 py-3 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl font-semibold transition-all"
              >
                キャンセル
              </Button>
              <Button
                onClick={confirmEndMeeting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <PhoneOff className="h-4 w-4 mr-2 inline" />
                終了する
              </Button>
            </div>
          </motion.div>
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

export function ActiveMeeting() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // MeetingSetup에서 넘겨준 토큰 받기
  const { livekitToken, livekitUrl, participantName } = location.state || {};

  useEffect(() => {
    if (!livekitToken || !livekitUrl) {
      toast.error('接続情報がありません。設定画面に戻ります。');
      navigate(`/meeting-setup/${id}`);
    }
  }, [livekitToken, livekitUrl, navigate, id]);

  if (!livekitToken || !livekitUrl) return <div className="h-screen bg-gray-900 flex items-center justify-center text-white">Connecting...</div>;

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={livekitToken}
      serverUrl={livekitUrl}
      data-lk-theme="default"
      onDisconnected={() => navigate('/')}
      className="h-screen w-full bg-gray-900"
      style={{ height: '100vh' }}
    >
      <ActiveMeetingContent 
        meetingId={id || ''} 
        currentUserProp={{ name: participantName || 'Me', language: 'ja' }} 
      />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}