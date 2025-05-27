// components/Header.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ApiService from '../services/api';
import '../styles/Layout.css';

function Header({ user, onLogout }) {
  const navigate = useNavigate();
  const [organizationName, setOrganizationName] = useState('버스 관리 시스템'); // 기본값 설정

  // 컴포넌트 마운트 시 조직 정보 가져오기
  useEffect(() => {
    fetchOrganizationInfo();
  }, [user]);

  // 조직 정보 가져오기
  const fetchOrganizationInfo = async () => {
    try {
      if (user?.organizationId) {
        // 사용자의 조직 ID가 있는 경우 해당 조직 정보 확인
        const response = await ApiService.verifyOrganization(user.organizationId);
        
        if (response && response.data && response.data.name) {
          setOrganizationName(response.data.name);
        } else {
          // 조직명을 찾을 수 없는 경우 조직 ID 그대로 표시
          setOrganizationName(user.organizationId);
        }
      } else {
        // 현재 로그인한 사용자의 조직 정보 가져오기
        const response = await ApiService.getCurrentOrganization();
        
        if (response && response.data && response.data.name) {
          setOrganizationName(response.data.name);
        }
      }
    } catch (error) {
      console.error('조직 정보 조회 실패:', error);
      // 오류 발생 시 기본값 사용 (기본값이 이미 설정되어 있음)
      if (user?.organizationId) {
        setOrganizationName(user.organizationId);
      }
      // 오류 시에도 기본 "버스 관리 시스템" 유지
    }
  };

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
      <Link to="/dashboard" className="header-title">
        {organizationName}
      </Link>
      <div className="header-info">
        <span className="user-info">
          {user?.name && (
            <span className="user-name">{user.name} 님</span>
          )}
        </span>
        <Link to="/profile">내 정보</Link>
        <button onClick={handleLogout} className="logout-button">로그아웃</button>
      </div>
    </header>
  );
}

export default Header;