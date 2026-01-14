import { Search, UserPlus } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import type { TeamMember } from './types';

interface MembersPanelProps {
  members: TeamMember[];
}

export function MembersPanel({ members }: MembersPanelProps) {
  const getStatusColor = (status: TeamMember['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'busy':
        return 'bg-red-500';
      case 'offline':
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status: TeamMember['status']) => {
    switch (status) {
      case 'online':
        return 'オンライン';
      case 'away':
        return '退席中';
      case 'busy':
        return '取り込み中';
      case 'offline':
        return 'オフライン';
    }
  };

  const onlineMembers = members.filter(m => m.status === 'online');
  const awayMembers = members.filter(m => m.status === 'away');
  const busyMembers = members.filter(m => m.status === 'busy');
  const offlineMembers = members.filter(m => m.status === 'offline');

  const MemberItem = ({ member }: { member: TeamMember }) => (
    <div className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded cursor-pointer">
      <div className="relative">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">
            {member.name.substring(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(
            member.status
          )}`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{member.name}</p>
      </div>
    </div>
  );

  const MemberSection = ({ title, members }: { title: string; members: TeamMember[] }) => {
    if (members.length === 0) return null;
    return (
      <div className="mb-4">
        <div className="px-3 py-1 text-xs text-gray-500 uppercase">
          {title} ({members.length})
        </div>
        <div className="space-y-0.5">
          {members.map((member) => (
            <MemberItem key={member.id} member={member} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-64 bg-gray-50 border-l flex flex-col h-full">
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">メンバー ({members.length})</h3>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <UserPlus className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="メンバーを検索" className="pl-9" />
        </div>
      </div>

      <ScrollArea className="flex-1 p-2">
        <MemberSection title="オンライン" members={onlineMembers} />
        <MemberSection title="退席中" members={awayMembers} />
        <MemberSection title="取り込み中" members={busyMembers} />
        <MemberSection title="オフライン" members={offlineMembers} />
      </ScrollArea>
    </div>
  );
}
