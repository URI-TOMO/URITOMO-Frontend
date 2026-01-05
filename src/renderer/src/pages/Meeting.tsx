import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';

export default function Meeting() {
  const navigate = useNavigate();
  
  const [token, setToken] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  
  // [수정 1] 사용하지 않는 set 함수 제거 (경고 해결)
  // const [participantName] = useState(...) 형식을 사용하여 상태값만 가져옵니다.
  const [participantName] = useState('User-' + Math.floor(Math.random() * 1000));
  const [roomName] = useState('MyMeetingRoom');
  
  // [추가] 오류 메시지 상태
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const initSession = async () => {
      try {
        console.log("토큰 요청 시작..."); // [디버깅용 로그]
        const data = await window.api.livekit.getToken(roomName, participantName);
        console.log("토큰 수신 완료:", data); // [디버깅용 로그]
        
        setToken(data.token);
        setServerUrl(data.url);
      } catch (error: any) {
        console.error('Failed to get token:', error);
        // 화면에 오류 메시지 표시
        setErrorMsg(`토큰 오류: ${error.message || JSON.stringify(error)}`);
      }
    };

    initSession();
  }, []); // 의존성 배열 비움 (한 번만 실행)

  const handleDisconnect = async () => {
    setToken('');
    await window.api.app.resizeWindow(400, 600);
    navigate('/');
  };

  // 오류 발생 시 화면 표시
  if (errorMsg) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-red-500 gap-4">
        <h2 className="text-xl font-bold">오류가 발생했습니다</h2>
        <p className="bg-black p-4 rounded border border-red-700">{errorMsg}</p>
        <button 
          onClick={() => navigate('/')}
          className="bg-white text-black px-4 py-2 rounded"
        >
          돌아가기
        </button>
      </div>
    );
  }

  if (!token || !serverUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        <p>회의실 연결 중...</p>
        <p className="text-gray-500 text-sm">Main Process 응답 대기 중</p>
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={serverUrl}
      data-lk-theme="default"
      style={{ height: '100vh' }}
      onDisconnected={handleDisconnect}
    >
      <VideoConference /> 
    </LiveKitRoom>
  );
}