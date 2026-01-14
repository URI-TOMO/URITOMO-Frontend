import { Volume2, Languages } from 'lucide-react';

interface RealtimeTranslationProps {
  currentSpeaker: string;
  originalText: string;
  translatedText: string;
  originalLang: string;
  translatedLang: string;
}

export function RealtimeTranslation({
  currentSpeaker,
  originalText,
  translatedText,
  originalLang,
  translatedLang,
}: RealtimeTranslationProps) {
  if (!originalText && !translatedText) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-400 text-gray-900 px-8 py-5 border-t-4 border-yellow-500 shadow-2xl backdrop-blur-sm animate-slide-up">
      <div className="flex items-center gap-3 mb-3">
        <div className="bg-white/90 p-2 rounded-full shadow-lg">
          <Languages className="h-5 w-5 text-yellow-600 animate-pulse" />
        </div>
        <div>
          <span className="text-sm font-bold text-yellow-900 uppercase tracking-wide">
            Real-time Translation
          </span>
          <span className="text-sm text-yellow-800 ml-3 font-medium">• {currentSpeaker}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white/95 backdrop-blur-md rounded-xl p-3.5 border-2 border-yellow-400 shadow-xl transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-xs px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full font-bold uppercase tracking-wide shadow-md">
              {originalLang}
            </span>
            <Volume2 className="h-4 w-4 text-blue-600 animate-pulse" />
          </div>
          <p className="text-sm text-gray-900 font-medium leading-relaxed">{originalText}</p>
        </div>
        <div className="bg-white/95 backdrop-blur-md rounded-xl p-3.5 border-2 border-yellow-400 shadow-xl transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-xs px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full font-bold uppercase tracking-wide shadow-md">
              {translatedLang}
            </span>
            <Volume2 className="h-4 w-4 text-green-600 animate-pulse" />
          </div>
          <p className="text-sm text-gray-900 font-medium leading-relaxed">{translatedText}</p>
        </div>
      </div>
    </div>
  );
}