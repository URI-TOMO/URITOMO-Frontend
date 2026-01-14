import { useState } from 'react';
import { FileText, BarChart3, Bot } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface TranslationEntry {
  id: string;
  speaker: string;
  originalText: string;
  translatedText: string;
  originalLang: string;
  translatedLang: string;
  timestamp: Date;
}

interface TranslationPanelProps {
  translationLog: TranslationEntry[];
  realtimeTranslation: TranslationEntry | null;
}

export function TranslationPanel({ translationLog, realtimeTranslation }: TranslationPanelProps) {
  const [activeTab, setActiveTab] = useState<'log' | 'summary'>('log');

  return (
    <div className="h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex flex-col">
      {/* Header with Tabs */}
      <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-4 py-2.5 border-b-4 border-blue-600">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('log')}
            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'log'
                ? 'bg-white text-blue-600 shadow-md'
                : 'bg-white/30 text-white hover:bg-white/40'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            翻訳ログ
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'summary'
                ? 'bg-white text-blue-600 shadow-md'
                : 'bg-white/30 text-white hover:bg-white/40'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            サマリー
          </button>
        </div>
      </div>

      {/* Realtime Translation - Fixed at top */}
      {realtimeTranslation && (
        <div className="flex-shrink-0 p-3 bg-gradient-to-br from-yellow-100 to-orange-100 border-b-2 border-yellow-300">
          <div className="bg-white rounded-xl p-2.5 shadow-md">
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
      {activeTab === 'log' ? (
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2.5">
            {translationLog.slice(-10).reverse().map((entry) => (
              <div key={entry.id} className="bg-white rounded-xl p-2.5 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">{entry.speaker}</span>
                  <span className="text-xs text-gray-500">
                    {entry.timestamp.toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="space-y-1.5">
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
          <div className="p-3 space-y-3">
            {/* Summary Content */}
            <div className="bg-white rounded-xl p-3 shadow-md">
              <h3 className="font-semibold text-gray-900 mb-2.5 flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4 text-purple-500" />
                会議サマリー
              </h3>
              <div className="space-y-2.5 text-sm text-gray-700">
                <div>
                  <p className="font-semibold text-gray-900 mb-1 text-xs">📋 議論された主なトピック</p>
                  <ul className="list-disc list-inside space-y-0.5 pl-2 text-xs">
                    <li>プロジェクトの進捗状況</li>
                    <li>次のスプリント計画</li>
                    <li>KPIの確認と調整</li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-semibold text-gray-900 mb-1 text-xs">✅ 決定事項</p>
                  <ul className="list-disc list-inside space-y-0.5 pl-2 text-xs">
                    <li>次回ミーティングは来週水曜日</li>
                    <li>デザインレビューを優先的に実施</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 mb-1 text-xs">📊 会議統計</p>
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
                  <p className="font-semibold text-gray-900 mb-1 text-xs">🔑 キーワード</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">KPI</span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">スプリント</span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">進捗</span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">デザイン</span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">レビュー</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-gradient-to-br from-yellow-100 to-amber-100 rounded-xl p-3 shadow-md border-2 border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-white p-1.5 rounded-full shadow-sm">
                  <Bot className="h-3.5 w-3.5 text-yellow-500" />
                </div>
                <h3 className="font-semibold text-yellow-900 text-xs">Uri-Tomoのインサイト</h3>
              </div>
              <div className="space-y-1.5 text-xs text-gray-800">
                <p className="flex items-start gap-2">
                  <span className="text-yellow-500 flex-shrink-0">💡</span>
                  <span>両チームの意見交換がスムーズに進んでいます！</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-yellow-500 flex-shrink-0">🎯</span>
                  <span>専門用語の使用頻度が高めです。必要に応じて説明を求めましょう。</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-yellow-500 flex-shrink-0">⭐</span>
                  <span>文化的な配慮がよく見られます。素晴らしいコミュニケーションです！</span>
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}