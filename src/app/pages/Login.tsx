import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Globe, User, Bot } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { authApi } from '../api/auth';
import { useTranslation } from '../hooks/useTranslation';

interface LoginProps {
  onLogin: (email: string) => void;
}

export function Login({ onLogin }: LoginProps) {
  const { t, language, setSystemLanguage } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showFindAccount, setShowFindAccount] = useState(false);

  // 회원가입용 State
  const [newAccountEmail, setNewAccountEmail] = useState('');
  const [newAccountPassword, setNewAccountPassword] = useState('');
  const [newAccountConfirmPassword, setNewAccountConfirmPassword] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [signupLanguage, setSignupLanguage] = useState<'ja' | 'ko' | 'en'>('ja');

  // 계정 찾기용 State
  const [findAccountEmail, setFindAccountEmail] = useState('');

  // 공통: 로그인 성공 처리 핸들러
  const handleAuthSuccess = async (response: any) => {
    // 1. 토큰 저장
    localStorage.setItem('uri-tomo-token', response.access_token);

    let profile = response.user;

    // 만약 응답에 user 정보가 없고 user_id만 있는 경우, /me 호출하여 가져옴
    // 만약 응답에 user 정보가 없고 user_id만 있는 경우, fallback 프로필 생성
    if (!profile && response.user_id) {
      profile = {
        id: response.user_id,
        email: email || newAccountEmail || 'user@uri-tomo.local',
        display_name: email?.split('@')[0] || newAccountEmail?.split('@')[0] || 'User'
      };
    }

    if (profile) {
      const userName = profile.name || profile.display_name;
      localStorage.setItem('uri-tomo-user-profile', JSON.stringify({
        name: userName,
        email: profile.email,
        avatar: profile.picture
      }));

      // 2. 환영 메시지 (다국어 처리)
      // Logic adjusted to use translation keys roughly
      let welcomePrefix = '';
      let welcomeSuffix = '';
      if (language === 'ja') {
        welcomeSuffix = 'さん、ようこそ！';
      } else if (language === 'ko') {
        welcomeSuffix = '님 환영합니다!';
      } else {
        welcomePrefix = 'Welcome, ';
        welcomeSuffix = '!';
      }

      toast.success(`${welcomePrefix}${userName}${welcomeSuffix}`);

      // 3. 상위 컴포넌트에 알림
      onLogin(profile.email);
    }
  };

  // [수정됨] 일반 이메일 로그인 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      // 백엔드로 로그인 요청
      const response = await authApi.login({ email, password });
      await handleAuthSuccess(response);
    } catch (error) {
      console.error('Login Error:', error);
      // 에러 메시지는 apiClient 인터셉터에서 toast로 출력됨
    }
  };

  // [수정됨] 회원가입 핸들러
  const handleSignUp = async () => {
    if (!newAccountEmail || !newAccountPassword || newAccountPassword !== newAccountConfirmPassword) return;

    // 언어 코드 매핑
    const langMap = {
      ja: 'jp',
      ko: 'kr',
      en: 'en'
    };

    const signupData = {
      name: newAccountName,
      email: newAccountEmail,
      password: newAccountPassword,
      lang: langMap[signupLanguage] || 'jp'
    };

    try {
      const response = await authApi.signup(signupData);

      toast.success(t('accountCreated'));

      // 회원가입 성공 후 자동 로그인 처리
      await handleAuthSuccess(response);
      setIsCreatingAccount(false);

    } catch (error) {
      console.error('Sign Up Error:', error);
    }
  };

  // 소셜 로그인 핸들러
  const handleSocialLogin = async (provider: string) => {
    // Line 버튼을 누르면 게스트로 로그인
    if (provider === 'line') {
      toast.info(t('lineLoginComingSoon'));
      return;
    }
    if (provider === 'kakao' || provider === 'google') {
      // Placeholder for now
    }
  };

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
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${language === 'ja' ? 'bg-yellow-50 font-semibold' : ''
                        }`}
                      onClick={() => {
                        setSystemLanguage('ja');
                        setShowLanguageMenu(false);
                      }}
                    >
                      🇯🇵 日本語
                    </button>
                    <button
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${language === 'ko' ? 'bg-yellow-50 font-semibold' : ''
                        }`}
                      onClick={() => {
                        setSystemLanguage('ko');
                        setShowLanguageMenu(false);
                      }}
                    >
                      🇰🇷 한국어
                    </button>
                    <button
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${language === 'en' ? 'bg-yellow-50 font-semibold' : ''
                        }`}
                      onClick={() => {
                        setSystemLanguage('en');
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
            {t('welcome')}
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
            {t('subtitle')}
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card className="p-8 shadow-2xl border-2 border-yellow-200">
            {/* 일반 로그인 폼 */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">
                  {t('email')}
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
                  {t('password')}
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
                {t('login')}
              </Button>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreatingAccount(true)}
                  className="border-2 border-yellow-300 hover:bg-yellow-50 text-gray-700 font-medium"
                >
                  {t('createAccount')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFindAccount(true)}
                  className="border-2 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium"
                >
                  {t('findAccount')}
                </Button>
              </div>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">{t('or')}</span>
                </div>
              </div>

              {/* 소셜 로그인 버튼들 */}
              <div className="mt-6 grid grid-cols-3 gap-3">
                {/* 임시 플레이스홀더: 구글 버튼 자리를 비워두거나 회색 처리 */}
                <div className="flex items-center justify-center px-4 py-3 border-2 border-gray-100 rounded-lg bg-gray-50 opacity-50 cursor-not-allowed">
                  <span className="text-xs text-gray-400">{t('loginGoogleComingSoon')}</span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSocialLogin('line')}
                  className="flex items-center justify-center px-4 py-3 border-2 border-green-400 rounded-lg shadow-md hover:bg-green-50 transition-all bg-green-50/30"
                  title="Click for Guest Login"
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
                {t('socialLogin')}
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
          {t('loginDescription')}
          <br />
          {t('loginDescription2')}
        </motion.p>
      </main>

      {/* Create Account Modal (회원가입 모달) */}
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
                  <h2 className="text-white font-bold text-lg">{t('createAccountTitle')}</h2>
                  <p className="text-yellow-100 text-xs">{t('createAccount')}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <Label htmlFor="newName" className="text-sm font-semibold text-gray-700 mb-2 block">
                  {t('name')}
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
                  {t('email')}
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
                  {t('password')}
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
                  {t('confirmPassword')}
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
                  <p className="text-xs text-red-500 mt-1">{t('passwordMatch')}</p>
                )}
              </div>

              {/* Language Selection for Signup */}
              <div>
                <Label htmlFor="signupLang" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Preferred Language (언어 설정)
                </Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    id="signupLang"
                    value={signupLanguage}
                    onChange={(e) => setSignupLanguage(e.target.value as 'ja' | 'ko' | 'en')}
                    className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-yellow-400 border-gray-300 bg-white"
                  >
                    <option value="ja">🇯🇵 日本語</option>
                    <option value="ko">🇰🇷 한국어</option>
                    <option value="en">🇺🇸 English</option>
                  </select>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-2">
                  <Bot className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-600">
                      {t('createAccountInfo')}
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
                {t('cancel')}
              </Button>
              <Button
                onClick={handleSignUp}
                disabled={!newAccountEmail || !newAccountPassword || newAccountPassword !== newAccountConfirmPassword}
                className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('create')}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Find Account Modal (계정 찾기 모달 - 백엔드 미구현 상태이므로 기존 유지) */}
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
                  <h2 className="text-white font-bold text-lg">{t('findAccountTitle')}</h2>
                  <p className="text-gray-200 text-xs">{t('findAccount')}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                {t('findAccountDesc')}
              </p>

              <div>
                <Label htmlFor="findEmail" className="text-sm font-semibold text-gray-700 mb-2 block">
                  {t('email')}
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
                      {t('resetLinkInfo')}
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
                {t('cancel')}
              </Button>
              <Button
                onClick={() => {
                  if (findAccountEmail) {
                    // 백엔드 연결 전이므로 alert 유지
                    toast.success(t('resetLinkSent'));
                    setShowFindAccount(false);
                    setFindAccountEmail('');
                  }
                }}
                disabled={!findAccountEmail}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('send')}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}