import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    useTracks,
    useRoomContext,
    useLocalParticipant
} from '@livekit/components-react';
import { Track } from 'livekit-client';

// --- Types ---
export interface Participant {
    id: string;
    name: string;
    isVideoOn: boolean;
    isMuted: boolean;
    isSpeaking?: boolean;
    language?: 'ja' | 'ko';
}

export interface TranslationLog {
    id: string;
    speaker: string;
    originalText: string;
    translatedText: string;
    originalLang: 'ja' | 'ko';
    timestamp: Date;
}

export interface ChatMessage {
    id: string;
    sender: string;
    message: string;
    timestamp: Date;
    isAI?: boolean;
    fileUrl?: string; //追加
}

export interface TermExplanation {
    id: string;
    term: string;
    explanation: string;
    detectedFrom: string;
    timestamp: Date;
}

export type SidebarTab = 'translation' | 'chat' | 'members';

// --- Utils ---
const ensureMediaPermission = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        stream.getTracks().forEach(t => t.stop());
    } catch (e) {
        console.warn('Media permission check failed:', e);
    }
};

export function useActiveMeetingLogic({
    meetingId,
    currentUserProp,
    initialDevices,
    initialSettings
}: {
    meetingId: string,
    currentUserProp: any,
    initialDevices?: { audioInputId?: string; videoInputId?: string; audioOutputId?: string },
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

    // Refs
    const chatInputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);


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

    // Scroll to bottom of chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    useEffect(() => {
        const loadProfile = () => {
            // Logic for profile setup
        };
        loadProfile();
        // Replicating mock data initialization from original file
        setParticipants([
            { id: '1', name: 'User A', isVideoOn: true, isMuted: false, language: 'ja' },
            { id: '2', name: 'User B', isVideoOn: true, isMuted: false, language: 'ko' }
        ]);
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
            if (file) {
                const fileUrl = URL.createObjectURL(file);
                const newMessage = {
                    id: Date.now().toString(),
                    sender: currentUser.name,
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

    const handleStickerSelect = (sticker: string) => {
        setChatMessages([...chatMessages, { id: Date.now().toString(), sender: currentUser.name, message: sticker, timestamp: new Date() }]);
        setShowStickerPicker(false);
    };

    const handleEndMeeting = () => setShowEndMeetingConfirm(true);

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
        navigate(`/minutes/${meetingRecord.id}`);
    };

    const formatDuration = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    return {
        currentUser,
        isMicOn,
        isVideoOn,
        mics,
        cameras,
        speakers,
        selectedMicId,
        selectedCameraId,
        selectedSpeakerId,
        isScreenSharing,
        showScreenPickerModal,
        availableScreens,
        showSettings,
        isSidebarOpen,
        showEndMeetingConfirm,
        activeTab,
        chatInput,
        showStickerPicker,
        duration,
        chatMessages,
        translationLogs,
        termExplanations,
        participants,
        meetingTitle,
        showProfileSettings,
        showSystemSettings,
        userName,
        userEmail,
        userAvatar,
        avatarType,
        editedUserName,
        editedUserAvatar,
        editedAvatarType,
        systemLanguage,

        localCameraTrack,
        localScreenTrack,
        remoteTracks,
        chatInputRef,
        chatEndRef,

        setIsMicOn,
        setIsVideoOn,
        setSelectedMicId,
        setSelectedCameraId,
        setSelectedSpeakerId,
        setShowScreenPickerModal,
        setShowSettings,
        setIsSidebarOpen,
        setShowEndMeetingConfirm,
        setActiveTab,
        setChatInput,
        setShowStickerPicker,
        setShowProfileSettings,
        setShowSystemSettings,
        setEditedUserName,
        setEditedUserAvatar,
        setEditedAvatarType,
        setSystemLanguage,
        setUserName,
        setUserAvatar,
        setAvatarType,
        setChatMessages,

        handleDeviceChange,
        toggleScreenShare,
        handleScreenSelect,
        handleScreenPickerCancel,
        toggleMic,
        toggleVideo,
        handleSendChat,
        handleFileAttach,
        handleStickerSelect,
        handleEndMeeting,
        confirmEndMeeting,
        formatDuration
    };
}
