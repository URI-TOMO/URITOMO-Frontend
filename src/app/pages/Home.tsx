import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Globe, Edit3, Trash2, MessageCircle, MoreVertical, Mail, User, Bot, Settings, Plus, LogOut, Mic, Video, Monitor, Languages, Image as ImageIcon, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { PageTransition } from '../components/PageTransition';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { ProfileSettingsModal, SystemSettingsModal } from '../components/SettingsModals';
import { userApi } from '../api/user';
import { MainDataResponse } from '../api/types';

// Simple translation helper
const t = (lang: 'ja' | 'ko' | 'en', key: string): string => {
  const translations: Record<string, Record<'ja' | 'ko' | 'en', string>> = {
    contacts: { ja: '連絡先', ko: '연락처', en: 'Contacts' },
    add: { ja: '追加', ko: '추가', en: 'Add' },
    edit: { ja: '編集', ko: '편집', en: 'Edit' },
    delete: { ja: '削除', ko: '삭제', en: 'Delete' },
    cancel: { ja: 'キャンセル', ko: '취', en: 'Cancel' },
    save: { ja: '保存', ko: '저장', en: 'Save' },
    profileSettings: { ja: 'プロフィール設定', ko: '프로필 설정', en: 'Profile Settings' },
    systemSettings: { ja: 'システム設定', ko: '시스템 설정', en: 'System Settings' },
    avatar: { ja: 'アバター', ko: '아바타', en: 'Avatar' },
    emoji: { ja: '絵文字', ko: '이모지', en: 'Emoji' },
    image: { ja: '画像', ko: '이미지', en: 'Image' },
    none: { ja: 'なし', ko: '없음', en: 'None' },
    name: { ja: '名前', ko: '이름', en: 'Name' },
    email: { ja: 'メールアドレス', ko: '이메일 주소', en: 'Email Address' },
    addFriend: { ja: '友達を追加', ko: '친구 추가', en: 'Add Friend' },
    editNickname: { ja: 'ニックネーム編集', ko: '닉네임 편집', en: 'Edit Nickname' },
    contactName: { ja: '連絡先名', ko: '연락처 이름', en: 'Contact Name' },
    nickname: { ja: 'ニックネーム', ko: '닉네임', en: 'Nickname' },
    deleteContact: { ja: '連絡先を削除しますか？', ko: '연락처를 삭제하시겠습니까?', en: 'Delete Contact?' },
    deleteContactDesc: { ja: 'を連絡先から削除します。この操作は取り消せません。', ko: '을(를) 연락처에서 삭제합니다.  작업은 취소할 수 없습니다.', en: 'will be removed from contacts. This action cannot be undone.' },
    languageSettings: { ja: '言語設定', ko: '언어 설정', en: 'Language Settings' },
    audioSettings: { ja: 'オーディオ設定', ko: '오디오 설정', en: 'Audio Settings' },
    videoSettings: { ja: 'ビデオ設定', ko: '비디오 설정', en: 'Video Settings' },
    translationSettings: { ja: 'Uri-Tomo AI翻訳設定', ko: 'Uri-Tomo AI 번역 설정', en: 'Uri-Tomo AI Translation' },
    generalSettings: { ja: '一般設定', ko: '일반 설정', en: 'General Settings' },
    microphone: { ja: 'マイク', ko: '마이크', en: 'Microphone' },
    speaker: { ja: 'スピーカー', ko: '스피커', en: 'Speaker' },
    camera: { ja: 'カメラ', ko: '카메라', en: 'Camera' },
    resolution: { ja: '解像度', ko: '해상도', en: 'Resolution' },
    noiseCancellation: { ja: 'ノイズキャンセル', ko: '노이즈 제거', en: 'Noise Cancellation' },
    beautyFilter: { ja: 'ビューティーフィルター', ko: '뷰티 필터', en: 'Beauty Filter' },
    realtimeTranslation: { ja: 'リアルタイム翻訳', ko: '실시간 번역', en: 'Realtime Translation' },
    termDescription: { ja: '用語解説', ko: '용어 설명', en: 'Term Description' },
    translationPair: { ja: '翻訳言語ペア', ko: '번역 언어 쌍', en: 'Translation Pair' },
    autoRecord: { ja: '会議の自動録画', ko: '회의 자동 녹화', en: 'Auto Record Meeting' },
    notificationSound: { ja: '通知音', ko: '알림음', en: 'Notification Sound' },
    clickToChange: { ja: 'クリックして変更', ko: '클릭하여 변경', en: 'Click to change' },
    chooseEmoji: { ja: '絵文字を選択', ko: '이모지 선택', en: 'Choose Emoji' },
    selectFromEmojis: { ja: '絵文字から選択します', ko: '이모지에서 선택합니다', en: 'Select from emojis' },
    uploadImage: { ja: '画像をアップロード', ko: '이미지 업로드', en: 'Upload Image' },
    uploadYourPhoto: { ja: '写真をアップロードします', ko: '사진을 업로드합니다', en: 'Upload your photo' },
    removeAvatar: { ja: 'アバターを削除', ko: '아바타 제거', en: 'Remove Avatar' },
    useDefaultIcon: { ja: 'デフォルトアイコンを使用', ko: '기본 아이콘 사용', en: 'Use default icon' },
    selectEmoji: { ja: '絵文字を選択', ko: '이모지 선택', en: 'Select Emoji' },
    joinedRooms: { ja: '参加したルーム', ko: '참가한 방', en: 'Joined Rooms' },
    noRooms: { ja: 'ルームがありません', ko: '참가한 방이 없습니다', en: 'No rooms joined' },
    join: { ja: '参加', ko: '참가', en: 'Join' },
  };
  return translations[key]?.[lang] || key;
};

