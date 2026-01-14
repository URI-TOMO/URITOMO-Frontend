import { Mic, MicOff, Video, VideoOff, Hand, MoreVertical, X, Bot, Sparkles, Users } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';

interface Participant {
  id: string;
  name: string;
  isVideoOn: boolean;
  isMuted: boolean;
  isHandRaised?: boolean;
  isHost?: boolean;
  isAI?: boolean;
  aiType?: 'assistant' | 'transcriber' | 'analyst';
  isUriTomo?: boolean;
}

interface ParticipantsListProps {
  participants: Participant[];
  onClose: () => void;
}

export function ParticipantsList({ participants, onClose }: ParticipantsListProps) {
  const hostParticipants = participants.filter((p) => p.isHost);
  const uriTomoParticipants = participants.filter((p) => p.isUriTomo);
  const aiParticipants = participants.filter((p) => p.isAI && !p.isUriTomo);
  const regularParticipants = participants.filter((p) => !p.isHost && !p.isAI && !p.isUriTomo);

  const ParticipantItem = ({ participant }: { participant: Participant }) => {
    const initials = participant.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    return (
      <div className={`flex items-center gap-2.5 px-4 py-2.5 ${
        participant.isUriTomo ? 'bg-gradient-to-r from-orange-50 to-yellow-50' : 'hover:bg-gray-50'
      }`}>
        <Avatar className={`h-8 w-8 ${
          participant.isUriTomo 
            ? 'bg-gradient-to-br from-orange-400 to-yellow-400' 
            : participant.isAI 
              ? 'bg-yellow-400' 
              : 'bg-gray-200'
        }`}>
          <AvatarFallback className={`text-xs ${
            participant.isUriTomo || participant.isAI ? 'bg-transparent text-white' : 'bg-transparent text-gray-700'
          }`}>
            {participant.isUriTomo || participant.isAI ? <Bot className="h-4 w-4" /> : initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-gray-900 truncate">{participant.name}</span>
            {participant.isHost && (
              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                Host
              </span>
            )}
            {participant.isUriTomo && (
              <span className="text-xs bg-gradient-to-r from-orange-400 to-yellow-400 text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                <Sparkles className="h-2.5 w-2.5" />
                Uri-Tomo
              </span>
            )}
            {participant.isAI && !participant.isUriTomo && (
              <span className="text-xs bg-yellow-400 text-gray-900 px-1.5 py-0.5 rounded font-semibold">
                AI
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {!participant.isUriTomo && (
            <>
              {participant.isHandRaised && (
                <Hand className="h-4 w-4 text-yellow-500" />
              )}
              {participant.isMuted ? (
                <MicOff className="h-4 w-4 text-red-500" />
              ) : (
                <Mic className="h-4 w-4 text-green-500" />
              )}
              {!participant.isVideoOn && (
                <VideoOff className="h-4 w-4 text-gray-400" />
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-white flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 text-sm">参加者 ({participants.length})</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-gray-100 rounded">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 overflow-auto">
        <div className="pb-2">
          {hostParticipants.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-1.5 text-xs text-gray-600 font-semibold">
                ホスト
              </div>
              {hostParticipants.map((participant) => (
                <ParticipantItem key={participant.id} participant={participant} />
              ))}
            </div>
          )}

          {uriTomoParticipants.length > 0 && (
            <div className="py-2 border-t border-gray-200">
              <div className="px-4 py-1.5 text-xs text-gray-600 font-semibold flex items-center gap-1">
                Uri-Tomo ({uriTomoParticipants.length})
              </div>
              {uriTomoParticipants.map((participant) => (
                <ParticipantItem key={participant.id} participant={participant} />
              ))}
            </div>
          )}

          {aiParticipants.length > 0 && (
            <div className="py-2 border-t border-gray-200">
              <div className="px-4 py-1.5 text-xs text-gray-600 font-semibold flex items-center gap-1">
                AIアシスタント ({aiParticipants.length})
              </div>
              {aiParticipants.map((participant) => (
                <ParticipantItem key={participant.id} participant={participant} />
              ))}
            </div>
          )}

          {regularParticipants.length > 0 && (
            <div className="py-2 border-t border-gray-200">
              <div className="px-4 py-1.5 text-xs text-gray-600 font-semibold">
                参加者 ({regularParticipants.length})
              </div>
              {regularParticipants.map((participant) => (
                <ParticipantItem key={participant.id} participant={participant} />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}