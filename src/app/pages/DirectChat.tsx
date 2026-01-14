import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Home, 
  Users, 
  Send, 
  ArrowLeft,
  Bot,
  MessageCircle,
  Phone,
  Video,
  Mail,
  Pin,
  Smile,
  Paperclip
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ProfileSettingsModal, SystemSettingsModal } from '../components/SettingsModals';
import { toast } from 'sonner';

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

    if (savedLanguage) {
      setSystemLanguage(savedLanguage as 'ja' | 'ko' | 'en');
    }

    // Load chat messages for this contact
    const savedMessages = JSON.parse(
      localStorage.getItem(`uri-tomo-direct-chat-${contactId}`) || '[]'
    );
    
    // Initialize with default messages if empty
    if (savedMessages.length === 0) {
      const defaultMessages: ChatMessage[] = [
        {
          id: '1',
          sender: 'Uri-Tomo',
          message: `${foundContact?.name || 'Friend'}とのダイレクトチャットが開始されました。AI翻訳機能が有効です。`,
          timestamp: new Date(),
          isMe: false,
          isAI: true,
        },
      ];
      setMessages(defaultMessages);
    } else {
      setMessages(
        savedMessages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }))
      );
    }
  }, [contactId]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      `uri-tomo-direct-chat-${contactId}`,
      JSON.stringify(updatedMessages)
    );

    setInputMessage('');

    // Simulate response from contact after 1.5 seconds
    setTimeout(() => {
      const responseMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: contact?.name || 'Friend',
        message: 'メッセージを受け取りました！',
        timestamp: new Date(),
        isMe: false,
      };

      const messagesWithResponse = [...updatedMessages, responseMessage];
      setMessages(messagesWithResponse);
      
      localStorage.setItem(
        `uri-tomo-direct-chat-${contactId}`,
        JSON.stringify(messagesWithResponse)
      );
    }, 1500);
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
          <p className="text-gray-600">コンタクトを読み込んでいます...</p>
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
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white font-bold text-xl">
                {contact.name.charAt(0)}
              </div>
              <div
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                  contact.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                }`}
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{contact.name}</h1>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {contact.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-2 border-yellow-300 hover:bg-yellow-50"
            >
              <Phone className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              className="border-2 border-yellow-300 hover:bg-yellow-50"
            >
              <Video className="h-5 w-5" />
            </Button>
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
            className={`flex ${message.isMe ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-2xl ${message.isMe ? 'text-right' : 'text-left'}`}>
              <div className="flex items-center gap-2 mb-1">
                {message.isAI && (
                  <div className="flex items-center gap-1">
                    <Pin className="h-3 w-3 text-yellow-600" />
                    <Bot className="h-3 w-3 text-yellow-600" />
                  </div>
                )}
                <span className={`text-sm font-semibold ${
                  message.isAI ? 'text-yellow-700' : 'text-gray-700'
                }`}>
                  {message.sender}
                </span>
                <span className="text-xs text-gray-400">
                  {message.timestamp.toLocaleTimeString('ja-JP', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div
                className={`inline-block px-4 py-2 rounded-2xl ${
                  message.isAI
                    ? 'bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-300 text-gray-900'
                    : message.isMe
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.message}</p>
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

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <div className="relative">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`${contact.name}にメッセージを送信...`}
                className="w-full pr-12 py-6 text-base border-2 border-gray-200 focus:border-yellow-400 focus:ring-yellow-400 rounded-xl"
              />
              <button
                onClick={handleSendMessage}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
              >
                <Send className="h-6 w-6" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-2 border-yellow-300 hover:bg-yellow-50"
              onClick={handleFileAttach}
              title="ファイルを添付"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              className={`border-2 transition-colors ${
                showStickerPicker
                  ? 'bg-yellow-200 border-yellow-400'
                  : 'border-yellow-300 hover:bg-yellow-50'
              }`}
              onClick={() => setShowStickerPicker(!showStickerPicker)}
              title="スタンプを選択"
            >
              <Smile className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Info Message */}
        <div className="mt-3 px-2">
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Bot className="h-3 w-3 text-yellow-600" />
            Uri-TomoのAI翻訳機能がメッセージを自動翻訳します
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