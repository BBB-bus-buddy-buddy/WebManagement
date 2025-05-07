// App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import Register from './components/Register';

// 스타일 임포트
import './styles/AppLayout.css';
import './styles/Login.css';
import './styles/Layout.css';
import './styles/Dashboard.css';
import './styles/Management.css';
import './styles/Schedule.css';
import './styles/BusOperation.css';
import './styles/PassengerStats.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <Router>
      <div className="app">
        {isLoggedIn ? (
          <>
            <Sidebar />
            <div className="content">
              <Header user={user} onLogout={handleLogout} />
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
                  <Route path="/profile" element={<UserProfile user={user} />} />
                  <Route path="/statistics" element={<PassengerStats />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </div>
            </div>
          </>
        ) : (
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;