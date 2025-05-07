// components/Login.js (수정됨)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // 더미 인증
    if (username === 'admin' && password === 'password') {
      const userData = {
        id: 1,
        username: 'admin',
        name: '관리자',
        email: 'admin@busadmin.com',
        role: 'Administrator'
      };
      onLogin(userData);
      navigate('/dashboard');
    } else {
      setError('아이디 또는 비밀번호가 일치하지 않습니다.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-container">
        <h1>버스 관리 시스템</h1>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">아이디</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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