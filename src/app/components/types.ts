export interface Message {
  id: string;
  channelId: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
  reactions?: Reaction[];
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
}

export interface Reaction {
  emoji: string;
  users: string[];
}

export interface Channel {
  id: string;
  teamId: string;
  name: string;
  description?: string;
  unreadCount: number;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  channels: Channel[];
  members: TeamMember[];
}

export interface TeamMember {
  id: string;
  name: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  avatar?: string;
}
