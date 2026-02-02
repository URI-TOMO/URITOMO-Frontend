import { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';

interface ChatMessage {
  id: string;
  userName: string;
  message: string;
  timestamp: Date;
  isAI?: boolean;
  isUriTomo?: boolean;
}

interface MeetingChatProps {
  messages: ChatMessage[];
  currentUser: string;
  onSendMessage: (message: string) => void;
  onClose: () => void;
}

export function MeetingChat({ messages, currentUser, onSendMessage, onClose }: MeetingChatProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full bg-white flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 text-sm">チャット</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-gray-100 rounded">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 overflow-auto">
        <div className="p-4 space-y-3">
          {messages.map((msg) => {
            const initials = msg.userName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .substring(0, 2);

            return (
              <div key={msg.id} className={`flex gap-2 ${msg.isUriTomo ? 'bg-gradient-to-r from-orange-50 to-yellow-50 -mx-2 px-2 py-2 rounded-lg' : ''
                }`}>
                <Avatar className={`h-7 w-7 flex-shrink-0 ${msg.isUriTomo ? 'bg-gradient-to-br from-orange-400 to-yellow-400' : 'bg-gray-200'
                  }`}>
                  <AvatarFallback className={`text-xs ${msg.isUriTomo ? 'bg-transparent text-white' : 'bg-transparent text-gray-700'} overflow-hidden`}>
                    {msg.isUriTomo ? <img src="/uritomo.jpg" alt="AI" className="w-full h-full object-cover" /> : initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className={`text-xs font-semibold ${msg.isUriTomo ? 'text-orange-700' : 'text-gray-900'}`}>
                      {msg.userName}
                    </span>
                    {msg.isUriTomo && (
                      <span className="text-xs bg-gradient-to-r from-orange-400 to-yellow-400 text-white px-1.5 py-0.5 rounded font-semibold flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5" />
                        Uri-Tomo
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {msg.timestamp.toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 break-words">{msg.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-gray-200">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="メッセージを入力..."
            className="flex-1 text-sm"
          />
          <Button onClick={handleSend} disabled={!input.trim()} className="bg-blue-500 hover:bg-blue-600" size="sm">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}