import { useState, useEffect } from "react";
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Login } from "./pages/Login";
import { Home } from "./pages/Home";
import { MeetingRoom } from "./pages/MeetingRoom";
import { MeetingSetup } from "./pages/MeetingSetup";
import { ActiveMeeting } from "./pages/ActiveMeeting";
import { Minutes } from "./pages/Minutes";
import { DirectChat } from "./pages/DirectChat";
import { Chat } from "./pages/Chat";
import { Layout } from "./components/Layout";
import { Toaster } from "./components/ui/sonner";
import { useRoomInviteSSE } from "./hooks/useRoomInviteSSE";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useRoomInviteSSE({ enabled: isLoggedIn });

  useEffect(() => {
    // Check if session is active (persists on refresh, clears on close)
    const sessionActive = sessionStorage.getItem("uri-tomo-session-active");
    const userEmail = localStorage.getItem("uri-tomo-user");

    if (sessionActive === "true" && userEmail) {
      setIsLoggedIn(true);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (email: string) => {
    localStorage.setItem("uri-tomo-user", email);
    sessionStorage.setItem("uri-tomo-session-active", "true");
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("uri-tomo-user");
    sessionStorage.removeItem("uri-tomo-session-active");
    setIsLoggedIn(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      {!isLoggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Routes>
          <Route element={<Layout onLogout={handleLogout} />}>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/chat/:contactId" element={<Chat />} />
            <Route
              path="/direct-chat/:contactId"
              element={<DirectChat />}
            />
            <Route
              path="/meeting/:id"
              element={<MeetingRoom />}
            />
            <Route path="/minutes/:id" element={<Minutes />} />
            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />
          </Route>
          {/* Meeting Setup - Full Screen without Sidebar */}
          <Route
            path="/meeting-setup/:id"
            element={<MeetingSetup />}
          />
          {/* Active Meeting - Full Screen without Sidebar */}
          <Route
            path="/active-meeting/:id"
            element={<ActiveMeeting />}
          />
        </Routes>
      )}
      <Toaster />
    </HashRouter>
  );
}
