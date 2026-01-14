import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
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
  X,
  Languages
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { ProfileSettingsModal, SystemSettingsModal } from '../components/SettingsModals';
import { toast } from 'sonner';

declare global {
  interface Window {
    electron: {
      invokeApi: (channel: string, data: any) => Promise<any>;
    }
  }
}

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
  isMe: boolean;
  translated?: string;
  showTranslation?: boolean;
}

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [minutes, setMinutes] = useState<MeetingMinute[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [userName, setUserName] = useState('Me');
  const [userEmail, setUserEmail] = useState('');
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

  // Additional profile settings states
  const [userAvatar, setUserAvatar] = useState('');
  const [avatarType, setAvatarType] = useState<'emoji' | 'image' | 'none'>('none');
  const [editedUserName, setEditedUserName] = useState('');
  const [editedUserAvatar, setEditedUserAvatar] = useState('');
  const [editedAvatarType, setEditedAvatarType] = useState<'emoji' | 'image' | 'none'>('none');
  const [systemLanguage, setSystemLanguage] = useState<'ja' | 'ko' | 'en'>('ja');

  const handleJoinMeeting = () => {
  // 토큰 발급 없이 바로 장치 설정(Setup) 화면으로 이동
  navigate(`/meeting-setup/${id}`); };
  
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
    
    // Load rooms
    const savedRooms = JSON.parse(localStorage.getItem('uri-tomo-rooms') || '[]');
    setRooms(savedRooms);
    
    // Find current room
    const room = savedRooms.find((r: Room) => r.id === id);
    if (room) {
      setCurrentRoom(room);
    }

    // Load user info
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
      setUserName(savedUser.split('@')[0]);
      setUserEmail(savedUser);
    }

    if (savedLanguage) {
      setSystemLanguage(savedLanguage as 'ja' | 'ko' | 'en');
    }

    // Load participants from contacts
    const savedContacts = JSON.parse(localStorage.getItem('uri-tomo-contacts') || '[]');
    const contactParticipants = savedContacts.map((c: any) => ({
      id: c.id,
      name: c.name,
      isOnline: c.status === 'online',
    }));
    setParticipants(contactParticipants);

    // Load chat messages for this room
    const savedMessages = JSON.parse(
      localStorage.getItem(`uri-tomo-chat-${id}`) || '[]'
    );
    setMessages(
      savedMessages.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      }))
    );

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

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: userName,
      message: inputMessage,
      timestamp: new Date(),
      isMe: true,
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    
    // Save to localStorage
    localStorage.setItem(
      `uri-tomo-chat-${id}`,
      JSON.stringify(updatedMessages)
    );

    setInputMessage('');
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
        const fileMessage: ChatMessage = {
          id: Date.now().toString(),
          sender: userName,
          message: `📎 ${file.name}`,
          timestamp: new Date(),
          isMe: true,
        };
        const updatedMessages = [...messages, fileMessage];
        setMessages(updatedMessages);
        localStorage.setItem(
          `uri-tomo-chat-${id}`,
          JSON.stringify(updatedMessages)
        );
      }
    };
    input.click();
  };

  const handleStickerSelect = (sticker: string) => {
    const stickerMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: userName,
      message: sticker,
      timestamp: new Date(),
      isMe: true,
    };
    const updatedMessages = [...messages, stickerMessage];
    setMessages(updatedMessages);
    localStorage.setItem(
      `uri-tomo-chat-${id}`,
      JSON.stringify(updatedMessages)
    );
    setShowStickerPicker(false);
  };

  const handleTranslateMessage = (messageId: string) => {
    const updatedMessages = messages.map(msg => {
      if (msg.id === messageId) {
        // Mock translation (simulate AI translation)
        let translatedText = '';
        if (!msg.translated) {
          // Simple mock: if message contains Japanese, translate to Korean and vice versa
          const hasJapanese = /[\\u3040-\\u309F\\u30A0-\\u30FF]/.test(msg.message);
          const hasKorean = /[\\uAC00-\\uD7AF]/.test(msg.message);
          
          if (hasJapanese) {
            translatedText = `[KO] ${msg.message}`; // Mock Korean translation
          } else if (hasKorean) {
            translatedText = `[JA] ${msg.message}`; // Mock Japanese translation
          } else {
            translatedText = `[翻訳] ${msg.message}`;
          }
        }
        
        return {
          ...msg,
          translated: translatedText || msg.translated,
          showTranslation: !msg.showTranslation,
        };
      }
      return msg;
    });
    
    setMessages(updatedMessages);
    localStorage.setItem(
      `uri-tomo-chat-${id}`,
      JSON.stringify(updatedMessages)
    );
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
      alert('Room名を入力してください');
      return;
    }

    // Update rooms in localStorage
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

  const participantCount = participants.filter(p => p.isOnline).length + 1; // +1 for current user

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
              onClick={() => setShowMembersPanel(!showMembersPanel)}
              className="px-4 py-2 bg-yellow-100 rounded-full hover:bg-yellow-200 transition-colors cursor-pointer"
              title="メンバー一覧を表示"
            >
              <span className="text-sm font-semibold text-yellow-800">
                {participantCount}人
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
              className={`px-4 py-2 font-semibold text-gray-900 ${
                activeTab === 'documents' ? 'border-b-2 border-yellow-400' : ''
              }`}
              onClick={() => setActiveTab('documents')}
            >
              Documents
            </button>
            <button
              className={`px-4 py-2 font-semibold text-gray-900 ${
                activeTab === 'chat' ? 'border-b-2 border-yellow-400' : ''
              }`}
              onClick={() => setActiveTab('chat')}
            >
              Chat
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
                  placeholder="キーワード検索"
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent w-64"
                />
              </div>
            )}
            
            <Button
              onClick={handleStartMeeting}
              className="bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 text-white font-semibold px-6"
            >
              <Video className="h-5 w-5 mr-2" />
              Meeting start
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
                    議事録はまだありません
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    ミーティングを開始すると、議事録が自動的に作成されます
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
                    メッセージはまだありません
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    最初のメッセージを送信してみましょう
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
                  className={`flex items-start gap-2 ${message.isMe ? 'justify-end' : 'justify-start'} group`}
                >
                  {/* Translate button - show on left for incoming messages */}
                  {!message.isMe && (
                    <button
                      onClick={() => handleTranslateMessage(message.id)}
                      className="mt-7 p-1.5 rounded-full bg-white border border-gray-200 hover:bg-yellow-50 hover:border-yellow-300 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                      title="翻訳"
                    >
                      <Languages className="h-3.5 w-3.5 text-yellow-600" />
                    </button>
                  )}

                  <div className={`max-w-2xl ${message.isMe ? 'text-right' : 'text-left'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-700">
                        {message.sender}
                      </span>
                      <span className="text-xs text-gray-400">
                        {message.timestamp.toLocaleTimeString('ja-JP', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="relative inline-block">
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          message.isMe
                            ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-white'
                            : 'bg-white border border-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        {message.showTranslation && message.translated && (
                          <div className={`mt-2 pt-2 border-t ${message.isMe ? 'border-yellow-300' : 'border-gray-300'}`}>
                            <p className="text-xs opacity-75 whitespace-pre-wrap">
                              {message.translated}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Translate button - show on right for outgoing messages */}
                  {message.isMe && (
                    <button
                      onClick={() => handleTranslateMessage(message.id)}
                      className="mt-7 p-1.5 rounded-full bg-white border border-gray-200 hover:bg-yellow-50 hover:border-yellow-300 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                      title="翻訳"
                    >
                      <Languages className="h-3.5 w-3.5 text-yellow-600" />
                    </button>
                  )}
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

            <div className="flex items-center gap-3">
              {/* File Attach Button */}
              <button
                onClick={handleFileAttach}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="ファイルを添付"
              >
                <Paperclip className="h-5 w-5 text-gray-600" />
              </button>

              {/* Sticker Button */}
              <button
                onClick={() => setShowStickerPicker(!showStickerPicker)}
                className={`p-2 rounded-lg transition-colors ${
                  showStickerPicker
                    ? 'bg-yellow-200 text-yellow-700'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                title="スタンプを選択"
              >
                <Smile className="h-5 w-5" />
              </button>

              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="メッセージを入力..."
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
              AI翻訳機能でメッセージを自動翻訳します
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
              メンバー一覧
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
              onClick={() => {
                toast.info('メンバー追加機能は開発中です');
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 text-white font-semibold rounded-lg transition-all"
            >
              <UserPlus className="h-5 w-5" />
              メンバーを追加
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
                  <p className="text-sm text-gray-600">あなた</p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-xs text-gray-600">オンライン</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Other Participants */}
            {participants.filter(p => p.isOnline).map((participant) => (
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
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-xs text-gray-600">オンライン</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Offline Participants */}
            {participants.filter(p => !p.isOnline).length > 0 && (
              <>
                <div className="pt-4 pb-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    オフライン ({participants.filter(p => !p.isOnline).length})
                  </h3>
                </div>
                {participants.filter(p => !p.isOnline).map((participant) => (
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
                          <div className="w-2 h-2 bg-gray-400 rounded-full" />
                          <span className="text-xs text-gray-500">オフライン</span>
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
              合計 {participantCount} 人のメンバー
            </p>
          </div>
        </motion.div>
      )}
    </main>
  );
}