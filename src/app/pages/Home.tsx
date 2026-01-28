import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Edit3, Trash2, MessageCircle, MoreVertical, User, Bot, Settings, Plus, LogOut, Mic, Video, Monitor, Languages, Image as ImageIcon, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { ProfileSettingsModal, SystemSettingsModal } from '../components/SettingsModals';
import { userApi } from '../api/user';
import { MainDataResponse } from '../api/types';
import { useTranslation } from '../hooks/useTranslation';

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
  const { t, setSystemLanguage } = useTranslation();
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

        if (data.user.lang && ['ja', 'ko', 'en'].includes(data.user.lang)) {
          setSystemLanguage(data.user.lang as 'ja' | 'ko' | 'en');
        }

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

        // 4. Fetch detailed profile (for avatar)
        try {
          const profile = await userApi.getProfile();
          if (profile) {
            setUserName(profile.display_name || data.user.display_name);
            setUserEmail(profile.email || data.user.email);

            if (profile.picture) {
              setUserAvatar(profile.picture);
              // Simple heuristic for avatar type
              if (profile.picture.startsWith('http') || profile.picture.startsWith('/')) {
                setAvatarType('image');
              } else {
                setAvatarType('emoji');
              }
            } else {
              setAvatarType('none');
            }
          }
        } catch (e) {
          console.warn('Failed to fetch detailed profile, using main data');
        }

        // Update localStorage as a fallback/cache if needed
        localStorage.setItem('uri-tomo-user', data.user.email);
        const existingProfile = JSON.parse(localStorage.getItem('uri-tomo-user-profile') || '{}');
        localStorage.setItem('uri-tomo-user-profile', JSON.stringify({
          ...existingProfile,
          name: data.user.display_name,
          email: data.user.email,
          // update avatar if we got it? 
        }));
        localStorage.setItem('uri-tomo-rooms', JSON.stringify(mappedRooms));
        localStorage.setItem('uri-tomo-contacts', JSON.stringify(mappedContacts));

        // Dispatch events for other components to update
        window.dispatchEvent(new Event('profile-updated'));
        window.dispatchEvent(new Event('rooms-updated'));
        window.dispatchEvent(new Event('contacts-updated'));

      } catch (error) {
        console.error('Failed to fetch main data:', error);
        toast.error(t('dataLoadError'));

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
      toast.error(t('enterEmail'));
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newContactEmail)) {
      toast.error(t('validEmail'));
      return;
    }

    setIsCheckingEmail(true);

    try {
      // Call backend API to add friend
      const friendData = await userApi.addFriend(newContactEmail);

      // Create new contact from response
      const newContact: Contact = {
        id: Date.now().toString(), // Generate temporary ID
        name: friendData.name,
        email: friendData.email,
        status: 'online',
      };

      // Update contacts list in state - this will trigger UI update
      const updatedContacts = [...contacts, newContact];
      setContacts(updatedContacts);

      // Update localStorage
      localStorage.setItem('uri-tomo-contacts', JSON.stringify(updatedContacts));

      // Dispatch event for other components
      window.dispatchEvent(new Event('contacts-updated'));

      // Show success message
      toast.success(t('friendAdded'), {
        description: `${friendData.name} (${friendData.email})`,
        duration: 4000,
      });

      // Close modal and reset
      setShowAddContact(false);
      setNewContactEmail('');

    } catch (error: any) {
      console.error('Failed to add friend:', error);

      // Check if the error is because email doesn't exist
      if (error.response?.status === 404) {
        toast.error(t('emailNotFound'));
      } else {
        toast.error(t('friendAddFailed'));
      }
    } finally {
      setIsCheckingEmail(false);
    }
  };


  const handleEditNickname = (contact: Contact) => {
    setSelectedContact(contact);
    setEditedNickname(contact.nickname || '');
    setShowNicknameDialog(true);
  };

  const handleSaveNickname = async () => {
    if (selectedContact) {
      if (!editedNickname.trim()) {
        toast.error(t('enterNickname') || 'Nickname cannot be empty');
        return;
      }

      try {
        // Call API
        const response = await userApi.updateFriendNickname(selectedContact.id, editedNickname);

        // Update local state
        const updatedContacts = contacts.map(contact =>
          contact.id === selectedContact.id ? { ...contact, nickname: response.nickname } : contact
        );
        setContacts(updatedContacts);
        localStorage.setItem('uri-tomo-contacts', JSON.stringify(updatedContacts));

        setShowNicknameDialog(false);
        toast.success(t('nicknameSet'), {
          description: `${selectedContact.name} -> ${response.nickname}`,
          duration: 3000,
        });
      } catch (error) {
        console.error('Failed to update nickname:', error);
        toast.error(t('updateNicknameFailed') || 'Failed to update nickname');
      }
    }
  };

  const handleDeleteContact = async (contact: Contact) => {
    try {
      // Call API
      await userApi.deleteFriend(contact.id);

      // Update local state
      const updatedContacts = contacts.filter(c => c.id !== contact.id);
      setContacts(updatedContacts);
      localStorage.setItem('uri-tomo-contacts', JSON.stringify(updatedContacts));

      toast.success(t('contactDeleted'), {
        description: `${contact.name} ${t('deleteContactDesc')}`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to delete contact:', error);
      toast.error(t('deleteContactFailed') || 'Failed to delete contact');
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">{t('loadingData')}</p>
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
          <h3 className="font-bold text-gray-900 text-lg uppercase tracking-tight">{t('contacts')}</h3>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{contacts.length}</span>
        </div>
        <button
          onClick={() => setShowAddContact(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          <UserPlus className="h-5 w-5" />
          <span>{t('add')}</span>
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
                      {t('edit')}
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
                      {t('delete')}
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
              <h2 className="text-2xl font-bold text-gray-900">{t('addFriend')}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <Label htmlFor="contact-email" className="text-base font-semibold text-gray-900">
                  {t('email')}
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
                {t('cancel')}
              </Button>
              <Button
                onClick={handleAddContact}
                className="flex-1 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 text-white"
                disabled={isCheckingEmail}
              >
                {isCheckingEmail ? t('checking') : t('add')}
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
              <h2 className="text-2xl font-bold text-gray-900">{t('editNickname')}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <Label className="text-base font-semibold text-gray-900">
                  {t('contactName')}
                </Label>
                <div className="mt-2 px-4 py-2 bg-gray-100 rounded-lg text-gray-600">
                  {selectedContact?.name}
                </div>
              </div>
              <div>
                <Label htmlFor="nickname" className="text-base font-semibold text-gray-900">
                  {t('nickname')}
                </Label>
                <Input
                  id="nickname"
                  value={editedNickname}
                  onChange={(e) => setEditedNickname(e.target.value)}
                  placeholder={t('enterNickname')}
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
                {t('cancel')}
              </Button>
              <Button
                onClick={handleSaveNickname}
                className="flex-1 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 text-white"
              >
                {t('save')}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Alert */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteContact')}</AlertDialogTitle>
            <AlertDialogDescription>
              {contactToDelete?.name} {t('deleteContactDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
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
              {t('delete')}
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
        onNameChange={setEditedUserName}
        onAvatarChange={setEditedUserAvatar}
        onAvatarTypeChange={setEditedAvatarType}

        onSave={async () => {
          try {
            let currentAvatar = editedUserAvatar;

            // 1. Prepare Payload
            const updatePayload: any = {
              display_name: editedUserName,
            };

            // Handle Avatar Logic for PATCH
            if (editedAvatarType === 'emoji') {
              updatePayload.picture = editedUserAvatar;
            } else if (editedAvatarType === 'none') {
              updatePayload.picture = '';
            }

            const updatedProfile = await userApi.updateProfile(updatePayload);

            // Use returned profile or local state
            setUserName(updatedProfile.display_name);
            // If backend returned picture, use it, else use evaluated one
            if (updatedProfile.picture) setUserAvatar(updatedProfile.picture);
            else setUserAvatar(currentAvatar);

            setAvatarType(editedAvatarType);

            const profile = {
              name: editedUserName,
              email: userEmail,
              avatar: currentAvatar,
              avatarType: editedAvatarType,
            };
            localStorage.setItem('uri-tomo-user-profile', JSON.stringify(profile));
            window.dispatchEvent(new Event('profile-updated'));
            toast.success(t('profileUpdated'));
            setShowProfileSettings(false);
          } catch (error) {
            console.error('Profile update failed:', error);
            toast.error(t('updateProfileFailed'));
          }
        }}
      />

      {/* System Settings Modal */}
      <SystemSettingsModal
        isOpen={showSystemSettings}
        onClose={() => setShowSystemSettings(false)}
      />
    </main>
  );
}