import { useState } from 'react';
import { Bot, Sparkles, BookOpen, Volume2, Globe, Lightbulb, Send, X, FileText, BarChart3 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface TranslationEntry {
  id: string;
  speaker: string;
  originalText: string;
  translatedText: string;
  originalLang: string;
  translatedLang: string;
  timestamp: Date;
}

interface UriTomoAdvice {
  id: string;
  type: 'terminology' | 'pronunciation' | 'culture' | 'suggestion';
  question: string;
  answer: string;
  timestamp: Date;
}

interface UriTomoPanelProps {
  translationLog: TranslationEntry[];
  realtimeTranslation: TranslationEntry | null;
  onClose: () => void;
}

export function UriTomoPanel({ translationLog, realtimeTranslation, onClose }: UriTomoPanelProps) {
  const [activeTab, setActiveTab] = useState<'advice' | 'translation'>('advice');
  const [translationSubTab, setTranslationSubTab] = useState<'log' | 'summary'>('log');
  const [input, setInput] = useState('');
  const [adviceHistory, setAdviceHistory] = useState<UriTomoAdvice[]>([
    {
      id: '1',
      type: 'terminology',
      question: 'KPIって韓国語でなんて言えばいい？',
      answer: 'KPIは韓国語で「KPI (케이피아이)」または「핵심 성과 지표」と言います。ビジネスシーンでは「KPI」がそのまま使われることが多いですよ！',
      timestamp: new Date(Date.now() - 180000),
    },
    {
      id: '2',
      type: 'pronunciation',
      question: '「스프린트」の発音を教えて',
      answer: '「스프린트」は「スプリントゥ」のように発音します。最後の「트」は軽く「トゥ」と発音するのがポイントです。日本語の「スプリント」とほぼ同じですが、少し力強く発音すると自然に聞こえますよ！',
      timestamp: new Date(Date.now() - 120000),
    },
  ]);

  const handleAskUriTomo = () => {
    if (!input.trim()) return;

    const question = input;
    
    // Uri-Tomoの返答例（実際にはAI APIを使用）
    const responses = [
      {
        type: 'terminology' as const,
        answer: `「${question}」について説明しますね！この用語は韓国語で「○○○」と表現されます。会議では「○○○」という言い方が自然ですよ。`,
      },
      {
        type: 'pronunciation' as const,
        answer: `発音のコツをお教えします！「${question}」は韓国語で「○○○」と発音します。イントネーションは平坦に、最後の音節を少し強調するとネイティブっぽく聞こえますよ！`,
      },
      {
        type: 'culture' as const,
        answer: `文化的なポイントをご紹介します！韓国のビジネスシーンでは「${question}」について、日本とは少し異なるアプローチがあります。より直接的な表現が好まれる傾向にありますよ。`,
      },
      {
        type: 'suggestion' as const,
        answer: `「${question}」についてアドバイスします！この場面では、相手の意見を尊重しながら、自分の考えもはっきり伝えることが大切です。「제 생각에는... (私の考えでは...)」という前置きを使うと良いでしょう。`,
      },
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    const newAdvice: UriTomoAdvice = {
      id: Date.now().toString(),
      question,
      answer: randomResponse.answer,
      type: randomResponse.type,
      timestamp: new Date(),
    };

    setAdviceHistory((prev) => [...prev, newAdvice]);
    setInput('');
  };

  const getTypeIcon = (type: UriTomoAdvice['type']) => {
    switch (type) {
      case 'terminology':
        return <BookOpen className="h-4 w-4" />;
      case 'pronunciation':
        return <Volume2 className="h-4 w-4" />;
      case 'culture':
        return <Globe className="h-4 w-4" />;
      case 'suggestion':
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: UriTomoAdvice['type']) => {
    switch (type) {
      case 'terminology':
        return '専門用語';
      case 'pronunciation':
        return '発音';
      case 'culture':
        return '文化';
      case 'suggestion':
        return '提案';
    }
  };

  const getTypeColor = (type: UriTomoAdvice['type']) => {
    switch (type) {
      case 'terminology':
        return 'bg-blue-100 text-blue-700';
      case 'pronunciation':
        return 'bg-purple-100 text-purple-700';
      case 'culture':
        return 'bg-green-100 text-green-700';
      case 'suggestion':
        return 'bg-orange-100 text-orange-700';
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-400 via-yellow-400 to-green-400 px-4 py-3 border-b-4 border-orange-500">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="bg-white p-2 rounded-full shadow-lg">
              <Bot className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <h2 className="font-bold text-white text-lg flex items-center gap-1">
                Uri-Tomo
                <Sparkles className="h-4 w-4 animate-pulse" />
              </h2>
              <p className="text-xs text-white/90">あなたの会議パートナー</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('translation')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'translation'
                ? 'bg-white text-orange-600 shadow-md'
                : 'bg-white/30 text-white hover:bg-white/40'
            }`}
          >
            🌐 翻訳
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Sub Tabs for Translation */}
        <div className="px-4 pt-3 pb-2 bg-white border-b border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={() => setTranslationSubTab('log')}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                translationSubTab === 'log'
                  ? 'bg-gradient-to-r from-orange-400 to-yellow-400 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              翻訳ログ
            </button>
            <button
              onClick={() => setTranslationSubTab('summary')}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                translationSubTab === 'summary'
                  ? 'bg-gradient-to-r from-orange-400 to-yellow-400 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              サマリー
            </button>
          </div>
        </div>

        {/* Realtime Translation - Fixed Height */}
        {realtimeTranslation && (
          <div className="flex-shrink-0 p-3 bg-gradient-to-br from-yellow-100 to-orange-100 border-b-2 border-yellow-300">
            <div className="bg-white rounded-xl p-3 shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold text-gray-900">
                  {realtimeTranslation.speaker} が話しています
                </span>
              </div>

              <div className="space-y-2">
                <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded font-medium">
                      {realtimeTranslation.originalLang}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 leading-relaxed">{realtimeTranslation.originalText}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs px-2 py-0.5 bg-green-500 text-white rounded font-medium">
                      {realtimeTranslation.translatedLang}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 leading-relaxed">{realtimeTranslation.translatedText}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content - Scrollable */}
        {translationSubTab === 'log' ? (
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {translationLog.slice(-10).reverse().map((entry) => (
                <div key={entry.id} className="bg-white rounded-xl p-3 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900">{entry.speaker}</span>
                    <span className="text-xs text-gray-500">
                      {entry.timestamp.toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="bg-blue-50 rounded-lg p-2 border border-blue-100">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs px-1.5 py-0.5 bg-blue-500 text-white rounded font-medium">
                          {entry.originalLang}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{entry.originalText}</p>
                    </div>

                    <div className="bg-green-50 rounded-lg p-2 border border-green-100">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs px-1.5 py-0.5 bg-green-500 text-white rounded font-medium">
                          {entry.translatedLang}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{entry.translatedText}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Summary Content */}
              <div className="bg-white rounded-xl p-4 shadow-md">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-orange-500" />
                  会議サマリー
                </h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">📋 議論された主なトピック</p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                      <li>プロジェクトの進捗状況</li>
                      <li>次のスプリント計画</li>
                      <li>KPIの確認と調整</li>
                    </ul>
                  </div>
                  
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">✅ 決定事項</p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                      <li>次回ミーティングは来週水曜日</li>
                      <li>デザインレビューを優先的に実施</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900 mb-1">📊 会議統計</p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                        <p className="text-xs text-blue-700 font-semibold">日本語発言</p>
                        <p className="text-lg font-bold text-blue-900">{Math.floor(translationLog.filter(t => t.originalLang.includes('日本語')).length / 2 * 10)} 回</p>
                      </div>
                      <div className="bg-green-50 p-2 rounded-lg border border-green-100">
                        <p className="text-xs text-green-700 font-semibold">韓国語発言</p>
                        <p className="text-lg font-bold text-green-900">{Math.floor(translationLog.filter(t => t.originalLang.includes('한국어')).length / 2 * 10)} 回</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900 mb-1">🔑 キーワード</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">KPI</span>
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">スプリント</span>
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">進捗</span>
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">デザイン</span>
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">レビュー</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Uri-Tomo Insights */}
              <div className="bg-gradient-to-br from-orange-100 to-yellow-100 rounded-xl p-4 shadow-md border-2 border-orange-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-white p-1.5 rounded-full shadow-sm">
                    <Bot className="h-4 w-4 text-orange-500" />
                  </div>
                  <h3 className="font-semibold text-orange-900">Uri-Tomoのインサイト</h3>
                </div>
                <div className="space-y-2 text-sm text-gray-800">
                  <p className="flex items-start gap-2">
                    <span className="text-orange-500 flex-shrink-0">💡</span>
                    <span>両チームの意見交換がスムーズに進んでいます！</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-orange-500 flex-shrink-0">🎯</span>
                    <span>専門用語の使用頻度が高めです。必要に応じて説明を求めましょう。</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-orange-500 flex-shrink-0">⭐</span>
                    <span>文化的な配慮がよく見られます。素晴らしいコミュニケーションです！</span>
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}