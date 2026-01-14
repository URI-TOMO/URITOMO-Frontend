import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Video, Phone } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { MessageItem } from './MessageItem';
import type { Message, Channel, Team } from './types';

interface ChatAreaProps {
  channel: Channel | null;
  team: Team | null;
  messages: Message[];
  currentUser: string;
  onSendMessage: (content: string, attachments?: File[]) => void;
}

export function ChatArea({ channel, team, messages, currentUser, onSendMessage }: ChatAreaProps) {
  const [messageInput, setMessageInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (messageInput.trim()) {
      onSendMessage(messageInput.trim());
      setMessageInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  if (!channel || !team) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h3 className="text-xl mb-2">チャンネルを選択してください</h3>
          <p className="text-gray-500">左側からチャンネルを選んで会話を始めましょう</p>
        </div>
      </div>
    );
  }

  const channelMessages = messages.filter(m => m.channelId === channel.id);

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="h-16 border-b px-6 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">#{channel.name}</h2>
          <p className="text-sm text-gray-500">{channel.description || `${team.name}のチャンネル`}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Phone className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
        <div className="space-y-4">
          {channelMessages.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="text-lg mb-2">#{channel.name} へようこそ！</h3>
              <p className="text-gray-500">最初のメッセージを送信して会話を始めましょう</p>
            </div>
          ) : (
            channelMessages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                isOwnMessage={message.userName === currentUser}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t p-4">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`#${channel.name} にメッセージを送信`}
              className="pr-20"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleFileAttach}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Smile className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button onClick={handleSend} disabled={!messageInput.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          onChange={(e) => {
            // Handle file upload
            console.log('Files:', e.target.files);
          }}
        />
      </div>
    </div>
  );
}
