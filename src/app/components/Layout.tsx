import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  onLogout: () => void;
}

export function Layout({ onLogout }: LayoutProps) {
  const [userName, setUserName] = useState('ユーザー');
  const [userEmail, setUserEmail] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [avatarType, setAvatarType] = useState<'emoji' | 'image' | 'none'>('none');
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showSystemSettings, setShowSystemSettings] = useState(false);

  // Listen for profile updates
  useEffect(() => {
    const loadProfile = () => {
      const savedUser = localStorage.getItem('uri-tomo-user');
      const savedProfile = localStorage.getItem('uri-tomo-user-profile');
      
      if (savedProfile) {
        try {
          const profile = JSON.parse(savedProfile);
          setUserName(profile.name || 'ユーザー');
          setUserEmail(profile.email || savedUser || '');
          setUserAvatar(profile.avatar || '');
          setAvatarType(profile.avatarType || 'none');
        } catch (e) {
          // Fallback to old format
          if (savedUser) {
            setUserEmail(savedUser);
            setUserName(savedUser.split('@')[0]);
          }
        }
      } else if (savedUser) {
        setUserEmail(savedUser);
        setUserName(savedUser.split('@')[0]);
      }
    };

    loadProfile();

    // Listen for storage changes (when profile is updated from other components)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'uri-tomo-user-profile' || e.key === 'uri-tomo-user') {
        loadProfile();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom event for same-window updates
    const handleProfileUpdate = () => {
      loadProfile();
    };

    window.addEventListener('profile-updated', handleProfileUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profile-updated', handleProfileUpdate);
    };
  }, []);

  const handleProfileClick = () => {
    // Dispatch event to open profile settings in the active page
    window.dispatchEvent(new CustomEvent('open-profile-settings'));
  };

  const handleSettingsClick = () => {
    // Dispatch event to open system settings in the active page
    window.dispatchEvent(new CustomEvent('open-system-settings'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 flex">
      {/* Fixed Sidebar */}
      <Sidebar
        userName={userName}
        userEmail={userEmail}
        userAvatar={userAvatar}
        avatarType={avatarType}
        onProfileClick={handleProfileClick}
        onSettingsClick={handleSettingsClick}
        onLogout={onLogout}
      />
      
      {/* Page Content */}
      <Outlet />
    </div>
  );
}
