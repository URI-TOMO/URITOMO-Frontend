import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  Hand, 
  Phone,
  MessageSquare,
  Users,
  Languages,
  Circle
} from 'lucide-react';
import { Button } from './ui/button';

interface MeetingControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isHandRaised: boolean;
  isScreenSharing: boolean;
  isRecording?: boolean;
  showUriTomo: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleHand: () => void;
  onToggleScreenShare: () => void;
  onToggleRecording?: () => void;
  onLeaveMeeting: () => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onToggleUriTomo: () => void;
  hasUnreadMessages: boolean;
}

export function MeetingControls({
  isMuted,
  isVideoOff,
  isScreenSharing,
  isHandRaised,
  isRecording,
  showUriTomo,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onToggleHand,
  onToggleRecording,
  onLeaveMeeting,
  onToggleChat,
  onToggleParticipants,
  onToggleUriTomo,
  hasUnreadMessages,
}: MeetingControlsProps) {
  return (
    <div className="bg-gray-800 border-t border-gray-700 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-white text-sm font-medium">
          {new Date().toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={onToggleMute}
          className={`rounded-full h-12 w-12 transition-all ${
            isMuted
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
        >
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>

        <Button
          onClick={onToggleVideo}
          className={`rounded-full h-12 w-12 transition-all ${
            isVideoOff
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
        >
          {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
        </Button>

        <Button
          onClick={onToggleScreenShare}
          className={`rounded-full h-12 w-12 transition-all ${
            isScreenSharing
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
        >
          <Monitor className="h-5 w-5" />
        </Button>

        <Button
          onClick={onToggleHand}
          className={`rounded-full h-12 w-12 transition-all ${
            isHandRaised
              ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
        >
          <Hand className="h-5 w-5" />
        </Button>

        {isRecording !== undefined && (
          <Button
            onClick={onToggleRecording}
            className={`rounded-full h-12 w-12 transition-all ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            <Circle className="h-5 w-5" />
          </Button>
        )}

        <div className="w-px h-8 bg-gray-600 mx-1"></div>

        <Button
          onClick={onToggleChat}
          variant="ghost"
          className="rounded-full h-12 w-12 bg-gray-700 hover:bg-gray-600 text-white relative"
        >
          <MessageSquare className="h-5 w-5" />
          {hasUnreadMessages && (
            <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full"></span>
          )}
        </Button>

        <Button
          onClick={onToggleParticipants}
          variant="ghost"
          className="rounded-full h-12 w-12 bg-gray-700 hover:bg-gray-600 text-white"
        >
          <Users className="h-5 w-5" />
        </Button>

        <Button
          onClick={onToggleUriTomo}
          variant="ghost"
          className={`rounded-full h-12 w-12 ${
            showUriTomo 
              ? 'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
        >
          <Languages className="h-5 w-5" />
        </Button>

        <div className="w-px h-8 bg-gray-600 mx-1"></div>

        <Button
          onClick={onLeaveMeeting}
          className="rounded-full px-6 h-12 bg-red-600 hover:bg-red-700 text-white font-semibold"
        >
          <Phone className="h-4 w-4 mr-2 rotate-[135deg]" />
          退出
        </Button>
      </div>

      <div className="w-20"></div>
    </div>
  );
}