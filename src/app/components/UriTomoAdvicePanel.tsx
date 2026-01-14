import { useState } from 'react';
import { Bot, Sparkles, BookOpen, Volume2, Globe, Lightbulb, Send } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface UriTomoAdvice {
  id: string;
  type: 'terminology' | 'pronunciation' | 'culture' | 'suggestion';
  question: string;
  answer: string;
  timestamp: Date;
}

export function UriTomoAdvicePanel() {
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
    <div className="h-full bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 px-4 py-3 border-b-4 border-yellow-500">
        <div className="flex items-center gap-2">
          <div className="bg-white p-2 rounded-full shadow-lg">
            <Bot className="h-5 w-5 text-yellow-500" />
          </div>
          <div>
            <h2 className="font-bold text-white text-base flex items-center gap-1">
              Uri-Tomo
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            </h2>
            <p className="text-xs text-white/90">AIミーティングアシスタント</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Advice History */}
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-2.5">
            {adviceHistory.length === 0 ? (
              <div className="text-center py-8">
                <div className="bg-white p-4 rounded-2xl shadow-lg inline-block">
                  <Bot className="h-10 w-10 text-orange-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">
                    困ったことがあれば<br />いつでも聞いてくださいね！
                  </p>
                </div>
              </div>
            ) : (
              adviceHistory.map((advice) => (
                <div key={advice.id} className="space-y-2">
                  {/* Question */}
                  <div className="flex justify-end">
                    <div className="bg-blue-500 text-white px-3 py-2 rounded-2xl rounded-tr-sm max-w-[85%] shadow-md">
                      <p className="text-sm">{advice.question}</p>
                    </div>
                  </div>

                  {/* Answer */}
                  <div className="flex gap-2">
                    <div className="bg-white p-1.5 rounded-full h-7 w-7 flex-shrink-0 shadow-md">
                      <Bot className="h-4 w-4 text-yellow-500" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-white px-3 py-2.5 rounded-2xl rounded-tl-sm shadow-md">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${getTypeColor(advice.type)}`}>
                            {getTypeIcon(advice.type)}
                            {getTypeLabel(advice.type)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {advice.timestamp.toLocaleTimeString('ja-JP', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 leading-relaxed">
                          {advice.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-3 bg-white border-t border-yellow-200">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAskUriTomo()}
              placeholder="Uri-Tomoに質問する..."
              className="flex-1 border-2 border-yellow-200 focus:border-yellow-400 rounded-full px-4 text-sm"
            />
            <Button
              onClick={handleAskUriTomo}
              disabled={!input.trim()}
              className="bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 text-white rounded-full px-5 shadow-md"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            専門用語、発音、文化、何でも聞いてください！
          </p>
        </div>
      </div>
    </div>
  );
}