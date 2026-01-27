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

      // [국적/언어 설정 반영]
      let currentLang = language;
      // Check for various possible property names from backend
      const userLang = profile.lang || profile.language || profile.country || profile.locale;

      if (userLang) {
        const normalizedLang = String(userLang).toLowerCase();
        if (['jp', 'ja', 'japan'].includes(normalizedLang)) {
          setSystemLanguage('ja');
          currentLang = 'ja';
        } else if (['kr', 'ko', 'korea'].includes(normalizedLang)) {
          setSystemLanguage('ko');
          currentLang = 'ko';
        } else if (['en', 'us', 'usa'].includes(normalizedLang)) {
          setSystemLanguage('en');
          currentLang = 'en';
        }
      }

      // 2. 환영 메시지 (다국어 처리)
      // Logic adjusted to use translation keys roughly
      let welcomePrefix = '';
      let welcomeSuffix = '';
      if (currentLang === 'ja') {
        welcomeSuffix = 'さん、ようこそ！';
      } else if (currentLang === 'ko') {
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

  // 소셜 로그인 핸들러 -> 게스트 로그인으로 변경
  const handleSocialLogin = async (provider: string) => {
    console.log(`Provider: ${provider} - Processing Guest Login`);

    // 게스트 정보 설정
    const guestCredentials = {
      email: 'guest@guest.com',
      password: 'guest'
    };

    try {
      toast.loading(t('processingGuestLogin') || '게스트 정보로 로그인 중...', { id: 'guest-login' });

      // 게스트 선호 언어: English
      setSystemLanguage('en');

      // 게스트 정보로 로그인 시도
      const response = await authApi.login(guestCredentials);
      await handleAuthSuccess(response);

      toast.dismiss('guest-login');
    } catch (error) {
      console.error('Guest Login Error:', error);
      toast.dismiss('guest-login');
      // 에러 메시지는 apiClient 인터셉터에서 toast로 출력됨
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
                  onClick={() => setIsCreatingAccount(true)}
                  className="w-full bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 text-white font-semibold py-3 shadow-lg"
                >
                  {t('createAccount')}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowFindAccount(true)}
                  className="w-full bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 text-white font-semibold py-3 shadow-lg"
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
              <div className="mt-6 flex justify-center gap-4">
                {/* Google Button (Now performs Guest Login) */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSocialLogin('google')}
                  className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-gray-100 rounded-lg bg-white shadow-sm hover:bg-gray-50 transition-all max-w-[140px]"
                  title="Guest Login with Google design"
                >
                  <svg className="h-6 w-6" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                    <path fill="#1976D2" d="M43.611,20.083L43.611,20.083L42,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                  </svg>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSocialLogin('line')}
                  className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-green-400 rounded-lg shadow-md hover:bg-green-50 transition-all bg-green-50/30 max-w-[140px]"
                  title="Click for Guest Login"
                >
                  <svg className="h-6 w-6" viewBox="0 0 24 24">
                    <path
                      fill="#00B900"
                      d="M12 2C6.48 2 2 5.88 2 10.67c0 4.23 3.76 7.77 8.84 8.51.34.07.81.23.93.52.1.26.07.67.03.94l-.15.91c-.05.28-.22 1.09.95.59 1.18-.49 6.35-3.74 8.67-6.4C22.73 13.88 24 12.39 24 10.67 24 5.88 19.52 2 12 2z"
                    />
                  </svg>
                </motion.button>
              </div>

              {/* Developer Bypass Button */}
              <div className="mt-4 flex justify-center">
                <button
                  onClick={async () => {
                    const devResponse = {
                      access_token: 'dev-bypass-token',
                      user: {
                        id: 'dev-user-id',
                        name: 'Developer',
                        email: 'dev@local',
                        display_name: 'Dev User',
                        picture: '',
                        lang: 'en'
                      }
                    };

                    await handleAuthSuccess(devResponse);
                    toast.success('Developer Mode Login (English Test)');
                  }}
                  className="text-[10px] text-gray-300 hover:text-gray-400 transition-colors cursor-pointer"
                  title="Dev Bypass"
                >
                  (Dev)
                </button>
              </div>

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