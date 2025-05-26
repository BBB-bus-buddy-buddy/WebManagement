// components/Header.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ApiService from '../services/api';
import '../styles/Layout.css';

function Header({ user, onLogout }) {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      // 모든 쿠키와 세션 데이터 삭제
      ApiService.logout();
      
      // App 컴포넌트로부터 전달받은 onLogout 콜백 호출
      if (onLogout) {
        onLogout();
      } else {
        // 콜백이 없는 경우 직접 리다이렉트
        navigate('/login');
      }
    }
  };

  return (
    <header className="header">
      <Link to="/dashboard" className="header-title">버스 관리 시스템</Link>
      <div className="user-info">
        <span>{user?.name || user?.organizationId} 님</span>
        <Link to="/profile">내 정보</Link>
        <button onClick={handleLogout} className="logout-button">로그아웃</button>
      </div>
    </header>
  );
}

export default Header;