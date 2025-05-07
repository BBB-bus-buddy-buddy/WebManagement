// components/Header.js
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Layout.css';

function Header({ user, onLogout }) {
  return (
    <header className="header">
      <Link to="/dashboard" className="header-title">버스 관리 시스템</Link>
      <div className="user-info">
        <span>{user?.name} 님</span>
        <Link to="/profile">내 정보</Link>
        <button onClick={onLogout} className="logout-button">로그아웃</button>
      </div>
    </header>
  );
}

export default Header;