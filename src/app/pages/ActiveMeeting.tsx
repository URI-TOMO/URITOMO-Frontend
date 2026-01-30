import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, Users, Settings, Bot,
  MessageSquare, Languages, Pin, ChevronRight, ChevronLeft,
  MonitorUp, Paperclip, Smile, AlertTriangle, Clock, Send, Monitor, X,
  User as UserIcon, Volume2, VolumeX, Volume1
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { ProfileSettingsModal, SystemSettingsModal } from '../components/SettingsModals';
import { toast } from 'sonner';
import { meetingApi } from '../api/meeting';
import { roomApi } from '../api/room';
import { MeetingSocket } from '../meeting/websocket/client';
// LiveKit imports
import {
  LiveKitRoom,
  VideoTrack,
  useTracks,
  useParticipants,
  RoomAudioRenderer,
  useRoomContext,
  useLocalParticipant
} from '@livekit/components-react';
import { Track, RoomEvent } from 'livekit-client';
import '@livekit/components-styles';
import { useTranslation } from '../hooks/useTranslation';

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
  fileUrl?: string;
  lang?: string;           // Original message language
  translation?: string;    // Translated text (if different language)
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
  initialSettings,
  livekitToken
}: {
  meetingId: string,
  currentUserProp: any,
  devices?: { audioInputId?: string; videoInputId?: string; audioOutputId?: string },
  initialSettings?: { isMicOn: boolean, isVideoOn: boolean },
  livekitToken?: string
}) {
  const navigate = useNavigate();
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const { t, language: systemLanguage, setSystemLanguage } = useTranslation();

  // 参加者リスト（リアルタイム更新）
  const participants = useParticipants();

  // Tracks
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], { onlySubscribed: false });
  const localCameraTrack = tracks.find(t => t.participant.isLocal && t.source === Track.Source.Camera);
  const localScreenTrack = tracks.find(t => t.participant.isLocal && t.source === Track.Source.ScreenShare);
  const remoteTracks = tracks.filter(t => !t.participant.isLocal);

  const [currentUser] = useState(currentUserProp);

  // マイク・カメラの状態管理
  const [isMicOn, setIsMicOn] = useState(initialSettings?.isMicOn ?? true);
  const [isVideoOn, setIsVideoOn] = useState(initialSettings?.isVideoOn ?? true);

  // Active Speaker Analysis
  const [isUriTomoSpeaking, setIsUriTomoSpeaking] = useState(false);

  useEffect(() => {
    // Find Uri-Tomo in participants list
    const uriTomo = participants.find(p => p.identity?.toLowerCase().includes('uri-tomo'));
    setIsUriTomoSpeaking(!!uriTomo?.isSpeaking);
  }, [participants]);

  // Device List State
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState(initialDevices?.audioInputId || '');
  const [selectedCameraId, setSelectedCameraId] = useState(initialDevices?.videoInputId || '');
  const [selectedSpeakerId, setSelectedSpeakerId] = useState(initialDevices?.audioOutputId || '');
  // Volume State
  const [micVolume, setMicVolume] = useState(100);
  const [speakerVolume, setSpeakerVolume] = useState(100);
  const speakerVolumeRef = useRef(100);

  // Update refs and audio elements when volume changes
  useEffect(() => {
    speakerVolumeRef.current = speakerVolume;
    const audioElements = document.querySelectorAll('audio[data-participant-identity]');
    audioElements.forEach((el: any) => {
      el.volume = speakerVolume / 100;
    });
  }, [speakerVolume]);

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
  // const [participants, setParticipants] = useState<Participant[]>([]); // Removed in favor of useParticipants
  const [meetingTitle, setMeetingTitle] = useState('Loading...');

  useEffect(() => {
    if (meetingId) {
      roomApi.getRoomDetail(meetingId)
        .then(data => {
          if (data.name) setMeetingTitle(data.name);
        })
        .catch(err => {
          console.error('Failed to fetch room details:', err);
          setMeetingTitle('Meeting');
        });
    }
  }, [meetingId]);

  // Refs
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<MeetingSocket | null>(null);


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

  // 会議開始時間を記録
  const [startTime] = useState(new Date());

  // --- Logic 1: Screen Share IPC Listener ---
  useEffect(() => {
    if ((window as any).ipcRenderer) {
      (window as any).ipcRenderer.onOpenScreenPicker((sources: any) => {
        setAvailableScreens(sources);
        setShowScreenPickerModal(true);
      });
    }
  }, []);

  // --- Logic 1.5: Live Session Start Trigger ---
  useEffect(() => {
    if (room && room.state === 'connected' && meetingId) {
      // room.sid might be missing in type definitions but exists at runtime
      const sessionId = (room as any).sid;

      if (!sessionId) {
        console.warn('⚠️ Room connected but Session ID (sid) is missing. Waiting...');
        return;
      }

      console.log(`📡 Connecting to Live Session backend. Room: ${meetingId}, Session (SID): ${sessionId}`);

      meetingApi.startLiveSession(meetingId, sessionId, livekitToken)
        .then(response => {
          console.log('✅ Live Session started:', response);
          toast.success(t('liveSessionConnected'));
        })
        .catch(error => {
          console.error('❌ Failed to start live session:', error);
          toast.error(t('liveSessionFailed'));
        });
    }
  }, [room, room?.state, meetingId, livekitToken]);

  // --- Logic 1.6: WebSocket Connection (Indepedent of LiveKit) ---
  useEffect(() => {
    if (!meetingId) return;

    // WebSocket Connection
    // Note: Use meetingId (the room UUID) instead of LiveKit sessionId (sid) 
    // because the backend validates against the Room table.
    console.log('🔄 Initializing WebSocket connection for room:', meetingId);
    const ws = new MeetingSocket(meetingId);
    socketRef.current = ws;
    ws.connect();

    const unsubscribe = ws.onMessage((msg) => {
      if (msg.type === 'chat') {
        const chatData = msg.data;

        // Get user's language preference (normalize to 'Japanese' or 'Korean')
        const userLang = systemLanguage === 'ja' ? 'Japanese' :
          systemLanguage === 'ko' ? 'Korean' : 'Japanese';

        // Get source language of the message
        const msgLang = chatData.lang || 'unknown';

        // Only show translation if message is in a different language than user's preference
        const shouldShowTranslation = msgLang !== userLang && chatData.translated_text;

        console.log('📨 Chat message received:', {
          text: chatData.text,
          lang: msgLang,
          userLang,
          translated_text: chatData.translated_text,
          shouldShowTranslation
        });

        setChatMessages(prev => [
          ...prev,
          {
            id: chatData.id || Date.now().toString(),
            sender: chatData.display_name,
            message: chatData.text,
            timestamp: new Date(chatData.created_at || Date.now()),
            lang: msgLang,
            // Include translation if available and message is in different language
            translation: shouldShowTranslation ? chatData.translated_text : undefined
          }
        ]);
      } else if (msg.type === 'room_connected') {
        toast.success(`Connected to room: ${msg.data.room_id}`);
      } else if (msg.type === 'translation') {
        const transData = msg.data;

        // Handle chat translations - add to existing chat message
        if (transData.message_type === 'chat') {
          // Get related message ID directly from data (not from meta)
          const relatedMessageId = transData.related_message_id || transData.meta?.related_message_id;
          const translatedText = transData.translated || transData.translated_text || '';
          const originalText = transData.Original || transData.original_text || '';

          console.log('💬 Chat translation received:', {
            relatedMessageId,
            originalText,
            translatedText,
            source_lang: transData.source_lang,
            target_lang: transData.target_lang,
            systemLanguage
          });

          // Get user's language preference
          const userLang = systemLanguage === 'ja' ? 'ja' :
            systemLanguage === 'ko' ? 'ko' :
              (systemLanguage?.toLowerCase().includes('ja') ? 'ja' : 'ko');

          // Get source language of the chat message
          const sourceLangRaw = transData.source_lang || transData.original_lang || '';
          const sourceLang = sourceLangRaw.toLowerCase().includes('ja') ? 'ja' :
            sourceLangRaw.toLowerCase().includes('ko') ? 'ko' : 'unknown';

          // Only add translation if message is in a different language
          if (sourceLang !== userLang && translatedText) {
            console.log('✅ Adding translation to chat message:', { relatedMessageId, originalText, translatedText });
            setChatMessages(prev => prev.map(chatMsg => {
              // Match by message ID or by original text
              if (chatMsg.id === relatedMessageId || chatMsg.message === originalText) {
                console.log('🎯 Matched chat message:', chatMsg.id);
                return { ...chatMsg, translation: translatedText };
              }
              return chatMsg;
            }));
          }
          return; // Don't add to translation logs
        }

        // Handle STT translations - show in translation panel
        if (transData.message_type && transData.message_type !== 'stt') {
          return; // Skip non-STT translations
        }

        // Get the source language of the speech
        const sourceLang = transData.source_lang || transData.lang || 'unknown';

        // Get user's language preference (normalize to 'ja' or 'ko')
        const userLang = systemLanguage === 'ja' ? 'ja' :
          systemLanguage === 'ko' ? 'ko' :
            (systemLanguage?.toLowerCase().includes('ja') ? 'ja' : 'ko');

        // Only show translations from languages the user doesn't speak
        // If user speaks Japanese, show Korean->Japanese translations (sourceLang === 'ko')
        // If user speaks Korean, show Japanese->Korean translations (sourceLang === 'ja')
        if (sourceLang === userLang) {
          return; // Skip - user already understands this language
        }

        // Support multiple formats of translation broadcast
        const speaker = transData.participant_name || transData.speaker || 'Unknown';
        const originalText = transData.Original || transData.original_text || '';
        const translatedText = transData.translated || transData.translated_text || '';
        const lang = (transData.lang?.toLowerCase().includes('ja') || transData.source_lang === 'ja') ? 'ja' : 'ko';

        setTranslationLogs(prev => [
          ...prev,
          {
            id: transData.id || Date.now().toString(),
            speaker,
            originalText,
            translatedText,
            originalLang: lang as 'ja' | 'ko',
            timestamp: new Date(transData.timestamp || transData.created_at || Date.now())
          }
        ]);
      } else if (msg.type === 'stt') {
        // Handle STT messages with translation
        const sttData = msg.data;

        console.log('🎤 STT message received:', sttData);

        // Get the source language of the speech (normalize to 'ja' or 'ko')
        const sourceLangRaw = sttData.lang || 'unknown';
        const sourceLang = sourceLangRaw === 'ja' || sourceLangRaw.toLowerCase().includes('ja') ? 'ja' :
          sourceLangRaw === 'ko' || sourceLangRaw.toLowerCase().includes('ko') ? 'ko' : 'unknown';

        // Get user's language preference (normalize to 'ja' or 'ko')
        const userLang = systemLanguage === 'ja' ? 'ja' :
          systemLanguage === 'ko' ? 'ko' :
            (systemLanguage?.toLowerCase().includes('ja') ? 'ja' : 'ko');

        // Only show translations from languages the user doesn't speak
        if (sourceLang === userLang) {
          console.log('🔇 Skipping STT - user speaks this language:', sourceLang);
          return; // Skip - user already understands this language
        }

        // Extract original and translated text
        const speaker = sttData.display_name || 'Unknown';
        const originalText = sttData.text || '';
        const translatedText = sttData.translated_text || '';

        if (!originalText || !translatedText) {
          console.log('⚠️ STT missing text or translation');
          return;
        }

        // Add to translation logs for the translation panel
        setTranslationLogs(prev => [
          ...prev,
          {
            id: sttData.id || Date.now().toString(),
            speaker,
            originalText,
            translatedText,
            originalLang: sourceLang as 'ja' | 'ko',
            timestamp: new Date(sttData.created_at || Date.now())
          }
        ]);

        console.log('✅ Added STT translation to panel:', { speaker, originalText, translatedText });
      } else if (msg.type === 'explanation') {
        const expData = msg.data?.data || msg.data;
        setTermExplanations(prev => [
          ...prev,
          {
            id: expData.id || Date.now().toString(),
            term: expData.term || 'Unknown Term',
            explanation: expData.explanation || '',
            detectedFrom: expData.detectedFrom || '',
            timestamp: new Date()
          }
        ]);
      } else if (msg.type === 'error') {
        toast.error(`WebSocket Error: ${msg.message}`);
      }
    });

    return () => {
      console.log('🔌 Disconnecting WebSocket');
      unsubscribe();
      ws.disconnect();
    };
  }, [meetingId, systemLanguage]);

  // --- Logic 1.6: Track Subscription Event Listener ---
  useEffect(() => {
    if (!room) return;

    const handleTrackSubscribed = (track: any, publication: any, participant: any) => {
      console.log('[LK] TrackSubscribed:', track.kind, participant.identity, publication.trackSid);

      // 오디오 트랙을 DOM에 자동 attach
      if (track.kind === Track.Kind.Audio) {
        console.log('[LK] Attaching audio track from participant:', participant.identity);
        const audioElement = track.attach();
        audioElement.setAttribute('data-participant-identity', participant.identity);
        audioElement.volume = speakerVolumeRef.current / 100;
        document.body.appendChild(audioElement);
      }
    };

    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);

    return () => {
      room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed);
    };
  }, [room]);

  // --- Logic 2: State Sync with LiveKit ---
  useEffect(() => {
    if (localParticipant) {
      setIsScreenSharing(localParticipant.isScreenShareEnabled);
      setIsMicOn(localParticipant.isMicrophoneEnabled);
      setIsVideoOn(localParticipant.isCameraEnabled);
    }
  }, [localParticipant, tracks, localParticipant?.isMicrophoneEnabled, localParticipant?.isCameraEnabled]);

  // --- Logic 3: Device Sync ---
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
        if (micList.length && !micList.find(d => d.deviceId === tm)) tm = micList[0]?.deviceId;
        if (camList.length && !camList.find(d => d.deviceId === tc)) tc = camList[0]?.deviceId;
        if (spkList.length && !spkList.find(d => d.deviceId === ts)) ts = spkList[0]?.deviceId;
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
      toast.success(t('deviceChanged'));
    } catch (e) {
      console.error(e);
      toast.error(t('changeFailed'));
    }
  };

  const toggleScreenShare = async () => {
    if (!localParticipant) {
      toast.error(t('userFound'));
      return;
    }
    const newState = !isScreenSharing;
    try {
      await localParticipant.setScreenShareEnabled(newState, { audio: false });
      setIsScreenSharing(newState);
    } catch (e: any) {
      console.warn('Screen share failed:', e);
      if (e.name === 'NotAllowedError' || e.message?.includes('Permission denied')) {
        toast.info(t('cancelled'));
      } else {
        toast.error(t('screenShareFailed'));
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
    if (!localParticipant) return;
    const newState = !isMicOn;
    try {
      await localParticipant.setMicrophoneEnabled(newState);
      setIsMicOn(newState);
      if (newState) {
        toast.success(t('micOn'));
      } else {
        toast.info(t('micOff'));
      }
    } catch (e) {
      console.error(e);
      toast.error(t('changeFailed'));
    }
  };

  const toggleVideo = async () => {
    if (!localParticipant) return;
    const newState = !isVideoOn;
    try {
      await localParticipant.setCameraEnabled(newState);
      setIsVideoOn(newState);
      if (newState) {
        toast.success(t('cameraOn'));
      } else {
        toast.info(t('cameraOff'));
      }
    } catch (e) {
      console.error(e);
      toast.error(t('changeFailed'));
    }

  };

  const handleSendChat = () => {
    if (chatInput.trim() && socketRef.current) {
      // 自分の言語設定に合わせて送信（デフォルトは日本語）
      const lang = systemLanguage === 'ko' ? 'Korean' : 'Japanese';
      socketRef.current.sendChat(chatInput, lang);
      setChatInput('');
    } else if (!socketRef.current) {
      toast.error('チャットサーバーに接続されていません');
    }
  };

  const handleFileAttach = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        // ★ファイルをブラウザで開くための一時的なURLを生成
        const fileUrl = URL.createObjectURL(file);
        const newMessage = {
          id: Date.now().toString(),
          sender: currentUser.name,
          // messageには表示用の名前、fileUrlに実際のリンクを持たせる
          message: file.name,
          fileUrl: fileUrl,
          timestamp: new Date(),
          isAI: false
        };
        setChatMessages(prev => [...prev, newMessage]);
      }
    };
    input.click();
  };

  // 2. メッセージが追加されたらスクロールする処理
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleStickerSelect = (sticker: string) => {
    setChatMessages([...chatMessages, { id: Date.now().toString(), sender: currentUser.name, message: sticker, timestamp: new Date() }]);
    setShowStickerPicker(false);
  };

  const handleEndMeeting = () => setShowEndMeetingConfirm(true);

  // ★ここに追加: 会議終了確定ハンドラ
  const confirmEndMeeting = () => {
    const endTime = new Date();

    // 会議の包括的なレコードを作成
    const meetingRecord = {
      id: Date.now().toString(),
      title: meetingTitle,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      participants: [
        {
          id: 'me',
          name: currentUser.name,
          language: currentUser.language,
        },
        ...participants.filter(p => !p.isLocal).map(p => ({
          id: p.sid,
          name: p.identity || 'Unknown',
          language: 'unknown',
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
          '次回ミーティングまでに各チームがタスクを完了する（' + (participants[0]?.name || '担当者A') + '）',
          'KPI レポートを作成し共有する（' + (participants[1]?.name || '担当者B') + '）',
          'デザインレビューを実施する（' + currentUser.name + '）',
          '技術ドキュメントを更新する（Uri-Tomo AI）',
        ],
        decisions: [
          '次期スプリントのリリース日を2週間後に設定',
          '隔週で日韓合同ミーティングを継続実施',
          'Uri-TomoのAI翻訳機能を全プロジェクトに展開',
        ],
      },
    };

    // localStorageへ保存
    const savedMeetings = JSON.parse(localStorage.getItem('meetings') || '[]');
    const updatedMeetings = [...savedMeetings, meetingRecord];
    localStorage.setItem('meetings', JSON.stringify(updatedMeetings));
    // 実際の議事録保存処理などがここに入ります
    navigate(`/minutes/${meetingRecord.id}`);
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
        } catch (e) { }
      } else if (savedUser) {
        setUserEmail(savedUser); setUserName(savedUser.split('@')[0]);
      }
      if (savedLanguage) setSystemLanguage(savedLanguage as 'ja' | 'ko' | 'en');
    };
    loadProfile();

    setTranslationLogs([
      // Mock data replaced - empty initially or fetched
    ]);
    setTermExplanations([
      // Mock data replaced
    ]);

    const timer = setInterval(() => setDuration(p => p + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

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
            <Bot className="h-5 w-5" /><span>{t('openUriTomo')}</span><ChevronLeft className="h-5 w-5" />
          </motion.button>
        )}

        <PanelGroup direction="horizontal" className="h-full">
          {/* Video Grid */}
          <Panel defaultSize={isSidebarOpen ? 70 : 100} minSize={50}>
            <div className="h-full p-4 bg-gray-900 flex flex-col">
              <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
                {/* Uri-Tomo Bot */}
                <motion.div
                  animate={{
                    scale: isUriTomoSpeaking ? 1.02 : 1,
                    borderColor: isUriTomoSpeaking ? '#FACC15' : 'rgba(250, 204, 21, 0)',
                    boxShadow: isUriTomoSpeaking ? '0 0 20px rgba(250, 204, 21, 0.4)' : 'none'
                  }}
                  className="relative bg-gradient-to-br from-yellow-900 to-amber-900 rounded-xl overflow-hidden border-2 border-transparent transition-all duration-300"
                >
                  <div className="absolute top-3 right-3 z-10 bg-yellow-400 p-2 rounded-lg shadow-lg"><Pin className="h-4 w-4 text-gray-900" /></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-full bg-gradient-to-br from-yellow-400/20 to-amber-400/20 flex items-center justify-center">
                      <Bot className={`h-12 w-12 text-white ${isUriTomoSpeaking ? 'animate-pulse' : ''}`} />
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <div className="bg-black/70 backdrop-blur-sm px-3 py-1 rounded-lg flex items-center gap-2"><span className="text-white text-sm font-semibold">Uri-Tomo</span><span className="text-xs text-yellow-300 bg-yellow-600 px-2 py-0.5 rounded font-semibold">AI</span></div>
                    <div className={`bg-green-600 p-2 rounded-lg ${isUriTomoSpeaking ? 'animate-pulse' : ''}`}><Mic className="h-4 w-4 text-white" /></div>
                  </div>
                </motion.div>

                {/* Local User (Camera) */}
                <motion.div
                  animate={{
                    scale: localParticipant?.isSpeaking ? 1.02 : 1,
                    borderColor: localParticipant?.isSpeaking ? '#FACC15' : 'rgba(250, 204, 21, 0)',
                    boxShadow: localParticipant?.isSpeaking ? '0 0 20px rgba(250, 204, 21, 0.4)' : 'none'
                  }}
                  className="relative bg-gray-800 rounded-xl overflow-hidden border-2 border-transparent transition-all duration-300"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    {localCameraTrack?.publication?.isSubscribed ? (
                      <VideoTrack trackRef={localCameraTrack} className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center"><div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-amber-400 flex items-center justify-center text-white font-bold text-3xl">{currentUser?.name?.charAt(0) || '?'}</div></div>
                    )}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <div className="bg-black/70 backdrop-blur-sm px-3 py-1 rounded-lg flex items-center gap-2"><span className="text-white text-sm font-semibold">{currentUser.name} ({t('you')})</span></div>
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
                        <span className="text-white text-sm font-semibold">{currentUser.name} ({t('screenShare')})</span>
                        <span className="text-xs bg-white text-black px-2 py-0.5 rounded font-bold">YOU</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Remote Participants (修正: カメラ映像のみ反転) */}
                {remoteTracks.map((track) => {
                  const isSpeaking = track.participant.isSpeaking;
                  return (
                    <motion.div
                      key={track.participant.identity + track.source}
                      animate={{
                        scale: isSpeaking ? 1.02 : 1,
                        borderColor: isSpeaking ? '#FACC15' : 'rgba(250, 204, 21, 0)',
                        boxShadow: isSpeaking ? '0 0 20px rgba(250, 204, 21, 0.4)' : 'none'
                      }}
                      className="relative bg-gray-800 rounded-xl overflow-hidden border-2 border-transparent transition-all duration-300"
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <VideoTrack
                          trackRef={track}
                          className={`w-full h-full ${track.source === Track.Source.ScreenShare ? 'object-contain bg-black' : 'object-cover'}`}
                          style={track.source === Track.Source.Camera ? { transform: 'scaleX(-1)' } : undefined}
                        />
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                        <div className="bg-black/70 backdrop-blur-sm px-3 py-1 rounded-lg flex items-center gap-2">
                          <span className="text-white text-sm font-semibold">{track.participant.identity}</span>
                          {track.source === Track.Source.ScreenShare ?
                            <span className="text-xs bg-white text-black px-2 py-0.5 rounded font-bold">{t('screenShare')}</span> :
                            <span className="text-xs text-gray-300 bg-gray-600 px-2 py-0.5 rounded">{t('remote')}</span>
                          }
                        </div>
                        {!track.participant.isMicrophoneEnabled && track.source !== Track.Source.ScreenShare && <div className="bg-red-600 p-2 rounded-lg"><MicOff className="h-4 w-4 text-white" /></div>}
                      </div>
                    </motion.div>
                  );
                })}
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
                  <div className="bg-gradient-to-r from-yellow-400 to-amber-400 px-4 py-3 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                          <Bot className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-sm">Uri-Tomo</h3>
                          <p className="text-yellow-100 text-xs">{t('aiAssistant')}</p>
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



                  {/* Tab Navigation */}
                  <div className="flex border-b border-gray-200 bg-gray-50">
                    <button
                      onClick={() => setActiveTab('translation')}
                      className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'translation'
                        ? 'bg-white text-yellow-600 border-b-2 border-yellow-400'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Languages className="h-4 w-4" />
                        <span>{t('realtimeTranslation')}</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('chat')}
                      className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'chat'
                        ? 'bg-white text-yellow-600 border-b-2 border-yellow-400'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>{t('chat')}</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('members')}
                      className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'members'
                        ? 'bg-white text-yellow-600 border-b-2 border-yellow-400'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{t('members')}</span>
                      </div>
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                    {/* Translation Tab */}
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
                                  {t('waitingForTranslation')}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {t('autoTranslateHint')}
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
                                  className={`bg-white rounded-xl p-4 shadow-md border-2 transition-all ${index === translationLogs.length - 1
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
                                        {log.originalLang === 'ja' ? '🇯🇵 ' + t('japanese') : '🇰🇷 ' + t('korean')}
                                      </span>
                                      <span className="text-xs text-gray-500">{t('original')}</span>
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
                                        {log.originalLang === 'ja' ? '🇰🇷 ' + t('koreanTrans') : '🇯🇵 ' + t('japaneseTrans')}
                                      </span>
                                      <span className="text-xs text-yellow-700">{t('translation')}</span>
                                      {index === translationLogs.length - 1 && (
                                        <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded ml-auto animate-pulse">
                                          {t('live')}
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
                                {t('noMessages')}
                              </p>
                            </div>
                          ) : (
                            <>
                              {chatMessages.map((msg) => (
                                <motion.div
                                  key={msg.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className={`flex ${msg.sender === currentUser.name ? 'justify-end' : 'justify-start'
                                    }`}
                                >
                                  <div
                                    className={`max-w-[80%] rounded-lg p-3 ${msg.isAI
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
                                    {/* --- メッセージ本文エリア --- */}
                                    <div className="text-sm">
                                      {msg.fileUrl ? (
                                        // ファイルURLがある場合は、クリック可能な添付ファイルUIを表示
                                        <a
                                          href={msg.fileUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`flex items-center gap-2 p-2 rounded border transition-all hover:opacity-90 active:scale-95 ${msg.sender === currentUser.name
                                            ? 'bg-blue-700 border-blue-500 text-white shadow-sm'
                                            : 'bg-white border-gray-200 text-blue-600 shadow-sm'
                                            }`}
                                        >
                                          <Paperclip className="h-4 w-4 flex-shrink-0" />
                                          <span className="underline font-medium truncate max-w-[180px]">
                                            {msg.message}
                                          </span>
                                        </a>
                                      ) : (
                                        // 通常のテキストメッセージ
                                        <>
                                          <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                                          {/* 翻訳表示 (使用言語以外のメッセージの場合) */}
                                          {msg.translation && (
                                            <div className={`mt-2 pt-2 border-t ${msg.sender === currentUser.name
                                              ? 'border-blue-400/50'
                                              : 'border-gray-300'
                                              }`}>
                                              <div className="flex items-center gap-1 mb-1">
                                                <Languages className="h-3 w-3 opacity-60" />
                                                <span className="text-xs opacity-60">{t('translation')}</span>
                                              </div>
                                              <p className={`whitespace-pre-wrap leading-relaxed ${msg.sender === currentUser.name
                                                ? 'text-blue-100'
                                                : 'text-gray-600'
                                                }`}>
                                                {msg.translation}
                                              </p>
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                              {/* ★自動スクロール用の目印：リストの最後に配置 */}
                              <div ref={chatEndRef} />
                            </>
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
                                  {t('selectSticker')}
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
                                    onClick={() => {// ★ここを修正: メッセージ送信ではなく入力欄に追加
                                      const newValue = chatInput + sticker;
                                      setChatInput(newValue);
                                      setShowStickerPicker(false);
                                      // ★重要: 入力欄にフォーカスを戻す
                                      setTimeout(() => {
                                        if (chatInputRef.current) {
                                          // 入力欄にフォーカスを戻す
                                          chatInputRef.current.focus();
                                          // カーソルを末尾（新しい文字列の長さ）に移動
                                          const len = newValue.length;
                                          chatInputRef.current.setSelectionRange(len, len);
                                        }
                                      }, 0);
                                    }}
                                    className="text-3xl p-3 rounded-lg hover:bg-yellow-200 transition-all transform hover:scale-110 active:scale-95"
                                    title={t('addSticker')}
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
                              title={t('attachFile')}
                            >
                              <Paperclip className="h-5 w-5" />
                            </button>

                            {/* Sticker Button */}
                            <button
                              onClick={() => setShowStickerPicker(!showStickerPicker)}
                              className={`p-2 rounded-lg transition-colors ${showStickerPicker
                                ? 'bg-yellow-200 text-yellow-700'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                              title={t('selectSticker')}
                            >
                              <Smile className="h-5 w-5" />
                            </button>

                            <input
                              ref={chatInputRef} // ★2. ここに ref を追加
                              type="text"
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                              placeholder={t('typeMessage')}
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
                            {t('participantsCount')} ({participants.length + 1})
                          </h4>
                          <p className="text-xs text-gray-500">
                            {participants.filter(p => p.isMicrophoneEnabled).length + (isMicOn ? 1 : 0)}{t('speaking')}
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
                              <p className="text-xs text-gray-600">{t('aiAssistant')}</p>
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
                                  {currentUser.name} ({t('you')})
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

                          {/* Other Participants (Remote) */}
                          {participants.filter(p => !p.isLocal).map((participant, index) => (
                            <motion.div
                              key={participant.sid}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: (index + 2) * 0.05 }}
                              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                            >
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-bold">
                                {(participant.identity || '?').charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-gray-900">
                                    {participant.identity || 'Unknown'}
                                  </span>
                                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                                    {t('remote')}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {participant.isMicrophoneEnabled ? (
                                  <>
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <Mic className="h-4 w-4 text-green-600" />
                                  </>
                                ) : (
                                  <MicOff className="h-4 w-4 text-red-600" />
                                )}
                                {participant.isCameraEnabled ? (
                                  <Video className="h-4 w-4 text-green-600" />
                                ) : (
                                  <VideoOff className="h-4 w-4 text-red-600" />
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

      <footer className="bg-gray-800 border-t border-gray-700 px-6 py-4 flex-shrink-0">
        <div className="flex justify-center gap-4">
          <Button onClick={toggleMic} className={`rounded-full w-12 h-12 ${isMicOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}>{isMicOn ? <Mic className="h-5 w-5 text-white" /> : <MicOff className="h-5 w-5 text-white" />}</Button>
          <Button onClick={toggleVideo} className={`rounded-full w-12 h-12 ${isVideoOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}>{isVideoOn ? <Video className="h-5 w-5 text-white" /> : <VideoOff className="h-5 w-5 text-white" />}</Button>
          <Button onClick={handleEndMeeting} className="rounded-full w-12 h-12 bg-red-600 hover:bg-red-700"><PhoneOff className="h-5 w-5 text-white" /></Button>
          <Button onClick={toggleScreenShare} className={`rounded-full w-12 h-12 ${isScreenSharing ? 'bg-yellow-400 hover:bg-yellow-500 text-gray-900' : 'bg-gray-700 hover:bg-gray-600'}`}><MonitorUp className={`h-5 w-5 ${isScreenSharing ? 'text-gray-900' : 'text-white'}`} /></Button>
          <Button onClick={() => setShowSettings(true)} className="rounded-full w-12 h-12 bg-gray-700 hover:bg-gray-600"><Settings className="h-5 w-5 text-white" /></Button>
        </div>
      </footer>

      {/* Screen Picker Modal (IPC連携) */}
      {showScreenPickerModal && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50"><h3 className="font-bold flex items-center gap-2"><Monitor className="text-blue-600" /> {t('selectScreenToShare')}</h3><button onClick={handleScreenPickerCancel}><X className="h-5 w-5" /></button></div>
            <div className="p-6 overflow-y-auto bg-gray-100 grid grid-cols-2 md:grid-cols-3 gap-4">
              {availableScreens.map(s => (
                <button key={s.id} onClick={() => handleScreenSelect(s.id)} className="flex flex-col gap-2 p-2 rounded-xl hover:bg-blue-50 ring-1 ring-gray-200 hover:ring-blue-400 bg-white transition-all">
                  <div className="relative aspect-video bg-gray-800 rounded overflow-hidden"><img src={s.thumbnail} alt={s.name} className="w-full h-full object-contain" /></div>
                  <span className="text-sm font-medium text-gray-700 truncate w-full px-1">{s.name}</span>
                </button>
              ))}
            </div>
            <div className="p-4 border-t bg-white flex justify-end"><Button onClick={handleScreenPickerCancel} variant="outline">{t('cancel')}</Button></div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" onClick={() => setShowSettings(false)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-yellow-400 to-amber-400 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3"><div className="w-10 h-10 bg-white rounded-full flex items-center justify-center"><Settings className="h-5 w-5 text-yellow-600" /></div><div><h2 className="text-white font-bold text-lg">{t('systemSettings')}</h2><p className="text-yellow-100 text-xs">{t('deviceAndMeetingSettings')}</p></div></div>
              <Button variant="ghost" onClick={() => setShowSettings(false)} className="text-white hover:bg-white/20 rounded-full w-8 h-8 p-0">✕</Button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6">
              {/* Microphone Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200 pb-2"><Mic className="h-5 w-5 text-gray-700" /><h3 className="font-bold text-gray-900">{t('mic')}</h3></div>
                <div>
                  <select
                    value={selectedMicId}
                    onChange={(e) => handleDeviceChange('audioinput', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 text-sm bg-white mb-3"
                  >
                    {!selectedMicId && <option value="" disabled>{t('selectingDevice')}</option>}
                    {mics.map(m => <option key={m.deviceId} value={m.deviceId}>{m.label || `Microphone ${m.deviceId.slice(0, 5)}...`}</option>)}
                  </select>
                  <div className="flex items-center gap-3 px-1">
                    <Volume1 className="h-4 w-4 text-gray-500" />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={micVolume}
                      onChange={(e) => setMicVolume(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                    />
                    <span className="text-xs font-semibold text-gray-600 w-8 text-right">{micVolume}%</span>
                  </div>
                </div>
              </div>

              {/* Speaker Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200 pb-2"><Volume2 className="h-5 w-5 text-gray-700" /><h3 className="font-bold text-gray-900">{t('speaker')}</h3></div>
                <div>
                  <select
                    value={selectedSpeakerId}
                    onChange={(e) => handleDeviceChange('audiooutput', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 text-sm bg-white mb-3"
                    disabled={speakers.length === 0}
                  >
                    {!selectedSpeakerId && <option value="" disabled>{t('selectingDevice')}</option>}
                    {speakers.map(s => <option key={s.deviceId} value={s.deviceId}>{s.label || `Speaker ${s.deviceId.slice(0, 5)}...`}</option>)}
                  </select>
                  <div className="flex items-center gap-3 px-1">
                    <VolumeX className="h-4 w-4 text-gray-500" />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={speakerVolume}
                      onChange={(e) => setSpeakerVolume(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                    />
                    <span className="text-xs font-semibold text-gray-600 w-8 text-right">{speakerVolume}%</span>
                  </div>
                </div>
              </div>

              {/* Video Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200 pb-2"><Video className="h-5 w-5 text-gray-700" /><h3 className="font-bold text-gray-900">{t('videoSettings')}</h3></div>
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{t('camera')}</label>
                    <select
                      value={selectedCameraId}
                      onChange={(e) => handleDeviceChange('videoinput', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 text-sm bg-white"
                    >
                      {!selectedCameraId && <option value="" disabled>{t('selectingDevice')}</option>}
                      {cameras.map(c => <option key={c.deviceId} value={c.deviceId}>{c.label || `Camera ${c.deviceId.slice(0, 5)}...`}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3 shrink-0">
              <Button variant="ghost" onClick={() => setShowSettings(false)} className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg">{t('cancel')}</Button>
              <Button onClick={() => setShowSettings(false)} className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg font-semibold">{t('save')}</Button>
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
                  {t('endMeetingConfirm')}
                </h2>
                <p className="text-red-100 text-sm">
                  {t('endMeeting')}
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
                        <span>{t('time')}: {formatDuration(duration)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                      <Users className="h-4 w-4 text-gray-600 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">{t('participantsCount')}</p>
                      <p className="text-lg font-bold text-gray-900">{participants.length + 2}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                      <Languages className="h-4 w-4 text-yellow-600 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">{t('translationCount')}</p>
                      <p className="text-lg font-bold text-gray-900">{translationLogs.length}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                      <MessageSquare className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">{t('chatCount')}</p>
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
                        {t('endMeetingWarningTitle')}
                      </p>
                      <ul className="text-xs text-amber-800 space-y-1">
                        <li>• {t('endMeetingWarningList1')}</li>
                        <li>• {t('endMeetingWarningList2')}</li>
                        <li>• {t('endMeetingWarningList3')}</li>
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
                {t('cancel')}
              </Button>
              <Button
                onClick={confirmEndMeeting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <PhoneOff className="h-4 w-4 mr-2 inline" />
                {t('endMeetingAction')}
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
        onNameChange={setEditedUserName}
        onAvatarChange={setEditedUserAvatar}
        onAvatarTypeChange={setEditedAvatarType}
        onAvatarImageUpload={(e) => { }}
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
  const { t } = useTranslation();
  const { livekitToken, livekitUrl, participantName, initialMicOn, initialVideoOn, audioDeviceId, videoDeviceId, audioOutputDeviceId } = location.state || {};

  useEffect(() => {
    if (!livekitToken || !livekitUrl) {
      toast.error(t('noConnectionInfo'));
      navigate(`/meeting-setup/${id}`);
    }
  }, [livekitToken, livekitUrl, navigate, id]);

  console.log(`[ActiveMeeting] Connecting to LiveKit URL: ${livekitUrl} with Token length: ${livekitToken?.length}`);

  return (
    <LiveKitRoom
      token={livekitToken}
      serverUrl={livekitUrl}
      connectOptions={{
        autoSubscribe: true,
      }}
      video={initialVideoOn ? { deviceId: videoDeviceId } : false}
      audio={initialMicOn ? { deviceId: audioDeviceId } : false}
      onDisconnected={() => navigate('/')}
      onError={(err) => {
        console.error("❌ LiveKit Connection Error:", err);
        // Specifically catch the DNS error pattern from the user report if possible, though it's usually generic here
        toast.error(`${t('connectionError')}: ${err.message || t('connectionError')}`);
      }}
      className="h-screen w-full bg-gray-900"
    >
      <ActiveMeetingContent
        meetingId={id || ''}
        currentUserProp={{ name: participantName || 'Me', language: 'ja' }}
        devices={{ audioInputId: audioDeviceId, videoInputId: videoDeviceId, audioOutputId: audioOutputDeviceId }}
        initialSettings={{ isMicOn: initialMicOn, isVideoOn: initialVideoOn }}
        livekitToken={livekitToken}
      />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}