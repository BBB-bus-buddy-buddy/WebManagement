// components/Logout.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/api';

function Logout({ onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      // ApiService의 logout 메서드 호출
      const success = ApiService.logout();
      
      if (success) {
        // 로그아웃 상태를 앱에 알림
        if (onLogout) {
          onLogout();
        }
        
        // 로그인 페이지로 리다이렉트
        navigate('/login');
      } else {
        alert('로그아웃 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  };

  return (
    <button className="logout-button" onClick={handleLogout}>
      로그아웃
    </button>
  );
}

export default Logout;