// App.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import ApiService from './services/api'; // ApiService 임포트 추가
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import BusDriverManagement from './components/BusDriverManagement';
import UserManagement from './components/UserManagement';
import BusManagement from './components/BusManagement';
import RouteManagement from './components/RouteManagement';
import BusSchedule from './components/BusSchedule';
import BusOperationInfo from './components/BusOperationInfo';
import StationManagement from './components/StationManagement';
import UserProfile from './components/UserProfile';
import PassengerStats from './components/PassengerStats';

// 스타일 임포트
import './styles/AppLayout.css';
import './styles/Login.css';
import './styles/Layout.css';
import './styles/Dashboard.css';
import './styles/Management.css';
import './styles/Schedule.css';
import './styles/BusOperation.css';
import './styles/PassengerStats.css';

// useNavigate 훅을 사용하기 위한 래퍼 컴포넌트
function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  useEffect(() => {
    // 컴포넌트가 마운트될 때 로컬 스토리지에서 사용자 정보 확인
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser) {
        setIsLoggedIn(true);
        console.log('로컬 스토리지에서 사용자 정보 가져오기:', parsedUser); // 디버깅용 로그
      }
    }
  }, []);

  const handleLogout = () => {
    // 로그아웃 처리는 Header 컴포넌트에서 이미 수행됨
    // 여기서는 상태만 업데이트
    setIsLoggedIn(false);
    localStorage.removeItem('user');
    
    // 로그인 페이지로 리다이렉트
    navigate('/login');
  };

  return (
    <div className="app">
      {isLoggedIn ? (
        <>
          <Sidebar />
          <div className="content">
            <Header onLogout={handleLogout} />
            <div className="page-content">
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/drivers" element={<BusDriverManagement />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/buses" element={<BusManagement />} />
                <Route path="/routes" element={<RouteManagement />} />
                <Route path="/schedule" element={<BusSchedule />} />
                <Route path="/operations" element={<BusOperationInfo />} />
                <Route path="/stations" element={<StationManagement />} />
                <Route path="/profile" element={<UserProfile/>} />
                <Route path="/statistics" element={<PassengerStats />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
          </div>
        </>
      ) : (
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </div>
  );
}

// 메인 App 컴포넌트
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;