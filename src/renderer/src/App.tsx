import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Meeting from './pages/Meeting';

function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      const token = await window.api.auth.getToken();
      if (token) {
        setIsAuthenticated(true);
        await window.api.app.resizeWindow(1200, 800); // 메인 크기
      } else {
        setIsAuthenticated(false);
        await window.api.app.resizeWindow(400, 600); // 로그인 크기
      }
      setIsLoading(false);
    };
    initApp();
  }, []);

  if (isLoading) return <div className="text-center mt-10">Loading...</div>;

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/meeting" /> : <Login />} />
      <Route path="/meeting" element={<Meeting />} />
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}