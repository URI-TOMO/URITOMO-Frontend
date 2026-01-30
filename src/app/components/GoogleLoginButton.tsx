import { authApi } from '@/app/api/auth';
import { useState } from 'react';

/**
 * Google ログインコンポーネント（テスト用）
 */
export function GoogleLoginButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTestLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // テスト用トークンでログイン
      const testToken = import.meta.env.VITE_TEST_TOKEN || 'test-token';
      const response = await authApi.googleLogin(testToken);

      // アクセストークンをローカルストレージに保存
      localStorage.setItem('uri-tomo-token', response.access_token);

      // ユーザー情報を表示
      console.log('ログイン成功:', response.user);

      // ホームページにリダイレクト
      window.location.href = '/home';
    } catch (err) {
      setError((err as any).message || 'ログインに失敗しました');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={handleTestLogin} 
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        {isLoading ? 'ログイン中...' : 'テストログイン'}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}
