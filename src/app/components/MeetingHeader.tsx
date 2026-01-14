import { Clock, Maximize, Shield, Video } from 'lucide-react';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';

interface MeetingHeaderProps {
  meetingTitle: string;
  startTime: Date;
  isRecording?: boolean;
}

export function MeetingHeader({
  meetingTitle,
  startTime,
  isRecording,
}: MeetingHeaderProps) {
  const [duration, setDuration] = useState('00:00');

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - startTime.getTime();
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setDuration(
        `${minutes.toString().padStart(2, '0')}:${seconds
          .toString()
          .padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="bg-gradient-to-r from-orange-500 via-yellow-500 to-green-500 border-b border-orange-600 px-6 py-3 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-3">
        <div className="bg-white p-2 rounded-lg shadow-md">
          <Video className="h-5 w-5 text-orange-500" />
        </div>
        <div>
          <h1 className="text-white font-bold text-lg flex items-center gap-2">
            {meetingTitle}
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Uri-Tomo</span>
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-white/90 text-xs font-medium">{duration}</span>
            {isRecording && (
              <div className="flex items-center gap-1.5 bg-red-500/30 px-2 py-0.5 rounded-full border border-red-400">
                <div className="h-1.5 w-1.5 bg-red-300 rounded-full animate-pulse"></div>
                <span className="text-white text-xs font-semibold">録画中</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/30">
          <span className="text-white text-xs font-semibold">
            {new Date().toLocaleDateString('ja-JP', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>
    </div>
  );
}