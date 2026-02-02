import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bot, Clock, Users, Languages, Sparkles, FileText } from 'lucide-react';

export function SummaryLoading() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Irregular progress animation over 10 seconds
        const keyframes = [
            { time: 0, progress: 0 },
            { time: 500, progress: 8 },
            { time: 1000, progress: 12 },
            { time: 1500, progress: 18 },
            { time: 2000, progress: 28 },
            { time: 2500, progress: 32 },
            { time: 3000, progress: 38 },
            { time: 3500, progress: 45 },
            { time: 4000, progress: 52 },
            { time: 4500, progress: 56 },
            { time: 5000, progress: 61 },
            { time: 5500, progress: 64 },
            { time: 6000, progress: 68 },
            { time: 6500, progress: 74 },
            { time: 7000, progress: 79 },
            { time: 7500, progress: 84 },
            { time: 8000, progress: 88 },
            { time: 8500, progress: 93 },
            { time: 9000, progress: 97 },
            { time: 9500, progress: 99 },
            { time: 10000, progress: 100 },
        ];

        let currentKeyframeIndex = 0;
        let startTime = Date.now();

        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;

            // Find the current keyframe
            while (
                currentKeyframeIndex < keyframes.length - 1 &&
                elapsed >= keyframes[currentKeyframeIndex + 1].time
            ) {
                currentKeyframeIndex++;
            }

            if (currentKeyframeIndex < keyframes.length - 1) {
                const current = keyframes[currentKeyframeIndex];
                const next = keyframes[currentKeyframeIndex + 1];
                const segmentProgress =
                    (elapsed - current.time) / (next.time - current.time);
                const interpolatedProgress =
                    current.progress + (next.progress - current.progress) * segmentProgress;
                setProgress(interpolatedProgress);
            } else {
                setProgress(100);
            }
        }, 50);

        // Navigate to minutes page after 10 seconds
        const timer = setTimeout(() => {
            navigate(`/minutes/${id}`);
        }, 10000);

        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, [id, navigate]);

    // Load meeting data from localStorage for stats display
    const [stats, setStats] = useState({ duration: '00:00', participants: 0, translations: 0 });

    useEffect(() => {
        const savedMeetings = JSON.parse(localStorage.getItem('meetings') || '[]');
        const meeting = savedMeetings.find((m: any) => m.id === id);

        if (meeting) {
            const startTime = new Date(meeting.startTime);
            const endTime = new Date(meeting.endTime);
            const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);
            const durationSeconds = Math.floor(((endTime.getTime() - startTime.getTime()) % 60000) / 1000);
            const formattedDuration = `${durationMinutes.toString().padStart(2, '0')}:${durationSeconds.toString().padStart(2, '0')}`;

            setStats({
                duration: formattedDuration,
                participants: meeting.participants?.length || 0,
                translations: meeting.chatMessages?.length || 0,
            });
        }
    }, [id]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border-2 border-yellow-400/30"
            >
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 px-8 py-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-300/20 to-transparent animate-pulse" />
                    <div className="relative z-10 text-center">
                        <motion.div
                            animate={{
                                scale: [1, 1.1, 1],
                                rotate: [0, 5, -5, 0],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatType: "reverse"
                            }}
                            className="inline-block mb-3"
                        >
                            <div className="bg-white p-4 rounded-2xl shadow-lg">
                                <Bot className="h-12 w-12 text-yellow-500" />
                            </div>
                        </motion.div>
                        <h2 className="text-white font-bold text-2xl mb-2">
                            Uri-Tomo AI가 회의를 분석하고 있습니다
                        </h2>
                        <p className="text-yellow-100 text-sm">
                            AI 기반 회의 요약을 생성 중입니다...
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    <div className="space-y-6">
                        {/* Progress Bar */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-gray-300 font-medium">생성 진행률</span>
                                <motion.span
                                    className="text-yellow-400 font-bold"
                                    animate={{ opacity: [1, 0.5, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                    {Math.round(progress)}%
                                </motion.span>
                            </div>
                            <div className="h-3 bg-gray-700 rounded-full overflow-hidden shadow-inner">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 rounded-full shadow-lg relative overflow-hidden"
                                    style={{ width: `${progress}%` }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                >
                                    {/* Shimmer effect */}
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                        animate={{
                                            x: ["-100%", "200%"]
                                        }}
                                        transition={{
                                            duration: 1.5,
                                            repeat: Infinity,
                                            ease: "linear"
                                        }}
                                    />
                                </motion.div>
                            </div>
                        </div>

                        {/* Processing Steps */}
                        <div className="grid grid-cols-3 gap-4">
                            <motion.div
                                className="bg-gray-800/50 border border-yellow-400/30 rounded-xl p-4 text-center"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <Sparkles className="h-6 w-6 text-yellow-400 mx-auto mb-2 animate-pulse" />
                                <p className="text-xs text-gray-300 mb-1">주요 내용</p>
                                <p className="text-sm font-bold text-white">분석 중</p>
                            </motion.div>
                            <motion.div
                                className="bg-gray-800/50 border border-yellow-400/30 rounded-xl p-4 text-center"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <FileText className="h-6 w-6 text-blue-400 mx-auto mb-2 animate-pulse" />
                                <p className="text-xs text-gray-300 mb-1">액션 아이템</p>
                                <p className="text-sm font-bold text-white">추출 중</p>
                            </motion.div>
                            <motion.div
                                className="bg-gray-800/50 border border-yellow-400/30 rounded-xl p-4 text-center"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                            >
                                <Users className="h-6 w-6 text-green-400 mx-auto mb-2 animate-pulse" />
                                <p className="text-xs text-gray-300 mb-1">결정 사항</p>
                                <p className="text-sm font-bold text-white">정리 중</p>
                            </motion.div>
                        </div>

                        {/* Meeting Stats */}
                        <div className="bg-gradient-to-br from-yellow-900/30 to-amber-900/30 border border-yellow-400/20 rounded-xl p-5">
                            <h3 className="text-yellow-400 font-semibold mb-3 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                회의 정보
                            </h3>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-2xl font-bold text-white mb-1">{stats.duration}</p>
                                    <p className="text-xs text-gray-400">회의 시간</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white mb-1">{stats.participants}</p>
                                    <p className="text-xs text-gray-400">참가자 수</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white mb-1">{stats.translations}</p>
                                    <p className="text-xs text-gray-400">번역 횟수</p>
                                </div>
                            </div>
                        </div>

                        {/* Info Message */}
                        <motion.div
                            className="flex items-center gap-3 p-4 bg-blue-900/20 border border-blue-400/30 rounded-xl"
                            animate={{ opacity: [0.7, 1, 0.7] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <Sparkles className="h-5 w-5 text-blue-400 flex-shrink-0" />
                            <p className="text-sm text-blue-200">
                                잠시만 기다려 주세요. Uri-Tomo AI가 회의 내용을 종합하여 요약 문서를 작성하고 있습니다.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
