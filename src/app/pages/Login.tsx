import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Globe, User, Bot } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { authApi } from '../api/auth';
import { toast } from 'sonner';
import { useGoogleLogin } from '@react-oauth/google';

interface LoginProps {
  onLogin: (email: string) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [language, setLanguage] = useState<'ja' | 'ko' | 'en'>('ja');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showFindAccount, setShowFindAccount] = useState(false);
  const [newAccountEmail, setNewAccountEmail] = useState('');
  const [newAccountPassword, setNewAccountPassword] = useState('');
  const [newAccountConfirmPassword, setNewAccountConfirmPassword] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [findAccountEmail, setFindAccountEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 백엔드에 일반 로그인 API가 없으므로 알림 처리
    toast.info("現在、Googleログインのみサポートしています。\n(Currently only Google Login is supported)");
    
    /* // 기존 코드
    if (email) {
      onLogin(email);
    }
    */
  };

  const handleSocialLogin = async (provider: string) => {
    // 1. 구글 외의 제공자는 미구현 처리
    if (provider !== 'google') {
      toast.info(`${provider} ログインは準備中です。\n(${provider} login is coming soon)`);
      return;
    }

    try {
      // 2. [중요] 실제로는 여기서 Google SDK(또는 라이브러리)를 통해 ID Token을 받아와야 합니다.
      // 현재는 테스트를 위해 가상의 토큰이나, 개발자 도구에서 하드코딩된 토큰을 사용한다고 가정합니다.
      // 실제 구현 시: const { token } = await googleLogin(); 
      const googleIdToken = "GOOGLE_ID_TOKEN_FROM_SDK"; // ★ 여기에 실제 구글 토큰이 들어와야 함

      console.log('백엔드로 로그인 요청 전송 중...');
      
      // 3. 백엔드 API 호출 (auth.ts 사용)
      const response = await authApi.loginWithGoogle(googleIdToken);
      
      console.log('로그인 성공:', response);

      // 4. 받아온 토큰과 유저 정보를 로컬 스토리지에 저장 (새로고침 시 유지용)
      localStorage.setItem('uri-tomo-token', response.access_token);
      localStorage.setItem('uri-tomo-user-profile', JSON.stringify({
        name: response.user.display_name,
        email: response.user.email,
        avatar: response.user.picture,
        locale: response.user.locale
      }));

      // 5. 성공 메시지 및 상위 컴포넌트에 로그인 알림
      toast.success(`${response.user.display_name}さん、ようこそ！`);
      onLogin(response.user.email);

    } catch (error) {
      console.error('Login Failed:', error);
      // 에러 메시지는 authApi 내부 인터셉터에서 toast로 보여주므로 여기서는 로깅만 함
    }
  };

  // Google Login Hook 설정
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      // 구글에서 성공적으로 토큰을 받아오면 실행됨
      // tokenResponse.access_token 또는 id_token을 사용
      console.log("Google Token Received:", tokenResponse);
      
      // API 호출 로직
      try {
        const response = await authApi.loginWithGoogle(tokenResponse.access_token);
        localStorage.setItem('uri-tomo-token', response.access_token);
        localStorage.setItem('uri-tomo-user-profile', JSON.stringify({
          name: response.user.display_name,
          email: response.user.email,
          avatar: response.user.picture,
          locale: response.user.locale
        }));
        toast.success(`${response.user.display_name}さん、ようこそ！`);
        onLogin(response.user.email);
      } catch (e) {
        console.error('Google Login Failed:', e);
      }
    },
    onError: () => toast.error('Google Login Failed'),
  });

  const translations = {
    ja: {
      welcome: 'Welcome to',
      subtitle: 'あなたのフレンドリーなAIチームメイト',
      email: 'Email',
      password: 'Password',
      login: 'Login',
      createAccount: 'Create account',
      findAccount: 'Find account',
      or: 'または',
      socialLogin: 'Google, Line, Kakao でログイン',
      description: '日韓バイリンガルミーティングのための',
      description2: 'リアルタイム翻訳AIツール',
      name: '名前',
      confirmPassword: 'パスワード確認',
      createAccountTitle: 'アカウント作成',
      findAccountTitle: 'アカウントを探す',
      cancel: 'キャンセル',
      create: '作成',
      send: '送信',
      findAccountDesc: 'アカウントに登録されているメールアドレスを入力してください。パスワードリセット用のリンクを送信します。',
      passwordMatch: 'パスワードが一致しません',
      accountCreated: 'アカウントが作成されました！',
      resetLinkSent: 'パスワードリセットリンクを送信しました',
    },
    ko: {
      welcome: '환영합니다',
      subtitle: '당신의 친근한 AI 팀메이트',
      email: '이메일',
      password: '비밀번호',
      login: '로그인',
      createAccount: '계정 만들기',
      findAccount: '계정 찾기',
      or: '또는',
      socialLogin: 'Google, Line, Kakao로 로그인',
      description: '한일 바이링구얼 미팅을 위한',
      description2: '실시간 번역 AI 도구',
      name: '이름',
      confirmPassword: '비밀번호 확인',
      createAccountTitle: '계정 만들기',
      findAccountTitle: '계정 찾기',
      cancel: '취소',
      create: '만들기',
      send: '보내기',
      findAccountDesc: '계정에 등록된 이메일 주소를 입력하세요. 비밀번호 재설정 링크를 보내드립니다.',
      passwordMatch: '비밀번호가 일치하지 않습니다',
      accountCreated: '계정이 생성되었습니다！',
      resetLinkSent: '비밀번호 재설정 링크를 보냈습니다',
    },
    en: {
      welcome: 'Welcome to',
      subtitle: 'Your Friendly AI Teammate',
      email: 'Email',
      password: 'Password',
      login: 'Login',
      createAccount: 'Create account',
      findAccount: 'Find account',
      or: 'or',
      socialLogin: 'Login with Google, Line, Kakao',
      description: 'Real-time Translation AI Tool',
      description2: 'for Japanese-Korean Bilingual Meetings',
      name: 'Name',
      confirmPassword: 'Confirm Password',
      createAccountTitle: 'Create Account',
      findAccountTitle: 'Find Account',
      cancel: 'Cancel',
      create: 'Create',
      send: 'Send',
      findAccountDesc: 'Enter your registered email address. We will send you a password reset link.',
      passwordMatch: 'Passwords do not match',
      accountCreated: 'Account created successfully!',
      resetLinkSent: 'Password reset link sent',
    },
  };

  const t = translations[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent"
            >
              URI-TOMO
            </motion.div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                >
                  <Globe className="h-6 w-6 text-gray-600" />
                </button>
                {showLanguageMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 top-full mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden"
                  >
                    <button
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                        language === 'ja' ? 'bg-yellow-50 font-semibold' : ''
                      }`}
                      onClick={() => {
                        setLanguage('ja');
                        setShowLanguageMenu(false);
                      }}
                    >
                      🇯🇵 日本語
                    </button>
                    <button
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                        language === 'ko' ? 'bg-yellow-50 font-semibold' : ''
                      }`}
                      onClick={() => {
                        setLanguage('ko');
                        setShowLanguageMenu(false);
                      }}
                    >
                      🇰🇷 한국어
                    </button>
                    <button
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                        language === 'en' ? 'bg-yellow-50 font-semibold' : ''
                      }`}
                      onClick={() => {
                        setLanguage('en');
                        setShowLanguageMenu(false);
                      }}
                    >
                      🇺🇸 English
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-5xl font-bold mb-4"
          >
            {t.welcome}
          </motion.h1>
          <motion.h2
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-6xl font-bold bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent mb-2"
          >
            URI-TOMO
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-gray-600 text-lg"
          >
            {t.subtitle}
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card className="p-8 shadow-2xl border-2 border-yellow-200">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">
                  {t.email}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your-email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-yellow-400 focus:ring-yellow-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">
                  {t.password}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-yellow-400 focus:ring-yellow-400"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 text-white font-semibold py-3 shadow-lg"
              >
                {t.login}
              </Button>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreatingAccount(true)}
                  className="border-2 border-yellow-300 hover:bg-yellow-50 text-gray-700 font-medium"
                >
                  {t.createAccount}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFindAccount(true)}
                  className="border-2 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium"
                >
                  {t.findAccount}
                </Button>
              </div>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">{t.or}</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => googleLogin()} // handleSocialLogin('google')}
                  className="flex items-center justify-center px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-all"
                >
                  <svg className="h-6 w-6" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSocialLogin('line')}
                  className="flex items-center justify-center px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-all"
                >
                  <svg className="h-6 w-6" viewBox="0 0 24 24">
                    <path
                      fill="#00B900"
                      d="M12 2C6.48 2 2 5.88 2 10.67c0 4.23 3.76 7.77 8.84 8.51.34.07.81.23.93.52.1.26.07.67.03.94l-.15.91c-.05.28-.22 1.09.95.59 1.18-.49 6.35-3.74 8.67-6.4C22.73 13.88 24 12.39 24 10.67 24 5.88 19.52 2 12 2z"
                    />
                  </svg>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSocialLogin('kakao')}
                  className="flex items-center justify-center px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-all"
                >
                  <svg className="h-6 w-6" viewBox="0 0 24 24">
                    <path
                      fill="#FEE500"
                      d="M12 2C6.48 2 2 5.58 2 10c0 2.89 1.97 5.43 4.93 6.91-.2.74-.64 2.38-.73 2.75-.11.46.17.45.36.33.15-.1 2.48-1.66 3.55-2.37.61.08 1.24.13 1.89.13 5.52 0 10-3.58 10-8S17.52 2 12 2z"
                    />
                    <path
                      fill="#3C1E1E"
                      d="M8.5 11.5h2v1h-2v-1zm3.5 0h2v1h-2v-1z"
                    />
                  </svg>
                </motion.button>
              </div>

              <p className="mt-4 text-center text-sm text-gray-500">
                {t.socialLogin}
              </p>
            </div>
          </Card>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-8 text-center text-sm text-gray-600"
        >
          {t.description}
          <br />
          {t.description2}
        </motion.p>
      </main>

      {/* Create Account Modal */}
      {isCreatingAccount && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsCreatingAccount(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 20 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-400 to-amber-400 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">{t.createAccountTitle}</h2>
                  <p className="text-yellow-100 text-xs">{t.createAccount}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <Label htmlFor="newName" className="text-sm font-semibold text-gray-700 mb-2 block">
                  {t.name}
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="newName"
                    type="text"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    placeholder={language === 'ja' ? '山田太郎' : language === 'ko' ? '홍길동' : 'John Doe'}
                    className="pl-10 focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="newEmail" className="text-sm font-semibold text-gray-700 mb-2 block">
                  {t.email}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="newEmail"
                    type="email"
                    value={newAccountEmail}
                    onChange={(e) => setNewAccountEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="pl-10 focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="newPassword" className="text-sm font-semibold text-gray-700 mb-2 block">
                  {t.password}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="newPassword"
                    type="password"
                    value={newAccountPassword}
                    onChange={(e) => setNewAccountPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700 mb-2 block">
                  {t.confirmPassword}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={newAccountConfirmPassword}
                    onChange={(e) => setNewAccountConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                {newAccountPassword && newAccountConfirmPassword && newAccountPassword !== newAccountConfirmPassword && (
                  <p className="text-xs text-red-500 mt-1">{t.passwordMatch}</p>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-2">
                  <Bot className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-600">
                      {language === 'ja' && 'アカウントを作成すると、Uri-Tomoの日韓翻訳機能をフルに活用できます！'}
                      {language === 'ko' && '계정을 만들면 Uri-Tomo의 한일 번역 기능을 완전히 활용할 수 있습니다!'}
                      {language === 'en' && 'Create an account to fully utilize Uri-Tomo\'s Japanese-Korean translation features!'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsCreatingAccount(false);
                  setNewAccountEmail('');
                  setNewAccountPassword('');
                  setNewAccountConfirmPassword('');
                  setNewAccountName('');
                }}
                className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                {t.cancel}
              </Button>
              <Button
                onClick={() => {
                  if (newAccountEmail && newAccountPassword && newAccountPassword === newAccountConfirmPassword) {
                    onLogin(newAccountEmail);
                  }
                }}
                disabled={!newAccountEmail || !newAccountPassword || newAccountPassword !== newAccountConfirmPassword}
                className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.create}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Find Account Modal */}
      {showFindAccount && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowFindAccount(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 20 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-600 to-gray-700 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <Mail className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">{t.findAccountTitle}</h2>
                  <p className="text-gray-200 text-xs">{t.findAccount}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                {t.findAccountDesc}
              </p>

              <div>
                <Label htmlFor="findEmail" className="text-sm font-semibold text-gray-700 mb-2 block">
                  {t.email}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="findEmail"
                    type="email"
                    value={findAccountEmail}
                    onChange={(e) => setFindAccountEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="pl-10 focus:ring-2 focus:ring-gray-400"
                  />
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <Bot className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-600">
                      {language === 'ja' && 'パスワードリセット用のリンクをメールで送信します。メールをご確認ください。'}
                      {language === 'ko' && '비밀번호 재설정 링크를 이메일로 보내드립니다. 이메일을 확인하세요.'}
                      {language === 'en' && 'We will send a password reset link to your email. Please check your inbox.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowFindAccount(false);
                  setFindAccountEmail('');
                }}
                className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                {t.cancel}
              </Button>
              <Button
                onClick={() => {
                  if (findAccountEmail) {
                    alert(t.resetLinkSent);
                    setShowFindAccount(false);
                    setFindAccountEmail('');
                  }
                }}
                disabled={!findAccountEmail}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.send}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}