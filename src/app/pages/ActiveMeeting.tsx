import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, Users, Settings, Bot,
  MessageSquare, Languages, Pin, ChevronRight, ChevronLeft, FileText,
  MonitorUp, Paperclip, Smile, AlertTriangle, Clock, Send, Monitor, X,
  User as UserIcon, Wifi, WifiOff
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { ProfileSettingsModal, SystemSettingsModal } from '../components/SettingsModals';
import { toast } from 'sonner';
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
  fileUrl?: string; //追加
}

interface TermExplanation {
  id: string;
  term: string;
  explanation: string;
  detectedFrom: string;
  timestamp: Date;
}

// Summary related types
interface SummaryData {
  summarization: {
    main_point: string;
    task: string;
    decided: string;
  };
  meeting_date: string;
  past_time: string;
  meeting_member: number | string;
}

type SidebarTab = 'translation' | 'chat' | 'members' | 'summary';

// --- Content Component ---
function ActiveMeetingContent({
  meetingId,
  currentUserProp,
  devices: initialDevices,
  initialSettings,
  wsSessionId,
  wsToken
}: {
  meetingId: string,
  currentUserProp: any,
  devices?: { audioInputId?: string; videoInputId?: string; audioOutputId?: string },
  initialSettings?: { isMicOn: boolean, isVideoOn: boolean },
  wsSessionId?: string,  // WebSocket session ID (optional)
  wsToken?: string       // WebSocket auth token (optional)
}) {
  const navigate = useNavigate();
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();

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
  const [meetingTitle] = useState('日韓プロジェクト会議');

  // --- WebSocket Chat State ---
  const ws = useRef<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const BACKEND_WS_URL = import.meta.env.VITE_BACKEND_WS_URL || 'ws://localhost:8000';

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
  // 会議開始時間を記録
  const [startTime] = useState(new Date());

  // --- WebSocket Connection Logic ---
  useEffect(() => {
    // 修正: wsSessionIdがなくても、ルームID (meetingId) を使って接続を試みる
    // さらに、meetingIdがLiveKitの内部ID(数値)になっている可能性があるため、
    // URLから ls_ で始まるIDがあればそれを優先する
    let targetSessionId = wsSessionId || meetingId;

    // URLからセッションIDを抽出 (例: /active-meeting/ls_xxxx)
    const urlMatch = window.location.pathname.match(/(ls_[a-zA-Z0-9]+)/);
    if (urlMatch && urlMatch[1]) {
      console.log(`[ActiveMeeting] Found session ID in URL: ${urlMatch[1]} (overriding ${targetSessionId})`);
      targetSessionId = urlMatch[1];
    }

    if (!targetSessionId) {
      console.log('[ActiveMeeting] No WebSocket session ID or Room ID, using local-only mode');
      return;
    }

    let wsUrl = `${BACKEND_WS_URL}/meeting/${targetSessionId}`;
    if (wsToken) {
      wsUrl += `?token=${wsToken}`;
    }

    console.log('[ActiveMeeting] Connecting to WebSocket:', wsUrl);

    try {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('✅ ActiveMeeting WebSocket Connected');
        setWsConnected(true);
        toast.success('チャットサーバーに接続しました');
      };

      ws.current.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          console.log('📩 WS Message:', msg);

          if (msg.type === 'chat' && msg.data) {
            const newMsg: ChatMessage = {
              id: msg.data.id,
              sender: msg.data.display_name || 'Unknown',
              message: msg.data.text,
              timestamp: new Date(msg.data.created_at)
            };
            setChatMessages(prev => {
              // Avoid duplicates
              if (prev.some(m => m.id === newMsg.id)) {
                return prev;
              }
              return [...prev, newMsg];
            });
          } else if (msg.type === 'translation' && msg.data) {
            // 翻訳メッセージの受信
            const data = msg.data;
            const newLog: TranslationLog = {
              id: Date.now().toString(), // 本当はUUIDなどが良いが簡易的に
              speaker: 'Unknown', // backendからのデータにspeakerが含まれていれば使う
              originalText: data.original_text,
              translatedText: data.translated_text,
              originalLang: data.source_lang as 'ja' | 'ko',
              timestamp: new Date()
            };
            setTranslationLogs(prev => [newLog, ...prev]); // 新しいものを上に

            // チャット欄にも翻訳を表示したい場合（オプション）
            // setChatMessages(...) 

          } else if (msg.type === 'session_connected') {
            console.log('🎉 Session connected:', msg.data);
          } else if (msg.type === 'error') {
            console.error('❌ WS Error:', msg.message);
            toast.error(`チャットエラー: ${msg.message}`);
          }
        } catch (e) {
          console.error('Failed to parse WS message:', e);
        }
      };

      ws.current.onclose = (event) => {
        console.log('❌ WebSocket Closed:', event.code, event.reason);
        setWsConnected(false);
        if (event.code !== 1000) {
          toast.error('チャットサーバーから切断されました');
        }
      };

      ws.current.onerror = (err) => {
        console.error('WebSocket error:', err);
        setWsConnected(false);
      };

      // Ping to keep connection alive
      const pingInterval = setInterval(() => {
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);

      return () => {
        clearInterval(pingInterval);
        if (ws.current) {
          ws.current.close();
        }
      };
    } catch (e) {
      console.error('Failed to create WebSocket:', e);
    }
  }, [wsSessionId, wsToken, BACKEND_WS_URL, meetingId]);

  // --- Logic 1: Screen Share IPC Listener ---
  useEffect(() => {
    if ((window as any).ipcRenderer) {
      (window as any).ipcRenderer.onOpenScreenPicker((sources: any) => {
        setAvailableScreens(sources);
        setShowScreenPickerModal(true);
      });
    }
  }, []);

  // --- Logic 1.5: LiveKit Data Channel Listener (Direct Agent Communication) ---
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload: Uint8Array, participant: any, kind: any) => {
      try {
        const textDecoder = new TextDecoder();
        const strData = textDecoder.decode(payload);
        const msg = JSON.parse(strData);

        console.log('📡 LiveKit Data Received:', msg);

        if (msg.type === 'translation' && msg.data) {
          const data = msg.data;
          const newLog: TranslationLog = {
            id: Date.now().toString(),
            speaker: participant?.identity || 'Unknown',
            originalText: data.original_text,
            translatedText: data.translated_text,
            originalLang: data.source_lang as 'ja' | 'ko',
            timestamp: new Date()
          };
          setTranslationLogs(prev => [newLog, ...prev]);
          toast.success('LiveKit経由で翻訳を受信しました');

        } else if (msg.type === 'chat' && msg.text) {
          // チャットもバックアップとして受信可能にする
          const newMsg: ChatMessage = {
            id: Date.now().toString(),
            sender: participant?.identity || 'Agent',
            message: msg.text,
            timestamp: new Date(),
            isAI: true
          };
          setChatMessages(prev => [...prev, newMsg]);
        }

      } catch (e) {
        console.warn('Failed to parse LiveKit data:', e);
      }
    };

    // イベント定数を文字列で指定するか、import { RoomEvent } from 'livekit-client' が必要だが
    // ここでは文字列 "dataReceived" で代用可能（LiveKit JS SDKの仕様による）
    room.on('dataReceived', handleDataReceived);

    return () => {
      room.off('dataReceived', handleDataReceived);
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

  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  // 要約取得APIの呼び出し
  const fetchSummary = async () => {
    // 修正: チャットの保存先IDと合わせる
    const targetSessionId = wsSessionId || meetingId;

    if (!targetSessionId || !wsToken) {
      toast.error('認証情報が不足しています');
      return;
    }

    try {
      setIsSummaryLoading(true);
      // 環境変数がない場合は、現在のブラウザのホスト名を使ってバックエンドのURLを推測する
      let backendUrl = 'http://localhost:8000';
      if (import.meta.env.VITE_BACKEND_WS_URL) {
        // ws://.../api/v1 のようなパスが含まれている場合に対応するため、URLオブジェクトでパース
        const rawUrl = import.meta.env.VITE_BACKEND_WS_URL.replace('ws://', 'http://').replace('wss://', 'https://');
        try {
          const urlObj = new URL(rawUrl);
          backendUrl = urlObj.origin + urlObj.pathname.replace(/\/$/, ''); // 末尾スラッシュ削除
        } catch (e) {
          backendUrl = rawUrl.replace(/\/$/, '');
        }
      } else {
        const currentHost = window.location.hostname;
        backendUrl = `http://${currentHost}:8000`;
      }

      const requestUrl = `${backendUrl}/summarization/${targetSessionId}`; // バックエンドのルート設定に合わせる
      console.log('🚀 Fetching summary in ActiveMeeting from:', requestUrl);

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${wsToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setSummaryData(data.summary);
      toast.success('要約を生成しました');

      // 翻訳ログも更新（もし含まれていれば）
      if (data.translation_log && Array.isArray(data.translation_log)) {
        // 必要に応じて既存のtranslationLogsとマージしたり置き換えたりする処理
        // setTranslationLogs(...)
      }

    } catch (error) {
      console.error('Failed to fetch summary:', error);
      toast.error('要約の生成に失敗しました');
    } finally {
      setIsSummaryLoading(false);
    }
  };

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
    if (!localParticipant) return;
    const newState = !isMicOn;
    try {
      await localParticipant.setMicrophoneEnabled(newState);
      setIsMicOn(newState);
      toast(newState ? "マイクをオンにしました" : "マイクをミュートしました");
    } catch (e) {
      console.error(e);
      toast.error("マイクの切り替えに失敗しました");
    }
  };

  const toggleVideo = async () => {
    if (!localParticipant) return;
    const newState = !isVideoOn;
    try {
      await localParticipant.setCameraEnabled(newState);
      setIsVideoOn(newState);
      toast(newState ? "カメラをオンにしました" : "カメラをオフにしました");
    } catch (e) {
      console.error(e);
      toast.error("カメラの切り替えに失敗しました");
    }
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;

    if (ws.current?.readyState === WebSocket.OPEN) {
      // WebSocket接続がある場合はサーバーに送信
      ws.current.send(JSON.stringify({
        type: 'chat',
        text: chatInput,
        lang: 'ja'
      }));
      // サーバーからブロードキャストされたメッセージで表示されるため、ローカルには追加しない
    } else {
      // WebSocket接続がない場合はローカルにのみ追加
      setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: currentUser.name,
        message: chatInput,
        timestamp: new Date()
      }]);
    }
    setChatInput('');
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

  // ★ここに追加   --- Refs ---
  const chatInputRef = useRef<HTMLInputElement>(null);
  // 2. メッセージが追加されたらスクロールする処理
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  // 3.ファイル添付
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStickerSelect = (sticker: string) => {
    setChatMessages([...chatMessages, { id: Date.now().toString(), sender: currentUser.name, message: sticker, timestamp: new Date() }]);
    setShowStickerPicker(false);
  };

  const handleEndMeeting = () => setShowEndMeetingConfirm(true);

  const confirmEndMeeting = () => {
    const endTime = new Date();

    // 会議の包括的なレコードを作成
    const meetingRecord = {
      id: wsSessionId || meetingId || Date.now().toString(),
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

    navigate(`/minutes/${meetingRecord.id}`, {
      state: {
        token: wsToken,
        meetingRecord: meetingRecord // 念のためローカルで作ったデータも渡しておく
      }
    });
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
      { id: '1', speaker: 'User A', originalText: 'プロジェクトの進捗について報告します', translatedText: '프로젝트 진행 상황에 대해 보고합니다', originalLang: 'ja', timestamp: new Date(Date.now() - 5000) },
      { id: '2', speaker: 'User B', originalText: '감사합니다. 다음 단계에 대해 논의하고 싶습니다', translatedText: 'ありがとうございます。次のステップについて議論したいです', originalLang: 'ko', timestamp: new Date(Date.now() - 3000) },
    ]);
    setTermExplanations([
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

                {/* Remote Participants (修正: カメラ映像のみ反転) */}
                {remoteTracks.map((track) => (
                  <motion.div key={track.participant.identity + track.source} className="relative bg-gray-800 rounded-xl overflow-hidden border-2 border-gray-700 hover:border-yellow-400 transition-all">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <VideoTrack
                        trackRef={track}
                        className={`w-full h-full ${track.source === Track.Source.ScreenShare ? 'object-contain bg-black' : 'object-cover'}`}
                        // ▼▼▼ 修正: カメラ映像の場合のみ左右反転させるスタイルを追加 ▼▼▼
                        style={track.source === Track.Source.Camera ? { transform: 'scaleX(-1)' } : undefined}
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

                  {/* Description Section */}
                  <div className="border-b border-gray-200 bg-white max-h-48 overflow-y-auto flex-shrink-0">
                    <div className="sticky top-0 bg-white px-4 pt-4 pb-2 border-b border-gray-100"><div className="flex items-center gap-2"><Bot className="h-4 w-4 text-yellow-600" /><h4 className="font-bold text-gray-900 text-sm">Description</h4><span className="text-xs text-gray-500">({termExplanations.length}件の用語解説)</span></div></div>
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
                      className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'translation'
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
                      className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'chat'
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
                      className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'members'
                        ? 'bg-white text-yellow-600 border-b-2 border-yellow-400'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>メンバー</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('summary')}
                      className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'summary'
                        ? 'bg-white text-yellow-600 border-b-2 border-yellow-400'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>要約</span>
                      </div>
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                    {/* Summary Tab */}
                    {activeTab === 'summary' && (
                      <div className="h-full overflow-y-auto p-4">
                        <div className="mb-6">
                          <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <Bot className="h-5 w-5 text-yellow-600" />
                            AI 会議要約
                          </h3>
                          <p className="text-sm text-gray-600 mb-4">
                            Uri-Tomo AIが会議の内容をリアルタイムで分析・要約します。
                          </p>

                          {!summaryData ? (
                            <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                              <p className="text-gray-500 text-sm mb-4">まだ要約が生成されていません</p>
                              <Button
                                onClick={fetchSummary}
                                disabled={isSummaryLoading}
                                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold"
                              >
                                {isSummaryLoading ? (
                                  <><span className="loading loading-spinner loading-xs mr-2"></span>生成中...</>
                                ) : (
                                  <><Bot className="h-4 w-4 mr-2" />要約を生成する</>
                                )}
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                              {/* Metadata Card */}
                              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-gray-500 text-xs">会議日</p>
                                    <p className="font-semibold text-gray-900">{summaryData.meeting_date}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500 text-xs">所要時間</p>
                                    <p className="font-semibold text-gray-900">{summaryData.past_time}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Main Points */}
                              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-5 rounded-xl border border-yellow-200 shadow-sm">
                                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                  <span className="text-xl">💡</span> 主要ポイント
                                </h4>
                                <div className="prose prose-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                  {summaryData.summarization.main_point}
                                </div>
                              </div>

                              {/* Decisions */}
                              <div className="bg-white p-5 rounded-xl border-l-4 border-green-500 shadow-sm">
                                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                  <span className="text-xl">✅</span> 決定事項
                                </h4>
                                <div className="prose prose-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                  {summaryData.summarization.decided}
                                </div>
                              </div>

                              {/* Tasks */}
                              <div className="bg-white p-5 rounded-xl border-l-4 border-blue-500 shadow-sm">
                                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                  <span className="text-xl">📋</span> ネクストアクション
                                </h4>
                                <div className="prose prose-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                  {summaryData.summarization.task}
                                </div>
                              </div>

                              <div className="flex justify-center pt-4">
                                <Button
                                  onClick={fetchSummary}
                                  variant="outline"
                                  disabled={isSummaryLoading}
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  {isSummaryLoading ? '更新中...' : '情報を更新する'}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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
                        {/* WebSocket Connection Status */}
                        {wsSessionId && (
                          <div className={`px-4 py-2 flex items-center gap-2 text-xs border-b ${wsConnected
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            }`}>
                            {wsConnected ? (
                              <>
                                <Wifi className="h-3 w-3" />
                                <span>リアルタイム同期中</span>
                              </>
                            ) : (
                              <>
                                <WifiOff className="h-3 w-3" />
                                <span>接続中...</span>
                              </>
                            )}
                          </div>
                        )}
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
                                        <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
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
                                    title="スタンプの追加"
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
                              className={`p-2 rounded-lg transition-colors ${showStickerPicker
                                ? 'bg-yellow-200 text-yellow-700'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                              title="スタンプを選択"
                            >
                              <Smile className="h-5 w-5" />
                            </button>

                            <input
                              ref={chatInputRef} // ★2. ここに ref を追加
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
                            参加者 ({participants.length + 1}人)
                          </h4>
                          <p className="text-xs text-gray-500">
                            {participants.filter(p => p.isMicrophoneEnabled).length + (isMicOn ? 1 : 0)}人が発言中
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
                                    REMOTE
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

      {/* Settings Modal */}
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
                      {mics.map(m => <option key={m.deviceId} value={m.deviceId}>{m.label || `Microphone ${m.deviceId.slice(0, 5)}...`}</option>)}
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
                      {speakers.map(s => <option key={s.deviceId} value={s.deviceId}>{s.label || `Speaker ${s.deviceId.slice(0, 5)}...`}</option>)}
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
                      {cameras.map(c => <option key={c.deviceId} value={c.deviceId}>{c.label || `Camera ${c.deviceId.slice(0, 5)}...`}</option>)}
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
  const {
    livekitToken,
    livekitUrl,
    participantName,
    initialMicOn,
    initialVideoOn,
    audioDeviceId,
    videoDeviceId,
    audioOutputDeviceId,
    // WebSocket params (optional)
    wsSessionId,
    wsToken
  } = location.state || {};

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
        wsSessionId={wsSessionId}
        wsToken={wsToken}
      />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}