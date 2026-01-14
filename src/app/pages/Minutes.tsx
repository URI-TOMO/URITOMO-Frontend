import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Download, Users, Clock, Calendar, Languages, Bot, FileText, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ProfileSettingsModal, SystemSettingsModal } from '../components/SettingsModals';
import { toast } from 'sonner';

interface MeetingMinutes {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  participants: Array<{
    id: string;
    name: string;
    language?: string;
  }>;
  translationLog: Array<{
    id: string;
    speaker: string;
    originalText: string;
    translatedText: string;
    originalLang: string;
    translatedLang: string;
    timestamp: Date;
  }>;
  chatMessages?: Array<{
    id: string;
    userName: string;
    message: string;
    timestamp: Date;
  }>;
  summary?: {
    keyPoints: string[];
    actionItems: string[];
    decisions: string[];
  };
}

export function Minutes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [minutes, setMinutes] = useState<MeetingMinutes | null>(null);

  // Profile and system settings states
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showSystemSettings, setShowSystemSettings] = useState(false);
  const [userName, setUserName] = useState('ユーザー');
  const [userEmail, setUserEmail] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [avatarType, setAvatarType] = useState<'emoji' | 'image' | 'none'>('none');
  const [editedUserName, setEditedUserName] = useState('');
  const [editedUserAvatar, setEditedUserAvatar] = useState('');
  const [editedAvatarType, setEditedAvatarType] = useState<'emoji' | 'image' | 'none'>('none');
  const [systemLanguage, setSystemLanguage] = useState<'ja' | 'ko' | 'en'>('ja');

  // Listen for sidebar button clicks
  useEffect(() => {
    const handleOpenProfile = () => {
      setEditedUserName(userName);
      setEditedUserAvatar(userAvatar);
      setEditedAvatarType(avatarType);
      setShowProfileSettings(true);
    };

    const handleOpenSettings = () => {
      setShowSystemSettings(true);
    };

    // Listen for profile updates from other pages
    const handleProfileUpdated = () => {
      const savedProfile = localStorage.getItem('uri-tomo-user-profile');
      if (savedProfile) {
        try {
          const profile = JSON.parse(savedProfile);
          setUserName(profile.name || 'ユーザー');
          setUserEmail(profile.email || '');
          setUserAvatar(profile.avatar || '');
          setAvatarType(profile.avatarType || 'none');
        } catch (e) {
          console.error('Failed to load profile:', e);
        }
      }
    };

    window.addEventListener('open-profile-settings', handleOpenProfile);
    window.addEventListener('open-system-settings', handleOpenSettings);
    window.addEventListener('profile-updated', handleProfileUpdated);

    return () => {
      window.removeEventListener('open-profile-settings', handleOpenProfile);
      window.removeEventListener('open-system-settings', handleOpenSettings);
      window.removeEventListener('profile-updated', handleProfileUpdated);
    };
  }, [userName, userAvatar, avatarType]);

  useEffect(() => {
    // Load user profile
    const savedUser = localStorage.getItem('uri-tomo-user');
    const savedProfile = localStorage.getItem('uri-tomo-user-profile');
    const savedLanguage = localStorage.getItem('uri-tomo-system-language');

    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        setUserName(profile.name || 'ユーザー');
        setUserEmail(profile.email || savedUser || '');
        setUserAvatar(profile.avatar || '');
        setAvatarType(profile.avatarType || 'none');
      } catch (e) {
        if (savedUser) {
          setUserEmail(savedUser);
          setUserName(savedUser.split('@')[0]);
        }
      }
    } else if (savedUser) {
      setUserEmail(savedUser);
      setUserName(savedUser.split('@')[0]);
    }

    if (savedLanguage) {
      setSystemLanguage(savedLanguage as 'ja' | 'ko' | 'en');
    }
  }, []);

  useEffect(() => {
    // Load meeting data from localStorage
    const savedMeetings = JSON.parse(localStorage.getItem('meetings') || '[]');
    const meeting = savedMeetings.find((m: any) => m.id === id);
    
    if (meeting) {
      // Generate AI summary if not exists
      const summary = meeting.summary || {
        keyPoints: [
          'プロジェクトの進捗状況について全体的な共有が行われました',
          '次期スプリントの計画とマイルストーンが確認されました',
          '日韓チーム間のコラボレーションが順調に進んでいることが報告されました',
          '技術的な課題について建設的な議論が行われました',
        ],
        actionItems: [
          '次回ミーティングまでに各チームがタスクを完了する（佐藤太郎）',
          'KPI レポートを作成し共有する（김민수）',
          'デザインレビューを実施する（田中花子）',
          '技術ドキュメントを更新する（이지えん）',
        ],
        decisions: [
          '次期スプリントのリリース日を2週間後に設定',
          '隔週で日韓合同ミーティングを継続実施',
          'Uri-TomoのAI翻訳機能を全プロジェクトに展開',
        ],
      };

      // Ensure participants array exists and is properly formatted
      const participants = (meeting.participants || []).map((p: any) => ({
        id: p.id || String(Math.random()),
        name: p.name || 'Unknown',
        language: p.language,
      }));

      // Ensure translationLog array exists and timestamps are Date objects
      const translationLog = (meeting.translationLog || []).map((t: any) => ({
        ...t,
        timestamp: new Date(t.timestamp),
      }));

      setMinutes({
        id: meeting.id,
        title: meeting.title,
        startTime: new Date(meeting.startTime),
        endTime: new Date(meeting.endTime),
        participants,
        translationLog,
        chatMessages: meeting.chatMessages || [],
        summary,
      });
    }
  }, [id]);

  const handleExport = () => {
    if (!minutes) return;

    const content = `
会議議事録
================

会議名: ${minutes.title}
開始時刻: ${minutes.startTime.toLocaleString('ja-JP')}
終了時刻: ${minutes.endTime.toLocaleString('ja-JP')}
所要時間: ${Math.floor((minutes.endTime.getTime() - minutes.startTime.getTime()) / 60000)} 分

参加者:
${minutes.participants.map(p => `- ${p.name} ${p.language ? `(${p.language})` : ''}`).join('\n')}

主要ポイント:
${minutes.summary?.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

アクションアイテム:
${minutes.summary?.actionItems.map((a, i) => `${i + 1}. ${a}`).join('\n')}

決定事項:
${minutes.summary?.decisions.map((d, i) => `${i + 1}. ${d}`).join('\n')}

翻訳ログ:
${minutes.translationLog.map(t => `
[${t.timestamp.toLocaleTimeString('ja-JP')}] ${t.speaker}
${t.originalLang}: ${t.originalText}
${t.translatedLang}: ${t.translatedText}
`).join('\n')}
    `;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `meeting-minutes-${id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!minutes) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Bot className="h-16 w-16 text-yellow-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">議事録を読み込んでいます...</p>
        </div>
      </div>
    );
  }

  const duration = Math.floor((minutes.endTime.getTime() - minutes.startTime.getTime()) / 60000);

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate(`/meeting/${id}`, { state: { activeTab: 'documents' } })}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-white">{minutes.title}</h1>
                <p className="text-white/90 text-sm">会議議事録</p>
              </div>
            </div>
            
            <Button
              onClick={handleExport}
              className="bg-white text-yellow-600 hover:bg-yellow-50 shadow-md"
            >
              <Download className="h-5 w-5 mr-2" />
              エクスポート
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Meeting Info */}
        <Card className="p-6 mb-6 border-2 border-yellow-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">開催日</p>
                <p className="font-semibold text-gray-900">
                  {minutes.startTime.toLocaleDateString('ja-JP')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">時間</p>
                <p className="font-semibold text-gray-900">
                  {minutes.startTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                  {' - '}
                  {minutes.endTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">所要時間</p>
                <p className="font-semibold text-gray-900">{duration} 分</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">参加者</p>
                <p className="font-semibold text-gray-900">{minutes.participants.length} 人</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Uri-Tomo Summary */}
        <Card className="p-6 mb-6 bg-gradient-to-br from-yellow-100 to-amber-100 border-2 border-yellow-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white p-2 rounded-full shadow-md">
              <Bot className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                Uri-TomoのAIサマリー
                <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
              </h2>
              <p className="text-sm text-gray-600">AIが自動生成した会議の要約</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Key Points */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-yellow-600" />
                主要ポイント
              </h3>
              <ul className="space-y-2">
                {minutes.summary?.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-yellow-600 font-bold">•</span>
                    <span className="text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Items */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-yellow-600" />
                アクションアイテム
              </h3>
              <ul className="space-y-2">
                {minutes.summary?.actionItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-yellow-600 font-bold">{index + 1}.</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Decisions */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-yellow-600" />
                決定事項
              </h3>
              <ul className="space-y-2">
                {minutes.summary?.decisions.map((decision, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-yellow-600 font-bold">✓</span>
                    <span className="text-gray-700">{decision}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="participants" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-yellow-100">
            <TabsTrigger value="participants" className="data-[state=active]:bg-white">
              <Users className="h-4 w-4 mr-2" />
              参加者
            </TabsTrigger>
            <TabsTrigger value="translation" className="data-[state=active]:bg-white">
              <Languages className="h-4 w-4 mr-2" />
              翻訳ログ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="participants">
            <Card className="p-6">
              <h3 className="font-semibold text-lg text-gray-900 mb-4">参加者一覧</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {minutes.participants.map((participant) => (
                  <div key={participant.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="bg-yellow-100 p-2 rounded-full">
                      <Users className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{participant.name}</p>
                      {participant.language && (
                        <p className="text-sm text-gray-600">
                          {participant.language === 'ja' ? '🇯🇵 日本語' : '🇰🇷 한국어'}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="translation">
            <Card className="p-6">
              <h3 className="font-semibold text-lg text-gray-900 mb-4">リアルタイム翻訳ログ</h3>
              <div className="space-y-4">
                {minutes.translationLog.map((entry) => (
                  <div key={entry.id} className="border-l-4 border-yellow-400 pl-4 py-2 bg-gray-50 rounded-r-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{entry.speaker}</span>
                      <span className="text-sm text-gray-600">
                        {new Date(entry.timestamp).toLocaleTimeString('ja-JP')}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="bg-white p-3 rounded">
                        <p className="text-xs text-gray-600 mb-1">{entry.originalLang}</p>
                        <p className="text-gray-900">{entry.originalText}</p>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                        <p className="text-xs text-gray-600 mb-1">{entry.translatedLang}</p>
                        <p className="text-gray-900">{entry.translatedText}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        isOpen={showProfileSettings}
        onClose={() => setShowProfileSettings(false)}
        userName={userName}
        userEmail={userEmail}
        userAvatar={userAvatar}
        avatarType={avatarType}
        editedUserName={editedUserName}
        editedUserAvatar={editedUserAvatar}
        editedAvatarType={editedAvatarType}
        systemLanguage={systemLanguage}
        onNameChange={setEditedUserName}
        onAvatarChange={setEditedUserAvatar}
        onAvatarTypeChange={setEditedAvatarType}
        onAvatarImageUpload={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              setEditedUserAvatar(reader.result as string);
            };
            reader.readAsDataURL(file);
          }
        }}
        onSave={() => {
          setUserName(editedUserName);
          setUserAvatar(editedUserAvatar);
          setAvatarType(editedAvatarType);
          const profile = {
            name: editedUserName,
            email: userEmail,
            avatar: editedUserAvatar,
            avatarType: editedAvatarType,
          };
          localStorage.setItem('uri-tomo-user-profile', JSON.stringify(profile));
          window.dispatchEvent(new Event('profile-updated'));
          toast.success('プロフィールが更新されました');
          setShowProfileSettings(false);
        }}
      />

      {/* System Settings Modal */}
      <SystemSettingsModal
        isOpen={showSystemSettings}
        onClose={() => setShowSystemSettings(false)}
        systemLanguage={systemLanguage}
        onLanguageChange={setSystemLanguage}
      />
    </div>
  );
}