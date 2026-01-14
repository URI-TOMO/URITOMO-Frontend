import { Mic, MicOff, Pin, Bot, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';

interface Participant {
  id: string;
  name: string;
  isVideoOn: boolean;
  isMuted: boolean;
  isSpeaking?: boolean;
  isPinned?: boolean;
  isAI?: boolean;
  aiType?: 'assistant' | 'transcriber' | 'analyst';
  language?: 'ja' | 'ko';
  isUriTomo?: boolean;
}

interface VideoTileProps {
  participant: Participant;
  isLarge?: boolean;
  onPin?: (id: string) => void;
  language?: 'ja' | 'ko';
}

export function VideoTile({ participant, isLarge = false, onPin, language }: VideoTileProps) {
  const initials = participant.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const getAIGradient = () => {
    switch (participant.aiType) {
      case 'assistant':
        return 'from-yellow-300 to-yellow-400';
      case 'transcriber':
        return 'from-yellow-400 to-amber-400';
      case 'analyst':
        return 'from-amber-400 to-orange-400';
      default:
        return 'from-yellow-300 to-yellow-400';
    }
  };

  return (
    <div
      className={`relative bg-gray-800 rounded-lg overflow-hidden group h-full w-full transition-all duration-200 ${
        participant.isSpeaking ? 'ring-2 ring-green-500' : 'ring-1 ring-gray-700'
      } ${participant.isUriTomo ? 'ring-4 ring-yellow-400' : ''}`}
    >
      {participant.isVideoOn ? (
        <div className={`absolute inset-0 flex items-center justify-center ${
          participant.isUriTomo 
            ? 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-400' 
            : 'bg-gradient-to-br from-gray-700 to-gray-800'
        }`}>
          {participant.isUriTomo ? (
            <div className="flex flex-col items-center gap-3">
              <div className="bg-white p-6 rounded-full shadow-2xl">
                <Bot className="h-16 w-16 text-yellow-500" />
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-white animate-pulse" />
                <span className="text-white font-bold text-lg">AI Assistant</span>
                <Sparkles className="h-5 w-5 text-white animate-pulse" />
              </div>
            </div>
          ) : (
            <span className="text-gray-400 text-xs">
              Video Stream
            </span>
          )}
        </div>
      ) : (
        <div className={`absolute inset-0 flex items-center justify-center ${
          participant.isUriTomo 
            ? 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-400' 
            : participant.isAI 
              ? 'bg-gradient-to-br from-yellow-400 to-amber-500' 
              : 'bg-gray-800'
        }`}>
          <Avatar className={`${isLarge ? 'h-24 w-24' : 'h-16 w-16'}`}>
            <AvatarFallback className={`${isLarge ? 'text-3xl' : 'text-xl'} ${
              participant.isUriTomo || participant.isAI ? 'bg-transparent text-white' : 'bg-gray-700 text-white'
            }`}>
              {participant.isUriTomo || participant.isAI ? <Bot className={`${isLarge ? 'h-12 w-12' : 'h-8 w-8'}`} /> : initials}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Uri-Tomo Badge */}
      {participant.isUriTomo && (
        <div className="absolute top-2 left-2 bg-white text-yellow-600 px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 font-bold shadow-lg">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          Uri-Tomo
        </div>
      )}

      {/* AI Badge */}
      {participant.isAI && !participant.isUriTomo && (
        <div className="absolute top-2 left-2 bg-yellow-400 text-gray-900 px-2 py-1 rounded text-xs flex items-center gap-1 font-semibold">
          <Sparkles className="h-3 w-3" />
          AI
        </div>
      )}

      {/* Participant Name */}
      <div className={`absolute bottom-2 left-2 ${
        participant.isUriTomo
          ? 'bg-white text-yellow-600'
          : participant.isAI 
            ? 'bg-yellow-400 text-gray-900' 
            : 'bg-gray-900/80 text-white'
      } px-2 py-1 rounded text-xs flex items-center gap-1.5 font-semibold`}>
        <span>{participant.name}</span>
        {!participant.isUriTomo && (
          participant.isMuted ? (
            <MicOff className="h-3 w-3 text-red-400" />
          ) : (
            <Mic className={`h-3 w-3 ${participant.isSpeaking ? 'text-green-400' : 'text-gray-400'}`} />
          )
        )}
      </div>

      {/* Pin Button */}
      {onPin && !participant.isUriTomo && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 bg-gray-900/80 hover:bg-gray-900 text-white rounded"
            onClick={() => onPin(participant.id)}
          >
            <Pin className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {participant.isPinned && (
        <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-semibold">
          Pinned
        </div>
      )}
    </div>
  );
}