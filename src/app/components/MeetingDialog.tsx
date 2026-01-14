import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import type { Meeting } from './MeetingCard';

interface MeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting?: Meeting;
  onSave: (meeting: Omit<Meeting, 'id'> & { id?: string }) => void;
}

export function MeetingDialog({ open, onOpenChange, meeting, onSave }: MeetingDialogProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [status, setStatus] = useState<Meeting['status']>('upcoming');
  const [participants, setParticipants] = useState<string[]>([]);
  const [participantInput, setParticipantInput] = useState('');
  const [agenda, setAgenda] = useState<string[]>([]);
  const [agendaInput, setAgendaInput] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (meeting) {
      setTitle(meeting.title);
      setDate(meeting.date);
      setTime(meeting.time);
      setStatus(meeting.status);
      setParticipants(meeting.participants);
      setAgenda(meeting.agenda);
      setNotes(meeting.notes);
    } else {
      // Reset form
      setTitle('');
      setDate('');
      setTime('');
      setStatus('upcoming');
      setParticipants([]);
      setAgenda([]);
      setNotes('');
    }
  }, [meeting, open]);

  const addParticipant = () => {
    if (participantInput.trim()) {
      setParticipants([...participants, participantInput.trim()]);
      setParticipantInput('');
    }
  };

  const removeParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const addAgendaItem = () => {
    if (agendaInput.trim()) {
      setAgenda([...agenda, agendaInput.trim()]);
      setAgendaInput('');
    }
  };

  const removeAgendaItem = (index: number) => {
    setAgenda(agenda.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const meetingData = {
      ...(meeting?.id && { id: meeting.id }),
      title,
      date,
      time,
      status,
      participants,
      agenda,
      notes,
    };
    onSave(meetingData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {meeting ? 'ミーティングを編集' : '新しいミーティング'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">タイトル *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ミーティングのタイトル"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">日付 *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">時間 *</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">ステータス</Label>
            <Select value={status} onValueChange={(value: Meeting['status']) => setStatus(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">予定</SelectItem>
                <SelectItem value="ongoing">進行中</SelectItem>
                <SelectItem value="completed">完了</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>参加者</Label>
            <div className="flex gap-2">
              <Input
                value={participantInput}
                onChange={(e) => setParticipantInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addParticipant())}
                placeholder="参加者名を入力"
              />
              <Button type="button" onClick={addParticipant}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {participants.map((participant, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {participant}
                  <button
                    onClick={() => removeParticipant(index)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>アジェンダ</Label>
            <div className="flex gap-2">
              <Input
                value={agendaInput}
                onChange={(e) => setAgendaInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAgendaItem())}
                placeholder="アジェンダ項目を入力"
              />
              <Button type="button" onClick={addAgendaItem}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1 mt-2">
              {agenda.map((item, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span className="flex-1 text-sm">{item}</span>
                  <button
                    onClick={() => removeAgendaItem(index)}
                    className="hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">メモ</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ミーティングのメモや詳細"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={!title || !date || !time}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
