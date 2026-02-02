import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  Users,
  FileText,
  Send,
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Settings,
  Plus,
  MessageCircle,
  LogOut,
  Bot,
  Calendar,
  Clock,
  ChevronRight,
  Search,
  Smile,
  Bell,
  Lock,
  UserPlus,
  Edit3,
  Paperclip,
  PanelRightClose,
  PanelRightOpen,
  X
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { ProfileSettingsModal, SystemSettingsModal } from '../components/SettingsModals';
import { toast } from 'sonner';
import { useMeetingSocket } from '../meeting/hooks/useMeetingSocket';
import { ChatMessage } from '../meeting/types';
import { useTranslation } from '../hooks/useTranslation';
import { roomApi } from '../api/room';
import { userApi } from '../api/user';
import { RoomMember, Friend } from '../api/types';

/* 
interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
  isMe: boolean;
  translated?: string;
  showTranslation?: boolean;
}
*/

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
  locale?: string;
}

interface Room {
  id: string;
  name: string;
}

interface MeetingMinute {
  id: string;
  title: string;
  date: Date;
  duration: number; // in minutes
  participants: string[];
  summary?: string;
  roomId: string;
}

export function MeetingRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  // const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Initialize userName from localStorage
  const getInitialUserName = () => {
    try {
      const profile = localStorage.getItem('uri-tomo-user-profile');
      if (profile) {
        const parsed = JSON.parse(profile);
        return parsed.name || 'ユーザー';
      }
    } catch (e) {
      console.error('Failed to load user profile:', e);
    }
    return 'ユーザー';
  };

  const [userName, setUserName] = useState(getInitialUserName);
  const [userEmail, setUserEmail] = useState('');

  // WebSocket Hook (must be after userName is defined)
  const { messages, sendMessage: sendWsMessage, sessionId } = useMeetingSocket({
    roomId: id || '',
    userName
  });

  const [minutes, setMinutes] = useState<MeetingMinute[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'documents'>('chat');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showRoomSettings, setShowRoomSettings] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showSystemSettings, setShowSystemSettings] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [roomNotifications, setRoomNotifications] = useState(true);
  const [showMembersList, setShowMembersList] = useState(false);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [roomDetail, setRoomDetail] = useState<{ participant_count: number } | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]); // Friends list

  // Additional profile settings states
  const [userAvatar, setUserAvatar] = useState('');
  const [avatarType, setAvatarType] = useState<'emoji' | 'image' | 'none'>('none');
  const [editedUserName, setEditedUserName] = useState('');
  const [editedUserAvatar, setEditedUserAvatar] = useState('');
  const [editedAvatarType, setEditedAvatarType] = useState<'emoji' | 'image' | 'none'>('none');
  const { t, language: systemLanguage, setSystemLanguage } = useTranslation();

  // Add Member Modal State
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);

  const handleJoinMeeting = () => {
    // 토큰 발급 없이 바로 장치 설정(Setup) 화면으로 이동
    navigate(`/meeting-setup/${id}`);
  };

  // Helper: Get country flag from locale
  const getCountryFlag = (locale?: string): string => {
    if (!locale) return '🌐';
    const lowerLocale = locale.toLowerCase();
    if (lowerLocale === 'ja' || lowerLocale === 'jp') return '🇯🇵';
    if (lowerLocale === 'ko' || lowerLocale === 'kr') return '🇰🇷';
    if (lowerLocale === 'en' || lowerLocale === 'us') return '🇺🇸';
    return '🌐';
  };

  // Handle Add Member
  const handleAddMember = async (email: string) => {
    if (!email.trim()) {
      toast.error(t('enterEmail'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error(t('validEmail'));
      return;
    }

    if (!id) {
      toast.error(t('roomIdMissing'));
      return;
    }

    setIsAddingMember(true);

    try {
      const result = await roomApi.addMember(id, email);

      // result is now InviteMemberResponse { message, invite_id, status }
      toast.success(t('invitationSent') || 'Invitation sent successfully', {
        description: t('invitationSentDesc') || 'User will join after accepting the invitation.',
        duration: 4000,
      });

      setShowAddMemberModal(false);
    } catch (error: any) {
      console.error('Failed to add member:', error);

      if (error.response?.status === 404) {
        const detail = error.response?.data?.detail || '';
        if (detail.includes('User')) {
          toast.error(t('emailNotFound'));
        } else if (detail.includes('Room')) {
          toast.error(t('roomNotFound'));
        } else {
          toast.error(t('notFound'));
        }
      } else if (error.response?.status === 409) {
        toast.error(t('memberAlreadyExists'));
      } else if (error.response?.status === 403) {
        toast.error(t('noPermission'));
      } else {
        toast.error(t('memberAddFailed'));
      }
    } finally {
      setIsAddingMember(false);
    }
  };

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
    // Check if we need to switch to documents tab (from Minutes page)
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }

    // Load room details from API
    const fetchRoomDetail = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await roomApi.getRoomDetail(id);
        setCurrentRoom({ id: data.id, name: data.name });
        setRoomName(data.name);

        // Map API members to local Participant type
        const apiParticipants = data.members.map((m: RoomMember) => ({
          id: m.id,
          name: m.name,
          isOnline: m.status === 'online',
          locale: m.locale,
        }));
        setParticipants(apiParticipants);
        setRoomDetail({ participant_count: data.participant_count });
      } catch (error) {
        console.error('Failed to fetch room detail:', error);
        toast.error(t('roomLoadError'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoomDetail();

    // Fetch friends list
    const fetchFriends = async () => {
      try {
        const data = await userApi.getMainData();
        setFriends(data.user_friends);
      } catch (error) {
        console.error('Failed to fetch friends:', error);
      }
    };
    fetchFriends();

    // Load meeting minutes for this room
    const savedMinutes = JSON.parse(
      localStorage.getItem('meetings') || '[]'
    );

    // Filter minutes for this room only and remove duplicates
    const roomMinutes = savedMinutes
      .filter((m: any) => m.id === id || m.id?.startsWith(id))
      .reduce((unique: any[], current: any) => {
        // Check if this ID already exists in the unique array
        const exists = unique.find(item => item.id === current.id);
        if (!exists) {
          unique.push({
            id: current.id,
            title: current.title || '会議',
            date: new Date(current.startTime || current.date),
            duration: current.endTime && current.startTime
              ? Math.floor((new Date(current.endTime).getTime() - new Date(current.startTime).getTime()) / 60000)
              : current.duration || 0,
            participants: current.participants?.map((p: any) => p.name) || [],
            summary: current.summary?.keyPoints?.[0] || '',
            roomId: id,
          });
        }
        return unique;
      }, []);

    setMinutes(roomMinutes);
  }, [id]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Initialize room settings when currentRoom is loaded
    if (currentRoom) {
      setRoomName(currentRoom.name || '');
    }
  }, [currentRoom]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    sendWsMessage(inputMessage);
    setInputMessage('');

    // Legacy local save (optional, maybe remove?)
    // const newMessage: ChatMessage = { ... };
    // setMessages([...messages, newMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileAttach = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf,.doc,.docx,.txt';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        sendWsMessage(`📎 ${file.name}`);
      }
    };
    input.click();
  };

  const handleStickerSelect = (sticker: string) => {
    sendWsMessage(sticker);
    setShowStickerPicker(false);
  };

  const handleRoomChange = (roomId: string) => {
    navigate(`/meeting/${roomId}`);
  };

  const handleStartMeeting = () => {
    // Navigate to setup page first
    navigate(`/meeting-setup/${id}`);
  };

  const handleSaveRoomSettings = () => {
    if (!roomName.trim()) {
      alert(t('enterRoomName'));
      return;
    }

    // Update rooms in localStorage (Keeping as backup for now, but should ideally use API)
    const savedRooms = JSON.parse(localStorage.getItem('uri-tomo-rooms') || '[]');
    const updatedRooms = savedRooms.map((r: Room) =>
      r.id === id ? { ...r, name: roomName } : r
    );
    localStorage.setItem('uri-tomo-rooms', JSON.stringify(updatedRooms));

    // Update current room
    setCurrentRoom({ id: id || '', name: roomName });
    setRooms(updatedRooms);

    setShowRoomSettings(false);
  };

  const participantCount = roomDetail?.participant_count || (participants.filter(p => p.isOnline).length + 1);

  return (
    <main className="flex-1 flex relative">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {currentRoom?.name || 'Room'}
              </h1>
              <div className="flex items-center -space-x-2">
                {participants.filter(p => p.isOnline).map((participant) => (
                  <div
                    key={participant.id}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 border-2 border-white flex items-center justify-center text-white font-bold"
                    title={participant.name}
                  >
                    {participant.name.charAt(0)}
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-400 border-2 border-white flex items-center justify-center text-white font-bold">
                  {userName.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowRoomSettings(true)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-all"
                title={t('roomSettings')}
              >
                <Settings className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowMembersPanel(!showMembersPanel)}
                className="px-4 py-2 bg-yellow-100 rounded-full hover:bg-yellow-200 transition-colors cursor-pointer"
                title="メンバー一覧を表示"
              >
                <span className="text-sm font-semibold text-yellow-800">
                  {participantCount}{t('membersSuffix')}
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs and Meeting Start Button */}
          <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                className={`px-4 py-2 font-semibold text-gray-900 ${activeTab === 'documents' ? 'border-b-2 border-yellow-400' : ''
                  }`}
                onClick={() => setActiveTab('documents')}
              >
                {t('documents')}
              </button>
              <button
                className={`px-4 py-2 font-semibold text-gray-900 ${activeTab === 'chat' ? 'border-b-2 border-yellow-400' : ''
                  }`}
                onClick={() => setActiveTab('chat')}
              >
                {t('chat')}
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Search Bar - Show only in Chat tab */}
              {activeTab === 'chat' && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder={t('keywordSearch')}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent w-64"
                  />
                </div>
              )}

              <Button
                onClick={handleStartMeeting}
                className="bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 text-white font-semibold px-6"
              >
                <Video className="h-5 w-5 mr-2" />
                {t('meetingStart')}
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {activeTab === 'documents' && (
              minutes.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-amber-400 rounded-full flex items-center justify-center">
                      <FileText className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-gray-500">
                      {t('noMinutes')}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {t('minutesAutoCreated')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto space-y-3">
                  {minutes.map((minute, index) => (
                    <motion.div
                      key={minute.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card
                        className="p-5 hover:shadow-lg transition-all cursor-pointer border-2 border-gray-100 hover:border-yellow-200"
                        onClick={() => navigate(`/minutes/${minute.id}`)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                              {minute.title}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {minute.date.toLocaleDateString('ja-JP', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{minute.duration}分</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>{minute.participants.length}人</span>
                              </div>
                            </div>
                            {minute.summary && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {minute.summary}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-4" />
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )
            )}

            {activeTab === 'chat' && (
              messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-amber-400 rounded-full flex items-center justify-center">
                      <MessageCircle className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-gray-500">
                      {t('noMessages')}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {t('firstMessagePrompt')}
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-start gap-2 ${message.isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-2xl ${message.isMe ? 'text-right' : 'text-left'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-700">
                          {message.display_name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(message.created_at).toLocaleTimeString('ja-JP', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="relative inline-block">
                        <div
                          className={`px-4 py-2 rounded-2xl ${message.isMe
                            ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-white'
                            : 'bg-white border border-gray-200 text-gray-900'
                            }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input - Show only when Chat tab is active */}
          {activeTab === 'chat' && (
            <div className="bg-white border-t border-gray-200 px-6 py-4">
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
                        onClick={() => handleStickerSelect(sticker)}
                        className="text-3xl p-3 rounded-lg hover:bg-yellow-200 transition-all transform hover:scale-110 active:scale-95"
                        title={t('addSticker')}
                      >
                        {sticker}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              <div className="flex items-center gap-3">
                {/* File Attach Button */}
                <button
                  onClick={handleFileAttach}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title={t('attachFile')}
                >
                  <Paperclip className="h-5 w-5 text-gray-600" />
                </button>

                {/* Sticker Button */}
                <button
                  onClick={() => setShowStickerPicker(!showStickerPicker)}
                  className={`p-2 rounded-lg transition-colors ${showStickerPicker
                    ? 'bg-yellow-200 text-yellow-700'
                    : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  title={t('selectSticker')}
                >
                  <Smile className="h-5 w-5" />
                </button>

                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t('typeMessage')}
                  className="flex-1 border-gray-300 focus:ring-2 focus:ring-yellow-400"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className="p-3 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 disabled:from-gray-300 disabled:to-gray-300 rounded-lg transition-all disabled:cursor-not-allowed"
                >
                  <Send className="h-5 w-5 text-white" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <Bot className="h-3 w-3 text-yellow-600" />
                {t('aiTranslateFeature')}
              </p>
            </div>
          )}
        </div>

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

        {/* System Settings Modal */}
        <SystemSettingsModal
          isOpen={showSystemSettings}
          onClose={() => setShowSystemSettings(false)}
        />
      </div>

      {/* Members Side Panel */}
      {showMembersPanel && (
        <motion.div
          initial={{ x: 320 }}
          animate={{ x: 0 }}
          exit={{ x: 320 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-80 bg-white border-l border-gray-200 flex flex-col"
        >
          {/* Panel Header */}
          <div className="bg-gradient-to-r from-yellow-400 to-amber-400 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('membersList')}
            </h2>
            <button
              onClick={() => setShowMembersPanel(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* Add Member Button */}
          <div className="px-4 py-4 border-b border-gray-200">
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 text-white font-semibold rounded-lg transition-all"
            >
              <UserPlus className="h-5 w-5" />
              {t('addMember')}
            </button>
          </div>

          {/* Members List */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {/* Current User */}
            <div className="p-3 rounded-xl bg-yellow-50 border-2 border-yellow-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-400 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">
                    {userName}
                  </p>
                  <p className="text-sm text-gray-600">{t('you')}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-lg">{getCountryFlag(systemLanguage)}</span>
                    <span className="text-xs text-gray-600">{systemLanguage?.toUpperCase() || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Online Participants */}
            {participants.filter(p => p.isOnline && p.name !== userName).length > 0 && (
              <>
                <div className="pt-4 pb-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {t('online')} ({participants.filter(p => p.isOnline && p.name !== userName).length})
                  </h3>
                </div>
                {participants.filter(p => p.isOnline && p.name !== userName).map((participant) => (
                  <div
                    key={participant.id}
                    className="p-3 rounded-xl bg-white border border-gray-200 hover:border-yellow-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {participant.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate">
                          {participant.name}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-lg">{getCountryFlag(participant.locale)}</span>
                          <span className="text-xs text-gray-600">{participant.locale?.toUpperCase() || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Offline Participants */}
            {participants.filter(p => !p.isOnline && p.name !== userName).length > 0 && (
              <>
                <div className="pt-4 pb-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {t('offline')} ({participants.filter(p => !p.isOnline && p.name !== userName).length})
                  </h3>
                </div>
                {participants.filter(p => !p.isOnline && p.name !== userName).map((participant) => (
                  <div
                    key={participant.id}
                    className="p-3 rounded-xl bg-gray-50 border border-gray-200"
                  >
                    <div className="flex items-center gap-3 opacity-60">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {participant.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate">
                          {participant.name}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-lg opacity-60">{getCountryFlag(participant.locale)}</span>
                          <span className="text-xs text-gray-500">{participant.locale?.toUpperCase() || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Panel Footer */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-600 text-center">
              {t('totalMembers')} {participantCount} {t('membersSuffix')}
            </p>
          </div>
        </motion.div>
      )}

      {/* Room Settings Modal */}
      {showRoomSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-yellow-400 to-amber-400">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Settings className="h-6 w-6" />
                  {t('roomSettings') || 'ルーム設定'}
                </h2>
                <button
                  onClick={() => setShowRoomSettings(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Room Name Change */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  {t('changeRoomName') || 'ルーム名の 변경'}
                </label>
                <div className="flex gap-2">
                  <Input
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder={t('enterRoomName') || 'ルーム名を入力'}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => {
                      toast.info(t('featureUnderDevelopment') || '開発中の機能です');
                    }}
                    className="bg-gray-900 hover:bg-black text-white px-4"
                  >
                    {t('save') || '保存'}
                  </Button>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <button
                  onClick={() => {
                    toast.info(t('featureUnderDevelopment') || '開発中の機能입니다');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 font-bold transition-all"
                >
                  <LogOut className="h-5 w-5" />
                  {t('leaveRoom') || 'ルームから退出'}
                </button>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  {t('leaveRoomDisclaimer') || '退出するとこのルームの履歴にアクセスできなくなります'}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <Button
                onClick={() => setShowRoomSettings(false)}
                variant="outline"
                className="font-semibold"
              >
                {t('close') || '閉じる'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="h-6 w-6 text-yellow-600" />
                {t('addMember')}
              </h2>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('contacts')}</h3>
                {friends.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm mb-2">
                      {t('noContacts') || '連絡先がありません'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {t('addFriendsFirst') || 'ホーム画面から友達を追加してください'}
                    </p>
                  </div>
                ) : (
                  friends.map((friend) => {
                    const friendName = friend.friend_name || friend.email || 'Unknown';
                    const isAlreadyInRoom = participants.some(p => p.id === friend.id || (p.name && friendName && p.name === friendName));

                    return (
                      <button
                        key={friend.id}
                        onClick={() => {
                          handleAddMember(friend.email);
                        }}
                        disabled={isAlreadyInRoom || isAddingMember}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left
                          ${isAlreadyInRoom
                            ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed'
                            : 'bg-white border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 active:scale-98'
                          }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 text-yellow-700 font-bold">
                          {friendName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {friendName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {friend.email}
                          </p>
                        </div>
                        {isAlreadyInRoom && (
                          <span className="text-xs text-gray-400 font-medium">Joined</span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <Button
                onClick={() => {
                  setShowAddMemberModal(false);
                }}
                variant="outline"
              >
                {t('close')}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}