import { X, Languages } from 'lucide-react';
import { Button } from './ui/button';
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

interface TranslationLogProps {
  entries: TranslationEntry[];
  summary: string[];
  onClose: () => void;
}

export function TranslationLog({ entries, summary, onClose }: TranslationLogProps) {
  return (
    <div className="w-96 bg-gradient-to-br from-gray-50 to-white border-l-4 border-yellow-400 flex flex-col h-full shadow-2xl">
      <div className="p-6 border-b-2 border-yellow-200 flex items-center justify-between bg-gradient-to-r from-yellow-100 via-yellow-200 to-amber-100 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-yellow-400 to-amber-500 p-2 rounded-full shadow-lg">
            <Languages className="h-5 w-5 text-white" />
          </div>
          <h3 className="font-bold text-gray-900 text-lg">Translation Log</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="hover:bg-yellow-200 rounded-full transition-all duration-300 hover:scale-110"
        >
          <X className="h-5 w-5 text-gray-700" />
        </Button>
      </div>

      <ScrollArea className="flex-1 overflow-auto">
        <div className="h-full">
          {/* Log Section */}
          <div className="p-6">
            <h4 className="text-xs font-bold text-gray-600 uppercase mb-4 tracking-wider flex items-center gap-2">
              <div className="h-1 w-8 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full"></div>
              Log
            </h4>
            <div className="space-y-4">
              {entries.map((entry, index) => (
                <div
                  key={entry.id}
                  className="bg-white rounded-xl p-4 space-y-3 border-2 border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-yellow-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-yellow-700 flex items-center gap-2">
                      <span className="bg-gradient-to-r from-yellow-400 to-amber-400 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs shadow-md">
                        {index + 1}
                      </span>
                      {entry.speaker}
                    </span>
                    <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-full">
                      {entry.timestamp.toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3 bg-blue-50 p-3 rounded-lg border border-blue-200 transition-all duration-300 hover:bg-blue-100">
                      <span className="text-xs px-2 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full font-bold uppercase shadow-sm">
                        {entry.originalLang}
                      </span>
                      <p className="text-sm text-gray-800 flex-1 font-medium leading-relaxed">
                        {entry.originalText}
                      </p>
                    </div>
                    <div className="flex items-start gap-3 bg-green-50 p-3 rounded-lg border border-green-200 transition-all duration-300 hover:bg-green-100">
                      <span className="text-xs px-2 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full font-bold uppercase shadow-sm">
                        {entry.translatedLang}
                      </span>
                      <p className="text-sm text-gray-700 flex-1 font-medium leading-relaxed">
                        {entry.translatedText}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Section */}
          <div className="p-6 border-t-2 border-yellow-200 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50">
            <h4 className="text-xs font-bold text-gray-700 uppercase mb-4 tracking-wider flex items-center gap-2">
              <div className="h-1 w-8 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full"></div>
              Summary
            </h4>
            <div className="space-y-3 pb-6">
              {summary.map((point, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-4 border-2 border-yellow-300 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group"
                >
                  <div className="flex items-start gap-3">
                    <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold shadow-md flex-shrink-0 group-hover:scale-110 transition-transform">
                      {index + 1}
                    </span>
                    <p className="text-sm text-gray-800 font-medium leading-relaxed">{point}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}