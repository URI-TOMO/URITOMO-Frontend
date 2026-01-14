import { Hash, Plus, ChevronDown, Users, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import type { Team, Channel } from './types';

interface TeamsSidebarProps {
  teams: Team[];
  activeTeamId: string | null;
  activeChannelId: string | null;
  currentUser: string;
  onTeamSelect: (teamId: string) => void;
  onChannelSelect: (channelId: string) => void;
  onNewChannel: () => void;
}

export function TeamsSidebar({
  teams,
  activeTeamId,
  activeChannelId,
  currentUser,
  onTeamSelect,
  onChannelSelect,
  onNewChannel,
}: TeamsSidebarProps) {
  const activeTeam = teams.find(t => t.id === activeTeamId);

  return (
    <div className="w-64 bg-gray-100 border-r flex flex-col h-full">
      {/* Team Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">{activeTeam?.name || 'チームを選択'}</h2>
          <Button variant="ghost" size="icon">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {currentUser.substring(0, 2)}
            </AvatarFallback>
          </Avatar>
          <span>{currentUser}</span>
        </div>
      </div>

      {/* Channels List */}
      <ScrollArea className="flex-1">
        {activeTeam && (
          <div className="p-2">
            <div className="flex items-center justify-between px-2 py-1 mb-2">
              <span className="text-xs text-gray-500 uppercase">チャンネル</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={onNewChannel}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {activeTeam.channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => onChannelSelect(channel.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                  activeChannelId === channel.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'hover:bg-gray-200'
                }`}
              >
                <Hash className="h-4 w-4" />
                <span className="flex-1 text-left">{channel.name}</span>
                {channel.unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                    {channel.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Teams List */}
        <div className="p-2 border-t mt-2">
          <div className="px-2 py-1 mb-2">
            <span className="text-xs text-gray-500 uppercase">チーム</span>
          </div>
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => onTeamSelect(team.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                activeTeamId === team.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'hover:bg-gray-200'
              }`}
            >
              <Users className="h-4 w-4" />
              <span className="flex-1 text-left">{team.name}</span>
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Settings */}
      <div className="p-2 border-t">
        <Button variant="ghost" className="w-full justify-start" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          設定
        </Button>
      </div>
    </div>
  );
}
