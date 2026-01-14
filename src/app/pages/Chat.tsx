import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, Bot, User, Search, Smile, Paperclip } from 'lucide-react';
import { motion } from 'motion/react';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { ProfileSettingsModal, SystemSettingsModal } from '../components/SettingsModals';

interface Message {
  id: string;
  sender: 'user' | 'contact' | 'uri-tomo';
  text: string;
  timestamp: Date;
  isTranslation?: boolean;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'offline';
}

interface Room {
  id: string;
  name: string;
  icon?: string;
}

export function Chat() {
  const navigate = useNavigate();
  const { contactId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [contact, setContact] = useState<Contact | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

    // Load contact info
    const savedContacts = JSON.parse(localStorage.getItem('uri-tomo-contacts') || '[]');
    const currentContact = savedContacts.find((c: Contact) => c.id === contactId);
    if (currentContact) {
      setContact(currentContact);
    }

    // Load or initialize messages
    const chatKey = `uri-tomo-chat-${contactId}`;
    const savedMessages = localStorage.getItem(chatKey);
    
    if (savedMessages) {
      const parsedMessages = JSON.parse(savedMessages);
      setMessages(parsedMessages.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp)
      })));
    } else {
      // Initial Uri-Tomo greeting
      const initialMessage: Message = {
        id: '1',
        sender: 'uri-tomo',
        text: `${currentContact?.name || 'Friend'}とのダイレクトチャットが開始されました。AI翻訳機能で自動翻訳します。`,
        timestamp: new Date(),
      };
      setMessages([initialMessage]);
      localStorage.setItem(chatKey, JSON.stringify([initialMessage]));
    }
  }, [contactId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: newMessage,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    // Save to localStorage
    const chatKey = `uri-tomo-chat-${contactId}`;
    localStorage.setItem(chatKey, JSON.stringify(updatedMessages));
    
    setNewMessage('');

    // Simulate contact response after a delay
    setTimeout(() => {
      const contactMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'contact',
        text: '안녕하세요! (こんにちは！)',
        timestamp: new Date(),
      };
      const withResponse = [...updatedMessages, contactMessage];
      setMessages(withResponse);
      localStorage.setItem(chatKey, JSON.stringify(withResponse));
    }, 1000);
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
        const fileMessage: Message = {
          id: Date.now().toString(),
          sender: 'user',
          text: `📎 ${file.name}`,
          timestamp: new Date(),
        };
        const updatedMessages = [...messages, fileMessage];
        setMessages(updatedMessages);
        const chatKey = `uri-tomo-chat-${contactId}`;
        localStorage.setItem(chatKey, JSON.stringify(updatedMessages));
      }
    };
    input.click();
  };

  const handleStickerSelect = (sticker: string) => {
    const stickerMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: sticker,
      timestamp: new Date(),
    };
    const updatedMessages = [...messages, stickerMessage];
    setMessages(updatedMessages);
    const chatKey = `uri-tomo-chat-${contactId}`;
    localStorage.setItem(chatKey, JSON.stringify(updatedMessages));
    setShowStickerPicker(false);
  };

  const handleBack = () => {
    navigate('/home');
  };

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          
          {contact && (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-400 flex items-center justify-center text-white font-semibold">
                <User className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-gray-900">{contact.name}</p>
                <p className="text-sm text-gray-500">{contact.email}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Search Bar */}
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
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${
              message.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.sender === 'uri-tomo' ? (
              <div className="max-w-2xl">
                <div className="flex items-start gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-amber-400 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xs text-gray-500 font-semibold">Uri-Tomo</span>
                  <span className="text-xs text-gray-400">
                    {message.timestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="ml-8 bg-gradient-to-r from-yellow-100 to-amber-100 border border-yellow-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-gray-800">{message.text}</p>
                </div>
              </div>
            ) : message.sender === 'contact' ? (
              <div className="max-w-md">
                <div className="flex items-start gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-blue-400 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xs text-gray-500 font-semibold">{contact?.name}</span>
                  <span className="text-xs text-gray-400">
                    {message.timestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="ml-8 bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
                  <p className="text-sm text-gray-800">{message.text}</p>
                </div>
              </div>
            ) : (
              <div className="max-w-md">
                <div className="flex items-start gap-2 mb-1 justify-end">
                  <span className="text-xs text-gray-400">
                    {message.timestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-xs text-gray-500 font-semibold">あなた</span>
                </div>
                <div className="bg-blue-500 text-white rounded-lg px-4 py-3 shadow-sm">
                  <p className="text-sm">{message.text}</p>
                </div>
              </div>
            )}
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Area */}
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
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="メッセージを入力..."
            className="flex-1 border-gray-300 focus:ring-2 focus:ring-yellow-400"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
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