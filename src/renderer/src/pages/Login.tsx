import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    // 더미 토큰 저장 (테스트용)
    await window.api.auth.saveToken('dummy-token-12345');
    // 메인 화면 크기로 변경 (1200x800)
    await window.api.app.resizeWindow(1200, 800);
    navigate('/meeting');
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <button onClick={handleLogin} className="bg-blue-600 text-white px-6 py-2 rounded">
        Enter the meeting
      </button>
    </div>
  );
}