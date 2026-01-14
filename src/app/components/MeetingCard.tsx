import { Calendar, Clock, Users, Trash, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  participants: string[];
  agenda: string[];
  notes: string;
  status: 'upcoming' | 'ongoing' | 'completed';
}

interface MeetingCardProps {
  meeting: Meeting;
  onEdit: (meeting: Meeting) => void;
  onDelete: (id: string) => void;
}

export function MeetingCard({ meeting, onEdit, onDelete }: MeetingCardProps) {
  const getStatusColor = (status: Meeting['status']) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-500';
      case 'ongoing':
        return 'bg-green-500';
      case 'completed':
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: Meeting['status']) => {
    switch (status) {
      case 'upcoming':
        return '予定';
      case 'ongoing':
        return '進行中';
      case 'completed':
        return '完了';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="flex-1">
          <CardTitle className="text-xl mb-2">{meeting.title}</CardTitle>
          <Badge className={getStatusColor(meeting.status)}>
            {getStatusText(meeting.status)}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(meeting)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(meeting.id)}
          >
            <Trash className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>{meeting.date}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>{meeting.time}</span>
        </div>
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <Users className="h-4 w-4 mt-0.5" />
          <div className="flex flex-wrap gap-1">
            {meeting.participants.map((participant, index) => (
              <Badge key={index} variant="outline">
                {participant}
              </Badge>
            ))}
          </div>
        </div>
        {meeting.agenda.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-sm mb-2">アジェンダ:</p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              {meeting.agenda.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {meeting.notes && (
          <div className="pt-2 border-t">
            <p className="text-sm mb-1">メモ:</p>
            <p className="text-sm text-gray-600">{meeting.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
