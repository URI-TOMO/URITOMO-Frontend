import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, Plus, Settings, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface Room {
  id: string;
  name: string;
  icon?: string;
}

interface SidebarProps {
  onLogout: () => void;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  avatarType?: 'emoji' | 'image' | 'none';
  onProfileClick: () => void;
  onSettingsClick: () => void;
}

export function Sidebar({ onLogout, userName, userEmail, userAvatar, avatarType, onProfileClick, onSettingsClick }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  const loadRooms = () => {
    // Load rooms from localStorage
    const savedRooms = JSON.parse(localStorage.getItem('uri-tomo-rooms') || '[]');
    setRooms(savedRooms);
  };

  useEffect(() => {
    loadRooms();

    const handleRoomsUpdated = () => {
      loadRooms();
    };

    window.addEventListener('rooms-updated', handleRoomsUpdated);
    return () => {
      window.removeEventListener('rooms-updated', handleRoomsUpdated);
    };
  }, []);

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

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* User Section */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onProfileClick}
          className="w-full flex items-center gap-3 hover:bg-gray-50 rounded-lg p-2 transition-colors cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-400 flex items-center justify-center text-white font-bold text-xl overflow-hidden">
            {avatarType === 'image' && userAvatar ? (
              <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : avatarType === 'emoji' && userAvatar ? (
              <span className="text-2xl">{userAvatar}</span>
            ) : (
              <span>{userName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-gray-900 truncate">{userName}</p>
            <p className="text-xs text-gray-500 truncate">{userEmail}</p>
          </div>
        </button>
      </div>

      {/* General Menu */}
      <div className="p-4 border-b border-gray-200">
        <button
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-yellow-50 text-gray-700 transition-colors"
          onClick={() => navigate('/home')}
        >
          <Users className="h-5 w-5 text-yellow-600" />
          <span className="font-medium">Contact</span>
        </button>
      </div>

      {/* Rooms List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {rooms.map((room, index) => {
            // Extract first character properly (handles emojis and special characters)
            const firstChar = Array.from(room.name)[0] || room.name.charAt(0);

            return (
              <button
                key={room.id}
                onClick={() => handleJoinRoom(room.id)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-yellow-100 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-amber-300 flex items-center justify-center text-gray-800 font-bold group-hover:scale-110 transition-transform">
                  {firstChar}
                </div>
                <span className="font-medium text-gray-700">{room.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <button
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
          onClick={onSettingsClick}
        >
          <Settings className="h-5 w-5" />
          <span className="font-medium">設定</span>
        </button>

        <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
          <DialogTrigger asChild>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-yellow-100 text-yellow-700 transition-colors">
              <Plus className="h-5 w-5" />
              <span className="font-medium">ルーム追加</span>
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新しいルームを作成</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="roomName">ルーム名</Label>
                <Input
                  id="roomName"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="ルーム名 입력"
                  className="mt-2"
                />
              </div>
              <Button
                onClick={handleCreateRoom}
                className="w-full bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 text-white"
              >
                <Plus className="h-5 w-5 mr-2" />
                作成
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">ログ아웃</span>
        </button>
      </div>
    </aside>
  );
}