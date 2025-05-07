// components/Sidebar.js
import React from 'react';
import { NavLink } from 'react-router-dom';
import '../styles/Layout.css';

function Sidebar() {
  return (
    <div className="sidebar">
      <div className="logo">
        <h2>버스 관리</h2>
      </div>
      <nav className="nav-menu">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
          대시보드
        </NavLink>
        <NavLink to="/drivers" className={({ isActive }) => isActive ? 'active' : ''}>
          버스 기사 관리
        </NavLink>
        <NavLink to="/users" className={({ isActive }) => isActive ? 'active' : ''}>
          이용자 관리
        </NavLink>
        <NavLink to="/buses" className={({ isActive }) => isActive ? 'active' : ''}>
          버스 관리
        </NavLink>
        <NavLink to="/routes" className={({ isActive }) => isActive ? 'active' : ''}>
          노선 관리
        </NavLink>
        <NavLink to="/schedule" className={({ isActive }) => isActive ? 'active' : ''}>
          버스 기사 배치표
        </NavLink>
        <NavLink to="/operations" className={({ isActive }) => isActive ? 'active' : ''}>
          통계
        </NavLink>
        <NavLink to="/stations" className={({ isActive }) => isActive ? 'active' : ''}>
          정류장 관리
        </NavLink>
        <NavLink to="/statistics" className={({ isActive }) => isActive ? 'active' : ''}>
          탑승객 통계
        </NavLink>
      </nav>
    </div>
  );
}

export default Sidebar;