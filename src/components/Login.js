// components/Login.js (수정됨)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/api';
import '../styles/Login.css';

function Login({ onLogin }) {
  const [organizationId, setOrganizationId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await ApiService.login(organizationId, password);
      
      // 서버에서 반환된 응답 로그 출력
      console.log('로그인 응답:', response);
      
      const { data } = response;
      
      // 토큰 로그 출력
      console.log('액세스 토큰:', data.token);
      
      // 사용자 정보 설정
      const userData = {
        name: data.name,
        organizationId: data.organizationId,
        token: data.token
      };
      
      onLogin(userData);
      navigate('/dashboard');
    } catch (err) {
      setError('아이디 또는 비밀번호가 일치하지 않습니다.');
      console.error('로그인 오류:', err);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-container">
        <h1>버스 관리 시스템</h1>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="organizationId">아이디</label>
            <input
              type="text"
              id="organizationId"
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              required
              placeholder="아이디를 입력하세요"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="비밀번호를 입력하세요"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="login-button">로그인</button>
        </form>
      </div>
    </div>
  );
}

export default Login;