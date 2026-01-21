import { useState, useEffect } from 'react'; // Only basic hooks if needed for UI-only things, or just React
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, Users, Settings, Bot,
  MessageSquare, Languages, Pin, ChevronRight, ChevronLeft,
  MonitorUp, Paperclip, Smile, AlertTriangle, Clock, Send, Monitor, X
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { ProfileSettingsModal, SystemSettingsModal } from '../components/SettingsModals';
import { toast } from 'sonner';
// LiveKit imports
import {
  LiveKitRoom,
  VideoTrack,
  RoomAudioRenderer,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';

import { useActiveMeetingLogic, SidebarTab } from '../hooks/useActiveMeetingLogic';

// --- Content Component ---
function ActiveMeetingContent({
  meetingId,
  currentUserProp,
  devices: initialDevices,
  initialSettings
}: {
  meetingId: string,
  currentUserProp: any,
  devices?: { audioInputId?: string; videoInputId?: string; audioOutputId?: string },
  initialSettings?: { isMicOn: boolean, isVideoOn: boolean }
}) {
  const {
    // State
    currentUser,
    isMicOn,
    isVideoOn,
    mics,
    cameras,
    speakers,
    selectedMicId,
    selectedCameraId,
    selectedSpeakerId,
    isScreenSharing,
    showScreenPickerModal,
    availableScreens,
    showSettings,
    isSidebarOpen,
    showEndMeetingConfirm,
    activeTab,
    chatInput,
    showStickerPicker,
    duration,
    chatMessages,
    translationLogs,
    termExplanations,
    participants,
    meetingTitle,
    showProfileSettings,
    showSystemSettings,
    userName,
    userEmail,
    userAvatar,
    avatarType,
    editedUserName,
    editedUserAvatar,
    editedAvatarType,
    systemLanguage,

    // LiveKit & Refs
    localCameraTrack,
    localScreenTrack,
    remoteTracks,
    chatInputRef,
    chatEndRef,

    // Setters
    setIsMicOn, // unused in JSX but available
    setIsVideoOn, // unused in JSX but available
    setSelectedMicId, // unused in JSX but available
    setSelectedCameraId, // unused in JSX but available
    setSelectedSpeakerId, // unused in JSX but available
    setShowScreenPickerModal, // unused in JSX but available
    setShowSettings,
    setIsSidebarOpen,
    setShowEndMeetingConfirm,
    setActiveTab,
    setChatInput,
    setShowStickerPicker,
    setShowProfileSettings,
    setShowSystemSettings,
    setEditedUserName,
    setEditedUserAvatar,
    setEditedAvatarType,
    setSystemLanguage,
    setUserName,
    setUserAvatar,
    setAvatarType,
    setChatMessages, // used in sticker picker

    // Actions
    handleDeviceChange,
    toggleScreenShare,
    handleScreenSelect,
    handleScreenPickerCancel,
    toggleMic,
    toggleVideo,
    handleSendChat,
    handleFileAttach,
    handleStickerSelect,
    handleEndMeeting,
    confirmEndMeeting,
    formatDuration
  } = useActiveMeetingLogic({
    meetingId,
    currentUserProp,
    initialDevices,
    initialSettings
  });

  return (
    <div className="h-screen w-full flex flex-col bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-white font-bold text-lg">{meetingTitle}</h1>
          <div className="flex items-center gap-2 px-3 py-1 bg-red-600 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-sm font-semibold">{formatDuration(duration)}</span>
          </div>
        </div>
      </header>

      {/* Main Area */}
      <div className="flex-1 overflow-hidden relative min-h-0">
        {!isSidebarOpen && (
          <motion.button initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} onClick={() => setIsSidebarOpen(true)} className="absolute top-4 right-4 z-10 bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 font-semibold transition-all">
            <Bot className="h-5 w-5" /><span>Uri-Tomoを開く</span><ChevronLeft className="h-5 w-5" />
          </motion.button>
        )}

        <PanelGroup direction="horizontal" className="h-full">
          {/* Video Grid */}
          <Panel defaultSize={isSidebarOpen ? 70 : 100} minSize={50}>
            <div className="h-full p-4 bg-gray-900 flex flex-col">
              <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
                {/* Uri-Tomo Bot */}
                <motion.div className="relative bg-gradient-to-br from-yellow-900 to-amber-900 rounded-xl overflow-hidden border-2 border-yellow-400 transition-all">
                  <div className="absolute top-3 right-3 z-10 bg-yellow-400 p-2 rounded-lg shadow-lg"><Pin className="h-4 w-4 text-gray-900" /></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-full bg-gradient-to-br from-yellow-400/20 to-amber-400/20 flex items-center justify-center">
                      <Bot className="h-12 w-12 text-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <div className="bg-black/70 backdrop-blur-sm px-3 py-1 rounded-lg flex items-center gap-2"><span className="text-white text-sm font-semibold">Uri-Tomo</span><span className="text-xs text-yellow-300 bg-yellow-600 px-2 py-0.5 rounded font-semibold">AI</span></div>
                    <div className="bg-green-600 p-2 rounded-lg animate-pulse"><Mic className="h-4 w-4 text-white" /></div>
                  </div>
                </motion.div>

                {/* Local User (Camera) */}
                <motion.div className="relative bg-gray-800 rounded-xl overflow-hidden border-2 border-gray-700 hover:border-yellow-400 transition-all">
                  <div className="absolute inset-0 flex items-center justify-center">
                    {localCameraTrack?.publication?.isSubscribed ? (
                      <VideoTrack trackRef={localCameraTrack} className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center"><div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-amber-400 flex items-center justify-center text-white font-bold text-3xl">{currentUser?.name?.charAt(0) || '?'}</div></div>
                    )}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <div className="bg-black/70 backdrop-blur-sm px-3 py-1 rounded-lg flex items-center gap-2"><span className="text-white text-sm font-semibold">{currentUser.name} (あなた)</span></div>
                    {!isMicOn && <div className="bg-red-600 p-2 rounded-lg"><MicOff className="h-4 w-4 text-white" /></div>}
                  </div>
                </motion.div>

                {/* Local User (Screen Share) */}
                {localScreenTrack && (
                  <motion.div className="relative bg-gray-800 rounded-xl overflow-hidden border-2 border-yellow-400 transition-all">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <VideoTrack trackRef={localScreenTrack} className="w-full h-full object-contain bg-black" />
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <div className="bg-black/70 backdrop-blur-sm px-3 py-1 rounded-lg flex items-center gap-2">
                        <span className="text-white text-sm font-semibold">{currentUser.name} (画面共有)</span>
                        <span className="text-xs bg-white text-black px-2 py-0.5 rounded font-bold">YOU</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Remote Participants */}
                {remoteTracks.map((track) => (
                  <motion.div key={track.participant.identity + track.source} className="relative bg-gray-800 rounded-xl overflow-hidden border-2 border-gray-700 hover:border-yellow-400 transition-all">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <VideoTrack
                        trackRef={track}
                        className={`w-full h-full ${track.source === Track.Source.ScreenShare ? 'object-contain bg-black' : 'object-cover'}`}
                      />
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <div className="bg-black/70 backdrop-blur-sm px-3 py-1 rounded-lg flex items-center gap-2">
                        <span className="text-white text-sm font-semibold">{track.participant.identity}</span>
                        {track.source === Track.Source.ScreenShare ?
                          <span className="text-xs bg-white text-black px-2 py-0.5 rounded font-bold">画面共有</span> :
                          <span className="text-xs text-gray-300 bg-gray-600 px-2 py-0.5 rounded">REMOTE</span>
                        }
                      </div>
                      {!track.participant.isMicrophoneEnabled && track.source !== Track.Source.ScreenShare && <div className="bg-red-600 p-2 rounded-lg"><MicOff className="h-4 w-4 text-white" /></div>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Panel>

          {/* Resize Handle - Only show when sidebar is open */}
          {isSidebarOpen && (
            <>
              <PanelResizeHandle className="w-2 bg-gray-700 hover:bg-yellow-400 transition-colors cursor-col-resize" />

              {/* Right Sidebar Panel */}
              <Panel defaultSize={30} minSize={25} maxSize={50}>
                <div className="h-full bg-white flex flex-col">
                  {/* Uri-Tomo Header */}
                  <div className="bg-gradient-to-r from-yellow-400 to-amber-400 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                          <Bot className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-sm">Uri-Tomo</h3>
                          <p className="text-yellow-100 text-xs">AI翻訳アシスタント</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                        title="閉じる"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Description Section - Term Explanations */}
                  <div className="border-b border-gray-200 bg-white max-h-48 overflow-y-auto">
                    <div className="sticky top-0 bg-white px-4 pt-4 pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-yellow-600" />
                        <h4 className="font-bold text-gray-900 text-sm">Description</h4>
                        <span className="text-xs text-gray-500">
                          ({termExplanations.length}件の用語解説)
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      {termExplanations.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-xs text-gray-500">
                            まだ解説はありません
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            会話中の専門用語や分かりにくい表現を自動で解説します
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {termExplanations.map((term, index) => (
                            <motion.div
                              key={term.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg p-3 border border-yellow-200"
                            >
                              <div className="flex items-start gap-2 mb-1">
                                <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-1.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-sm text-gray-900">
                                      {term.term}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      {term.timestamp.toLocaleTimeString('ja-JP', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-700 leading-relaxed">
                                    {term.explanation}
                                  </p>
                                  <p className="text-xs text-yellow-700 mt-1">
                                    → {term.detectedFrom}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tab Navigation */}
                  <div className="flex border-b border-gray-200 bg-gray-50">
                    <button
                      onClick={() => setActiveTab('translation')}
                      className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'translation'
                        ? 'bg-white text-yellow-600 border-b-2 border-yellow-400'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Languages className="h-4 w-4" />
                        <span>Realtime Translation</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('chat')}
                      className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'chat'
                        ? 'bg-white text-yellow-600 border-b-2 border-yellow-400'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>チャット</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('members')}
                      className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'members'
                        ? 'bg-white text-yellow-600 border-b-2 border-yellow-400'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>メンバー</span>
                      </div>
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 overflow-hidden">
                    {/* RT Translation Tab */}
                    {activeTab === 'translation' && (
                      <div className="h-full flex flex-col bg-gradient-to-b from-yellow-50 to-white">
                        {/* Scrollable Translation Log */}
                        <div className="flex-1 overflow-y-auto p-4">
                          {translationLogs.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                                  <Languages className="h-8 w-8 text-yellow-600" />
                                </div>
                                <p className="text-sm font-semibold text-gray-700 mb-1">
                                  翻訳待機中...
                                </p>
                                <p className="text-xs text-gray-500">
                                  会話が始まると自動で翻訳されます
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {translationLogs.map((log, index) => (
                                <motion.div
                                  key={log.id}
                                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  transition={{
                                    delay: index * 0.05,
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 20
                                  }}
                                  className={`bg-white rounded-xl p-4 shadow-md border-2 transition-all ${index === translationLogs.length - 1
                                    ? 'border-yellow-400 ring-2 ring-yellow-200'
                                    : 'border-gray-200 hover:border-yellow-300'
                                    }`}
                                >
                                  {/* Header: Speaker and Time */}
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white font-bold text-sm">
                                        {log.speaker.charAt(0)}
                                      </div>
                                      <span className="text-sm font-bold text-gray-900">
                                        {log.speaker}
                                      </span>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      {log.timestamp.toLocaleTimeString('ja-JP', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                      })}
                                    </span>
                                  </div>

                                  {/* Original Text */}
                                  <div className="mb-3 pb-3 border-b border-gray-200">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                        {log.originalLang === 'ja' ? '🇯🇵 日本語' : '🇰🇷 韓国語'}
                                      </span>
                                      <span className="text-xs text-gray-500">Original</span>
                                    </div>
                                    <p className="text-base text-gray-900 leading-relaxed">
                                      {log.originalText}
                                    </p>
                                  </div>

                                  {/* Translated Text */}
                                  <div className="bg-gradient-to-br from-yellow-100 to-amber-100 rounded-lg p-3 border-2 border-yellow-300">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Languages className="h-4 w-4 text-yellow-700" />
                                      <span className="text-xs font-bold text-yellow-800 bg-yellow-200 px-2 py-1 rounded">
                                        {log.originalLang === 'ja' ? '🇰🇷 韓国語訳' : '🇯🇵 日本語訳'}
                                      </span>
                                      <span className="text-xs text-yellow-700">Translation</span>
                                      {index === translationLogs.length - 1 && (
                                        <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded ml-auto animate-pulse">
                                          LIVE
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-base text-gray-900 font-semibold leading-relaxed">
                                      {log.translatedText}
                                    </p>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Chat Tab */}
                    {activeTab === 'chat' && (
                      <div className="h-full flex flex-col">
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                          {chatMessages.length === 0 ? (
                            <div className="text-center py-8">
                              <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                                <MessageSquare className="h-6 w-6 text-gray-400" />
                              </div>
                              <p className="text-sm text-gray-500">
                                まだメッセージがありません
                              </p>
                            </div>
                          ) : (
                            <>
                              {chatMessages.map((msg) => (
                                <motion.div
                                  key={msg.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className={`flex ${msg.sender === currentUser.name ? 'justify-end' : 'justify-start'
                                    }`}
                                >
                                  <div
                                    className={`max-w-[80%] rounded-lg p-3 ${msg.isAI
                                      ? 'bg-gradient-to-r from-yellow-100 to-amber-100 border border-yellow-300'
                                      : msg.sender === currentUser.name
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100'
                                      }`}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      {msg.isAI && (
                                        <Bot className="h-3 w-3 text-yellow-600" />
                                      )}
                                      <span className="text-xs font-semibold">
                                        {msg.sender}
                                      </span>
                                      <span className="text-xs opacity-60">
                                        {msg.timestamp.toLocaleTimeString('ja-JP', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </span>
                                    </div>
                                    {/* --- メッセージ本文エリア --- */}
                                    <div className="text-sm">
                                      {msg.fileUrl ? (
                                        // ファイルURLがある場合は、クリック可能な添付ファイルUIを表示
                                        <a
                                          href={msg.fileUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`flex items-center gap-2 p-2 rounded border transition-all hover:opacity-90 active:scale-95 ${msg.sender === currentUser.name
                                            ? 'bg-blue-700 border-blue-500 text-white shadow-sm'
                                            : 'bg-white border-gray-200 text-blue-600 shadow-sm'
                                            }`}
                                        >
                                          <Paperclip className="h-4 w-4 flex-shrink-0" />
                                          <span className="underline font-medium truncate max-w-[180px]">
                                            {msg.message}
                                          </span>
                                        </a>
                                      ) : (
                                        // 通常のテキストメッセージ
                                        <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                              {/* ★自動スクロール用の目印：リストの最後に配置 */}
                              <div ref={chatEndRef} />
                            </>
                          )}
                        </div>

                        {/* Chat Input */}
                        <div className="border-t border-gray-200 p-4">
                          {/* Sticker Picker */}
                          {showStickerPicker && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mb-3 p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border-2 border-yellow-300 shadow-lg"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                  <Smile className="h-4 w-4 text-yellow-600" />
                                  スタンプを選択
                                </h4>
                                <button
                                  onClick={() => setShowStickerPicker(false)}
                                  className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="grid grid-cols-5 gap-2">
                                {['👍', '👏', '😊', '❤️', '🎉', '✨', '💡', '🔥', '👌', '🙌', '💪', '🚀', '⭐', '✅', '📌'].map((sticker) => (
                                  <button
                                    key={sticker}
                                    onClick={() => {// ★ここを修正: メッセージ送信ではなく入力欄に追加
                                      const newValue = chatInput + sticker;
                                      setChatInput(newValue);
                                      setShowStickerPicker(false);
                                      // ★重要: 入力欄にフォーカスを戻す
                                      setTimeout(() => {
                                        if (chatInputRef.current) {
                                          // 入力欄にフォーカスを戻す
                                          chatInputRef.current.focus();
                                          // カーソルを末尾（新しい文字列の長さ）に移動
                                          const len = newValue.length;
                                          chatInputRef.current.setSelectionRange(len, len);
                                        }
                                      }, 0);
                                    }}
                                    className="text-3xl p-3 rounded-lg hover:bg-yellow-200 transition-all transform hover:scale-110 active:scale-95"
                                    title="スタンプの追加"
                                  >
                                    {sticker}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}

                          <div className="flex gap-2">
                            {/* File Attach Button */}
                            <button
                              onClick={handleFileAttach}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="ファイルを添付"
                            >
                              <Paperclip className="h-5 w-5" />
                            </button>

                            {/* Sticker Button */}
                            <button
                              onClick={() => setShowStickerPicker(!showStickerPicker)}
                              className={`p-2 rounded-lg transition-colors ${showStickerPicker
                                ? 'bg-yellow-200 text-yellow-700'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                              title="スタンプを選択"
                            >
                              <Smile className="h-5 w-5" />
                            </button>

                            <input
                              ref={chatInputRef}
                              type="text"
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                              placeholder="メッセージを入力..."
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                            />
                            <Button
                              onClick={handleSendChat}
                              disabled={!chatInput.trim()}
                              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg px-4"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Members Tab */}
                    {activeTab === 'members' && (
                      <div className="h-full overflow-y-auto p-4">
                        <div className="mb-4">
                          <h4 className="text-sm font-bold text-gray-900 mb-1">
                            参加者 ({participants.length + 2}人)
                          </h4>
                          <p className="text-xs text-gray-500">
                            {participants.filter(p => !p.isMuted).length + (isMicOn ? 1 : 0)}人が発言中
                          </p>
                        </div>

                        <div className="space-y-2">
                          {/* Uri-Tomo */}
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200"
                          >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-400 flex items-center justify-center">
                              <Bot className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-900">
                                  Uri-Tomo
                                </span>
                                <span className="text-xs bg-yellow-400 text-gray-900 px-2 py-0.5 rounded font-semibold">
                                  AI
                                </span>
                                <Pin className="h-3 w-3 text-yellow-600" />
                              </div>
                              <p className="text-xs text-gray-600">AI翻訳アシスタント</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                              <Mic className="h-4 w-4 text-green-600" />
                            </div>
                          </motion.div>

                          {/* Current User */}
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.05 }}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-400 flex items-center justify-center text-white font-bold">
                              {currentUser.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-900">
                                  {currentUser.name} (あなた)
                                </span>
                                <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                                  JA
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {isMicOn ? (
                                <>
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                  <Mic className="h-4 w-4 text-green-600" />
                                </>
                              ) : (
                                <MicOff className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                          </motion.div>

                          {/* Other Participants */}
                          {participants.map((participant, index) => (
                            <motion.div
                              key={participant.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: (index + 2) * 0.05 }}
                              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                            >
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-bold">
                                {participant.name.charAt(0)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-gray-900">
                                    {participant.name}
                                  </span>
                                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                                    {participant.language === 'ja' ? 'JA' : 'KO'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {!participant.isMuted ? (
                                  <>
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <Mic className="h-4 w-4 text-green-600" />
                                  </>
                                ) : (
                                  <MicOff className="h-4 w-4 text-red-600" />
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>

      <footer className="bg-gray-800 border-t border-gray-700 px-6 py-4 flex-shrink-0">
        <div className="flex justify-center gap-4">
          <Button onClick={toggleMic} className={`rounded-full w-12 h-12 ${isMicOn ? 'bg-gray-700' : 'bg-red-600'}`}>{isMicOn ? <Mic className="h-5 w-5 text-white" /> : <MicOff className="h-5 w-5 text-white" />}</Button>
          <Button onClick={toggleVideo} className={`rounded-full w-12 h-12 ${isVideoOn ? 'bg-gray-700' : 'bg-red-600'}`}>{isVideoOn ? <Video className="h-5 w-5 text-white" /> : <VideoOff className="h-5 w-5 text-white" />}</Button>
          <Button onClick={handleEndMeeting} className="rounded-full w-12 h-12 bg-red-600"><PhoneOff className="h-5 w-5 text-white" /></Button>
          <Button onClick={toggleScreenShare} className={`rounded-full w-12 h-12 ${isScreenSharing ? 'bg-yellow-400 hover:bg-yellow-500 text-gray-900' : 'bg-gray-700 hover:bg-gray-600'}`}><MonitorUp className={`h-5 w-5 ${isScreenSharing ? 'text-gray-900' : 'text-white'}`} /></Button>
          <Button onClick={() => setShowSettings(true)} className="rounded-full w-12 h-12 bg-gray-700"><Settings className="h-5 w-5 text-white" /></Button>
        </div>
      </footer>

      {/* Screen Picker Modal (IPC連携) */}
      {showScreenPickerModal && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50"><h3 className="font-bold flex items-center gap-2"><Monitor className="text-blue-600" /> 共有する画面を選択</h3><button onClick={handleScreenPickerCancel}><X className="h-5 w-5" /></button></div>
            <div className="p-6 overflow-y-auto bg-gray-100 grid grid-cols-2 md:grid-cols-3 gap-4">
              {availableScreens.map(s => (
                <button key={s.id} onClick={() => handleScreenSelect(s.id)} className="flex flex-col gap-2 p-2 rounded-xl hover:bg-blue-50 ring-1 ring-gray-200 hover:ring-blue-400 bg-white transition-all">
                  <div className="relative aspect-video bg-gray-800 rounded overflow-hidden"><img src={s.thumbnail} alt={s.name} className="w-full h-full object-contain" /></div>
                  <span className="text-sm font-medium text-gray-700 truncate w-full px-1">{s.name}</span>
                </button>
              ))}
              <div className="col-span-full p-4 border-t bg-white flex justify-end"><Button onClick={handleScreenPickerCancel} variant="outline">キャンセル</Button></div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" onClick={() => setShowSettings(false)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-yellow-400 to-amber-400 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3"><div className="w-10 h-10 bg-white rounded-full flex items-center justify-center"><Settings className="h-5 w-5 text-yellow-600" /></div><div><h2 className="text-white font-bold text-lg">システム設定</h2><p className="text-yellow-100 text-xs">Device & Meeting Settings</p></div></div>
              <Button variant="ghost" onClick={() => setShowSettings(false)} className="text-white hover:bg-white/20 rounded-full w-8 h-8 p-0">✕</Button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6">
              {/* Audio Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200 pb-2"><Mic className="h-5 w-5 text-gray-700" /><h3 className="font-bold text-gray-900">オーディオ設定</h3></div>
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">マイク</label>
                    <select
                      value={selectedMicId}
                      onChange={(e) => handleDeviceChange('audioinput', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 text-sm bg-white"
                    >
                      {!selectedMicId && <option value="" disabled>デバイスを選択中...</option>}
                      {mics.map(m => <option key={m.deviceId} value={m.deviceId}>{m.label || `Microphone ${m.deviceId.slice(0, 5)}...`}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">スピーカー</label>
                    <select
                      value={selectedSpeakerId}
                      onChange={(e) => handleDeviceChange('audiooutput', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 text-sm bg-white"
                      disabled={speakers.length === 0}
                    >
                      {!selectedSpeakerId && <option value="" disabled>デバイスを選択中...</option>}
                      {speakers.map(s => <option key={s.deviceId} value={s.deviceId}>{s.label || `Speaker ${s.deviceId.slice(0, 5)}...`}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><div><p className="text-sm font-semibold text-gray-900">ノイズキャンセル</p><p className="text-xs text-gray-500">バックグラウンドノイズを低減</p></div><input type="checkbox" className="toggle" defaultChecked /></div>
                </div>
              </div>

              {/* Video Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200 pb-2"><Video className="h-5 w-5 text-gray-700" /><h3 className="font-bold text-gray-900">ビデオ設定</h3></div>
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">カメラ</label>
                    <select
                      value={selectedCameraId}
                      onChange={(e) => handleDeviceChange('videoinput', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 text-sm bg-white"
                    >
                      {!selectedCameraId && <option value="" disabled>デバイスを選択中...</option>}
                      {cameras.map(c => <option key={c.deviceId} value={c.deviceId}>{c.label || `Camera ${c.deviceId.slice(0, 5)}...`}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">解像度</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 text-sm bg-white"><option>HD (720p)</option><option>Full HD (1080p)</option><option>4K (2160p)</option></select>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><div><p className="text-sm font-semibold text-gray-900">ビューティーフィルター</p><p className="text-xs text-gray-500">映像を自動補正</p></div><input type="checkbox" className="toggle" /></div>
                </div>
              </div>

              {/* Translation Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200 pb-2"><Languages className="h-5 w-5 text-yellow-600" /><h3 className="font-bold text-gray-900">Uri-Tomo AI翻訳設定</h3></div>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200"><div><p className="text-sm font-semibold text-gray-900">リアルタイム翻訳</p><p className="text-xs text-gray-500">日韓自動翻訳を有効化</p></div><input type="checkbox" className="toggle" defaultChecked /></div>
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200"><div><p className="text-sm font-semibold text-gray-900">用語解説 (Description)</p><p className="text-xs text-gray-500">専門用語を自動で解説</p></div><input type="checkbox" className="toggle" defaultChecked /></div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">翻訳言語ペア</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 text-sm bg-white"><option>🇯🇵 日本語 ⇄ 🇰🇷 韓国語</option><option>🇯🇵 日本語 ⇄ 🇺🇸 英語</option><option>🇰🇷 韓国語 ⇄ 🇺🇸 英語</option></select>
                  </div>
                </div>
              </div>

              {/* General Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200 pb-2"><Settings className="h-5 w-5 text-gray-700" /><h3 className="font-bold text-gray-900">一般設定</h3></div>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><div><p className="text-sm font-semibold text-gray-900">会議の自動録画</p><p className="text-xs text-gray-500">開始時に自動で記録</p></div><input type="checkbox" className="toggle" defaultChecked /></div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><div><p className="text-sm font-semibold text-gray-900">通知音</p><p className="text-xs text-gray-500">参加者の入退室を通知</p></div><input type="checkbox" className="toggle" defaultChecked /></div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3 shrink-0">
              <Button variant="ghost" onClick={() => setShowSettings(false)} className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg">キャンセル</Button>
              <Button onClick={() => setShowSettings(false)} className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg font-semibold">保存</Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* End Meeting Confirmation Modal */}
      {showEndMeetingConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowEndMeetingConfirm(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Warning */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", damping: 15 }}
                className="relative z-10"
              >
                <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <PhoneOff className="h-10 w-10 text-red-600" />
                </div>
                <h2 className="text-white font-bold text-2xl mb-2">
                  ミーティングを終了しますか？
                </h2>
                <p className="text-red-100 text-sm">
                  End Meeting
                </p>
              </motion.div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-4">
                {/* Meeting Info */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-400 rounded-full flex items-center justify-center">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-sm">{meetingTitle}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <Clock className="h-3 w-3" />
                        <span>時間: {formatDuration(duration)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                      <Users className="h-4 w-4 text-gray-600 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">参加者</p>
                      <p className="text-lg font-bold text-gray-900">{participants.length + 2}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                      <Languages className="h-4 w-4 text-yellow-600 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">翻訳</p>
                      <p className="text-lg font-bold text-gray-900">{translationLogs.length}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                      <MessageSquare className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">チャット</p>
                      <p className="text-lg font-bold text-gray-900">{chatMessages.length}</p>
                    </div>
                  </div>
                </div>

                {/* Warning Message */}
                <div className="bg-amber-50 border-l-4 border-amber-400 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900 mb-1">
                        終了すると以下の処理が行われます
                      </p>
                      <ul className="text-xs text-amber-800 space-y-1">
                        <li>• ミーティング記録を自動保存</li>
                        <li>• Uri-TomoがAIサマリーを生成</li>
                        <li>• 議事録ページに移動します</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex gap-3">
              <Button
                onClick={() => setShowEndMeetingConfirm(false)}
                className="flex-1 px-6 py-3 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl font-semibold transition-all"
              >
                キャンセル
              </Button>
              <Button
                onClick={confirmEndMeeting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <PhoneOff className="h-4 w-4 mr-2 inline" />
                終了する
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

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
      <SystemSettingsModal
        isOpen={showSystemSettings}
        onClose={() => setShowSystemSettings(false)}
        systemLanguage={systemLanguage}
        onLanguageChange={setSystemLanguage}
      />
    </div>
  );
}

// --- Main Wrapper ---
export function ActiveMeeting() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { livekitToken, livekitUrl, participantName, initialMicOn, initialVideoOn, audioDeviceId, videoDeviceId, audioOutputDeviceId } = location.state || {};

  useEffect(() => {
    if (!livekitToken || !livekitUrl) {
      toast.error('接続情報がありません。');
      navigate(`/meeting-setup/${id}`);
    }
  }, [livekitToken, livekitUrl, navigate, id]);

  if (!livekitToken || !livekitUrl) return null;

  return (
    <LiveKitRoom
      token={livekitToken}
      serverUrl={livekitUrl}
      video={initialVideoOn ? { deviceId: videoDeviceId } : false}
      audio={initialMicOn ? { deviceId: audioDeviceId } : false}
      onDisconnected={() => navigate('/')}
      className="h-screen w-full bg-gray-900"
    >
      <ActiveMeetingContent
        meetingId={id || ''}
        currentUserProp={{ name: participantName || 'Me', language: 'ja' }}
        devices={{ audioInputId: audioDeviceId, videoInputId: videoDeviceId, audioOutputId: audioOutputDeviceId }}
        initialSettings={{ isMicOn: initialMicOn, isVideoOn: initialVideoOn }}
      />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}