interface Room {
  id: string;
  name: string;
  icon?: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'offline';
  nickname?: string;
}

export function Home() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [userName, setUserName] = useState('ユーザー');
  const [userEmail, setUserEmail] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [avatarType, setAvatarType] = useState<'emoji' | 'image' | 'none'>('none');
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showSystemSettings, setShowSystemSettings] = useState(false);
  const [editedUserName, setEditedUserName] = useState('');
  const [editedUserEmail, setEditedUserEmail] = useState('');
  const [editedUserAvatar, setEditedUserAvatar] = useState('');
  const [editedAvatarType, setEditedAvatarType] = useState<'emoji' | 'image' | 'none'>('none');
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactLanguage, setNewContactLanguage] = useState<'ja' | 'ko' | 'en'>('ja');
  const [systemLanguage, setSystemLanguage] = useState<'ja' | 'ko' | 'en'>('ja');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [showNicknameDialog, setShowNicknameDialog] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [editedNickname, setEditedNickname] = useState('');
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMainData = async () => {
      try {
        setIsLoading(true);
        const data: MainDataResponse = await userApi.getMainData();

        // 1. Update User Info
        setUserName(data.user.display_name);
        setUserEmail(data.user.email);

        // 2. Update Rooms
        const mappedRooms: Room[] = data.rooms.map(room => ({
          id: room.id,
          name: room.name
        }));
        setRooms(mappedRooms);

        // 3. Update Contacts (Friends)
        const mappedContacts: Contact[] = data.user_friends.map(friend => ({
          id: friend.id,
          name: friend.friend_name,
          email: friend.email,
          status: 'online', // Default to online or handle based on real status if available
        }));
        setContacts(mappedContacts);

        // Update localStorage as a fallback/cache if needed
        localStorage.setItem('uri-tomo-user', data.user.email);
        const existingProfile = JSON.parse(localStorage.getItem('uri-tomo-user-profile') || '{}');
        localStorage.setItem('uri-tomo-user-profile', JSON.stringify({
          ...existingProfile,
          name: data.user.display_name,
          email: data.user.email,
        }));
        localStorage.setItem('uri-tomo-rooms', JSON.stringify(mappedRooms));
        localStorage.setItem('uri-tomo-contacts', JSON.stringify(mappedContacts));

        // Dispatch events for other components to update
        window.dispatchEvent(new Event('profile-updated'));
        window.dispatchEvent(new Event('rooms-updated'));
        window.dispatchEvent(new Event('contacts-updated'));

      } catch (error) {
        console.error('Failed to fetch main data:', error);
        toast.error('데이터를 불러오는데 실패했습니다.');

        // Fallback to localStorage on error
        const savedRooms = JSON.parse(localStorage.getItem('uri-tomo-rooms') || '[]');
        if (savedRooms.length > 0) setRooms(savedRooms);

        const savedContacts = JSON.parse(localStorage.getItem('uri-tomo-contacts') || '[]');
        if (savedContacts.length > 0) setContacts(savedContacts);

        const savedUser = localStorage.getItem('uri-tomo-user');
        if (savedUser) {
          setUserEmail(savedUser);
          setUserName(savedUser.split('@')[0]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchMainData();

    // Load system language
    const savedLanguage = localStorage.getItem('uri-tomo-language') as 'ja' | 'ko' | 'en' | null;
    if (savedLanguage) {
      setSystemLanguage(savedLanguage);
    }
  }, []);

  // Listen for profile/settings events from Layout and profile updates
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

  const handleCreateRoom = () => {
    if (!newRoomName.trim()) return;

    const newRoom: Room = {
      id: Date.now().toString(),
      name: newRoomName,
    };

    const updatedRooms = [...rooms, newRoom];
    setRooms(updatedRooms);
    localStorage.setItem('uri-tomo-rooms', JSON.stringify(updatedRooms));

    setIsRoomDialogOpen(false);
    setNewRoomName('');
  };

  const handleJoinRoom = (roomId: string) => {
    navigate(`/meeting/${roomId}`);
  };

  const handleStartChat = (contactId: string) => {
    // Navigate to chat page
    navigate(`/chat/${contactId}`);
  };

  const handleGMClick = () => {
    navigate('/meeting/gm');
  };

  const handleAddContact = async () => {
    if (!newContactEmail.trim()) {
      toast.error('メールアドレスを入力してください');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newContactEmail)) {
      toast.error('有効なメールアドレスを入力してくさい');
      return;
    }

    setIsCheckingEmail(true);

    // In real app, this would be an actual API call like userApi.addContact(newContactEmail)
    toast.info('友達追加機能は現在バックエンドの実装を待機中です。', {
      description: '将来的には、このメールアドレスにリクエストが送信されます。',
      duration: 4000,
    });

    setShowAddContact(false);
    setNewContactEmail('');
    setIsCheckingEmail(false);
  };

  const handleEditNickname = (contact: Contact) => {
    setSelectedContact(contact);
    setEditedNickname(contact.nickname || '');
    setShowNicknameDialog(true);
  };

  const handleSaveNickname = () => {
    if (selectedContact) {
      const updatedContacts = contacts.map(contact =>
        contact.id === selectedContact.id ? { ...contact, nickname: editedNickname } : contact
      );
      setContacts(updatedContacts);
      localStorage.setItem('uri-tomo-contacts', JSON.stringify(updatedContacts));
      setShowNicknameDialog(false);
      toast.success('ニックネームを設定しました', {
        description: `${selectedContact.name} のニックネームを設定しました。`,
        duration: 3000,
      });
    }
  };

  const handleDeleteContact = (contact: Contact) => {
    const updatedContacts = contacts.filter(c => c.id !== contact.id);
    setContacts(updatedContacts);
    localStorage.setItem('uri-tomo-contacts', JSON.stringify(updatedContacts));
    toast.success('連絡先を削除しました', {
      description: `${contact.name} を連絡先から削除しました。`,
      duration: 3000,
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 overflow-hidden flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-gray-700" />
          <h3 className="font-bold text-gray-900 text-lg uppercase tracking-tight">{t(systemLanguage, 'contacts')}</h3>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{contacts.length}</span>
        </div>
        <button
          onClick={() => setShowAddContact(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          <UserPlus className="h-5 w-5" />
          <span>{t(systemLanguage, 'add')}</span>
        </button>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-3">
          {contacts.map((contact, index) => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="p-4 bg-white border border-gray-100 rounded-xl hover:border-yellow-200 hover:shadow-lg transition-all cursor-pointer group flex items-center gap-4"
              onClick={() => handleStartChat(contact.id)}
            >
              {/* User Icon */}
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <User className="h-6 w-6 text-yellow-600" />
              </div>

              {/* Name and Email */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 text-base truncate">
                    {contact.name}
                  </p>
                  {contact.nickname && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                      {contact.nickname}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{contact.email}</p>
              </div>

              <div className="flex items-center gap-2">
                {/* Message Icon */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartChat(contact.id);
                  }}
                  className="p-2.5 bg-gray-50 hover:bg-green-50 text-gray-400 hover:text-green-500 rounded-xl transition-all"
                >
                  <MessageCircle className="h-5 w-5" />
                </button>

                {/* More Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-xl transition-all"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditNickname(contact);
                      }}
                    >
                      <Edit3 className="mr-2 h-4 w-4" />
                      {t(systemLanguage, 'edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setContactToDelete(contact);
                        setShowDeleteAlert(true);
                      }}
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t(systemLanguage, 'delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">{t(systemLanguage, 'addFriend')}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <Label htmlFor="contact-email" className="text-base font-semibold text-gray-900">
                  {t(systemLanguage, 'email')}
                </Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={newContactEmail}
                  onChange={(e) => setNewContactEmail(e.target.value)}
                  placeholder="friend@example.com"
                  className="mt-2"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <Button
                onClick={() => {
                  setShowAddContact(false);
                  setNewContactEmail('');
                }}
                variant="outline"
                className="flex-1"
                disabled={isCheckingEmail}
              >
                {t(systemLanguage, 'cancel')}
              </Button>
              <Button
                onClick={handleAddContact}
                className="flex-1 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 text-white"
                disabled={isCheckingEmail}
              >
                {isCheckingEmail ? '確認中...' : '追加'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Nickname Edit Modal */}
      {showNicknameDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">{t(systemLanguage, 'editNickname')}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <Label className="text-base font-semibold text-gray-900">
                  {t(systemLanguage, 'contactName')}
                </Label>
                <div className="mt-2 px-4 py-2 bg-gray-100 rounded-lg text-gray-600">
                  {selectedContact?.name}
                </div>
              </div>
              <div>
                <Label htmlFor="nickname" className="text-base font-semibold text-gray-900">
                  {t(systemLanguage, 'nickname')}
                </Label>
                <Input
                  id="nickname"
                  value={editedNickname}
                  onChange={(e) => setEditedNickname(e.target.value)}
                  placeholder="ニックネームを入力"
                  className="mt-2"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <Button
                onClick={() => setShowNicknameDialog(false)}
                variant="outline"
                className="flex-1"
              >
                {t(systemLanguage, 'cancel')}
              </Button>
              <Button
                onClick={handleSaveNickname}
                className="flex-1 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 text-white"
              >
                {t(systemLanguage, 'save')}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Alert */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t(systemLanguage, 'deleteContact')}</AlertDialogTitle>
            <AlertDialogDescription>
              {contactToDelete?.name} {t(systemLanguage, 'deleteContactDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t(systemLanguage, 'cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (contactToDelete) {
                  handleDeleteContact(contactToDelete);
                }
                setShowDeleteAlert(false);
                setContactToDelete(null);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              {t(systemLanguage, 'delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
    </main>
  );
}