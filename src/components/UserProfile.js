// components/UserProfile.js
import React, { useState } from 'react';
import '../styles/UserProfile.css';

function UserProfile({ user }) {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '관리자',
    email: user?.email || 'admin@busadmin.com',
    phone: user?.phoneNumber || '010-1234-5678',
    password: '',
    confirmPassword: '',
    // 추가된 필드
    birthDate: user?.birthDate || '1990-01-01',
    company: user?.company || '버스운영회사',
    companyCode: user?.companyCode || 'BUS2023',
    manager: user?.manager || '김담당',
    emergencyContact: user?.emergencyContact || '010-9876-5432'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // 실제 애플리케이션에서는 사용자 프로필을 업데이트하는 로직 추가
    console.log('Updated profile data:', formData);
    setEditMode(false);
  };

  return (
    <div className="user-profile">
      <h1>내 정보 관리</h1>
      <div className="profile-container">
        {!editMode ? (
          <div className="profile-details">
            <div className="profile-header">
              <img 
                src="/api/placeholder/150/150" 
                alt="프로필 이미지" 
                className="profile-image" 
              />
              <h2>{formData.name}</h2>
            </div>
            <div className="profile-field">
              <label>이름:</label>
              <span>{formData.name}</span>
            </div>
            <div className="profile-field">
              <label>이메일:</label>
              <span>{formData.email}</span>
            </div>
            <div className="profile-field">
              <label>전화번호:</label>
              <span>{formData.phone}</span>
            </div>
            {/* 추가된 필드들 */}
            <div className="profile-field">
              <label>생년월일:</label>
              <span>{formData.birthDate}</span>
            </div>
            <div className="profile-field">
              <label>소속 회사:</label>
              <span>{formData.company}</span>
            </div>
            <div className="profile-field">
              <label>회사 코드:</label>
              <span>{formData.companyCode}</span>
            </div>
            <div className="profile-field">
              <label>담당자:</label>
              <span>{formData.manager}</span>
            </div>
            <div className="profile-field">
              <label>담당자 긴급 연락처:</label>
              <span>{formData.emergencyContact}</span>
            </div>
            <button onClick={() => setEditMode(true)} className="edit-button">
              정보 수정
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="profile-header">
              <img 
                src="/api/placeholder/150/150" 
                alt="프로필 이미지" 
                className="profile-image" 
              />
            </div>
            <div className="form-group">
              <label htmlFor="name">이름</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">이메일</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">전화번호</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            {/* 추가된 필드들 */}
            <div className="form-group">
              <label htmlFor="birthDate">생년월일</label>
              <input
                type="date"
                id="birthDate"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="company">소속 회사</label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="companyCode">회사 코드</label>
              <input
                type="text"
                id="companyCode"
                name="companyCode"
                value={formData.companyCode}
                onChange={handleChange}
                readOnly // 회사 코드는 일반적으로 변경할 수 없음
                className="readonly-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="manager">담당자</label>
              <input
                type="text"
                id="manager"
                name="manager"
                value={formData.manager}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="emergencyContact">담당자 긴급 연락처</label>
              <input
                type="tel"
                id="emergencyContact"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleChange}
                placeholder="010-0000-0000"
              />
            </div>
            <div className="form-divider"></div>
            <div className="form-section-title">비밀번호 변경</div>
            <div className="form-group">
              <label htmlFor="password">새 비밀번호</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">비밀번호 확인</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="save-button">저장</button>
              <button 
                type="button" 
                className="cancel-button"
                onClick={() => setEditMode(false)}
              >
                취소
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default UserProfile;