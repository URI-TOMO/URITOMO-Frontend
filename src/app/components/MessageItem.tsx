import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Avatar, AvatarFallback } from './ui/avatar';
import type { Message } from './types';

interface MessageItemProps {
  message: Message;
  isOwnMessage: boolean;
}

export function MessageItem({ message, isOwnMessage }: MessageItemProps) {
  const timeAgo = formatDistanceToNow(new Date(message.timestamp), {
    addSuffix: true,
    locale: ja,
  });

  return (
    <div className="flex gap-3 hover:bg-gray-50 px-3 py-2 -mx-3 rounded">
      <Avatar className="h-10 w-10">
        <AvatarFallback>
          {message.userName.substring(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-semibold text-sm">{message.userName}</span>
          <span className="text-xs text-gray-500">{timeAgo}</span>
        </div>
        <div className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </div>
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-2 p-2 bg-gray-100 rounded border"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{attachment.name}</p>
                  <p className="text-xs text-gray-500">
                    {(attachment.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex gap-1 mt-2">
            {message.reactions.map((reaction, index) => (
              <button
                key={index}
                className="flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
              >
                <span>{reaction.emoji}</span>
                <span className="text-xs">{reaction.users.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
