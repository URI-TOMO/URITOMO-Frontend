import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  User,
  Send,
  ArrowLeft,
  Bot,
  MessageCircle,
  Phone,
  Video,
  Mail,
  Pin,
  Smile,
  Paperclip,
  Search
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ProfileSettingsModal, SystemSettingsModal } from '../components/SettingsModals';
import { toast } from 'sonner';
import { useTranslation } from '../hooks/useTranslation';
import { dmApi } from '../api/dm';
import { useDmSocket } from '../dm/hooks/useDmSocket';

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
  isMe: boolean;
  isAI?: boolean;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  status: 'online' | 'offline';
}

interface Room {
  id: string;
  name: string;
}

export function DirectChat() {
  const { contactId } = useParams();
  const navigate = useNavigate();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [contact, setContact] = useState<Contact | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [userName, setUserName] = useState('Me');
  const [userEmail, setUserEmail] = useState('');
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showSystemSettings, setShowSystemSettings] = useState(false);

  // Additional profile settings states
  const [userAvatar, setUserAvatar] = useState('');
  const [avatarType, setAvatarType] = useState<'emoji' | 'image' | 'none'>('none');
  const [editedUserName, setEditedUserName] = useState('');
  const [editedUserAvatar, setEditedUserAvatar] = useState('');
  const [editedAvatarType, setEditedAvatarType] = useState<'emoji' | 'image' | 'none'>('none');
  const { t, language: systemLanguage, setSystemLanguage } = useTranslation();

  // DM WebSocket State
  const [threadId, setThreadId] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);

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
    // Load contact info
    const savedContacts = JSON.parse(localStorage.getItem('uri-tomo-contacts') || '[]');
    const foundContact = savedContacts.find((c: Contact) => c.id === contactId);
    if (foundContact) {
      setContact(foundContact);
    }

    // Load rooms
    const savedRooms = JSON.parse(localStorage.getItem('uri-tomo-rooms') || '[]');
    setRooms(savedRooms);

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

    // Load chat messages for this contact from local storage initially
    const storageKey = `uri-tomo-direct-chat-${contactId}`;
    const savedMessages = JSON.parse(
      localStorage.getItem(storageKey) || '[]'
    );

    setMessages(
      savedMessages.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      }))
    );
  }, [contactId]);

  // Get current user ID for DM
  useEffect(() => {
    try {
      const profileStr = localStorage.getItem('uri-tomo-user-profile');
      const userIdFromStorage = localStorage.getItem('uri-tomo-user-id');
      if (profileStr) {
        const profile = JSON.parse(profileStr);
        setMyUserId(profile.id || userIdFromStorage);
      } else if (userIdFromStorage) {
        setMyUserId(userIdFromStorage);
      }
    } catch (e) { console.error('Error getting userId:', e); }
  }, []);

  // Start DM thread
  useEffect(() => {
    if (contactId && myUserId) {
      dmApi.startDm(contactId).then(thread => {
        setThreadId(thread.id);
      }).catch(e => {
        console.error('Failed to start DM:', e);
      });
    }
  }, [contactId, myUserId]);

  // Use DM Socket
  const { messages: dmMessages, sendMessage: sendDmMessage, isConnected } = useDmSocket({
    threadId: threadId || '',
    currentUserId: myUserId
  });

  // Sync DM messages to local state
  useEffect(() => {
    if (dmMessages.length > 0) {
      const mappedMessages: ChatMessage[] = dmMessages.map(m => ({
        id: m.id,
        sender: m.display_name,
        message: m.text,
        timestamp: new Date(m.created_at),
        isMe: m.isMe,
        isAI: false
      }));
      setMessages(mappedMessages);
    }
  }, [dmMessages]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    // If DM WebSocket is connected, send via API
    if (isConnected && threadId) {
      sendDmMessage(inputMessage);
      setInputMessage('');
      return;
    }

    // Fallback to localStorage
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: userName,
      message: inputMessage,
      timestamp: new Date(),
      isMe: true,
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);

    const storageKey = `uri-tomo-direct-chat-${contactId}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedMessages));

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
          `uri-tomo-direct-chat-${contactId}`,
          JSON.stringify(updatedMessages)
        );
      }
    };
    input.click();
  };

  const handleStickerSelect = (sticker: string) => {
    // Send sticker via WebSocket if connected
    if (isConnected && threadId) {
      sendDmMessage(sticker);
      setShowStickerPicker(false);
      return;
    }

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
      `uri-tomo-direct-chat-${contactId}`,
      JSON.stringify(updatedMessages)
    );
    setShowStickerPicker(false);
  };

  const handleRoomChange = (roomId: string) => {
    navigate(`/meeting/${roomId}`);
  };

  if (!contact) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Bot className="h-16 w-16 text-yellow-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">{t('loadingContacts')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/contact')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl">
                <User className="h-6 w-6" />
              </div>
              <div
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${contact.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                  }`}
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{contact.name}</h1>
              <p className="text-sm text-gray-500">{contact.email}</p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="キーワード検索"
                className="pl-9 h-9 text-sm border-gray-200"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex ${message.isMe ? 'justify-end' : 'justify-start'
              }`}
          >
            <div className={`flex flex-col ${message.isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
              <div className="text-[10px] text-gray-500 mb-1 flex items-center gap-2">
                {!message.isMe && <span className="font-bold">{message.sender}</span>}
                <span>
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div
                className={`px-4 py-2 rounded-lg text-sm whitespace-pre-wrap ${message.isMe
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                  }`}
              >
                {message.message}
              </div>
            </div>
          </motion.div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Chat Input */}
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
                  title={t('sendSticker')}
                >
                  {sticker}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <div className="flex items-center gap-3">
          <button
            className="text-gray-400 hover:text-gray-600 transition-colors"
            onClick={handleFileAttach}
            title={t('attachFile')}
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <button
            className={`transition-colors ${showStickerPicker ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => setShowStickerPicker(!showStickerPicker)}
            title={t('selectSticker')}
          >
            <Smile className="h-5 w-5" />
          </button>

          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('typeMessage') || `${t('sendMessageTo')}${contact.name}`}
            className="flex-1 py-2 text-base border-gray-200 focus:border-yellow-400 focus:ring-yellow-400 rounded-md"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            className="p-2 bg-gray-400 hover:bg-gray-500 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>

        {/* Info Message */}
        <div className="mt-2 text-left">
          <p className="text-[10px] text-gray-400 flex items-center gap-1">
            <Bot className="h-3 w-3 text-yellow-500" />
            {t('aiTranslateFeature')}
          </p>
        </div>
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
        onAvatarImageUpload={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              setEditedUserAvatar(reader.result as string);
              setEditedAvatarType('image');
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

      {/* System Settings Modal */}
      <SystemSettingsModal
        isOpen={showSystemSettings}
        onClose={() => setShowSystemSettings(false)}
      />
    </div>
  );
}