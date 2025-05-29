// components/UserProfile.js
import React, { useEffect, useState } from 'react';
import '../styles/UserProfile.css';
import ApiService from '../services/api';

function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 조직 ID를 조직명으로 매핑하는 함수 (UserManagement.js 참고)
  const getOrganizationName = (orgId) => {
    // 기본 조직명 매핑 (알려진 조직들)
    const knownOrganizations = {
      "Uasidnw": "울산과학대학교",
      // 필요시 다른 조직 추가
    };
    
    return knownOrganizations[orgId] || orgId || '정보 없음';
  };

  useEffect(() => {
    // 컴포넌트가 마운트될 때 사용자 정보를 가져옵니다.
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        // 토큰에서 사용자 정보 추출
        const tokenUser = ApiService.getCurrentUserFromToken();
        
        console.log('토큰에서 추출된 사용자 정보:', tokenUser);
        
        if (tokenUser) {
          // API에서 가져올 데이터: 이름, 이메일, 소속 회사, 회사 코드
          const organizationName = getOrganizationName(tokenUser.organizationId);
          
          setUser({
            name: tokenUser.name || '관리자',
            email: tokenUser.email || 'admin@busadmin.com',
            company: organizationName,
            companyCode: tokenUser.organizationId || 'BUS2023'
          });
          console.log('설정된 사용자 정보:', {
            name: tokenUser.name,
            email: tokenUser.email,
            company: organizationName,
            companyCode: tokenUser.organizationId
          });
        } else {
          // 토큰이 없거나 유효하지 않은 경우 기본값 설정
          setUser({
            name: '관리자',
            email: 'admin@busadmin.com',
            company: '버스운영회사',
            companyCode: 'BUS2023'
          });
        }
      } catch (error) {
        console.error('사용자 정보 불러오기 실패:', error);
        setError('사용자 정보를 불러오는데 실패했습니다.');
        // 오류 발생 시에도 기본값 설정
        setUser({
          name: '관리자',
          email: 'admin@busadmin.com',
          company: '버스운영회사',
          companyCode: 'BUS2023'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, []);

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '010-1234-5678', // 더미데이터
    company: '',
    companyCode: '',
    // 더미데이터로 설정되는 필드들
    birthDate: '1990-01-01',
    manager: '김담당',
    emergencyContact: '010-9876-5432'
  });

  // user 정보가 로드되면 formData 업데이트
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name,
        email: user.email,
        company: user.company,
        companyCode: user.companyCode
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 실제 애플리케이션에서는 사용자 프로필을 업데이트하는 API 호출
      console.log('Updated profile data:', formData);
      
      // TODO: API 호출로 프로필 업데이트
      // await ApiService.updateUserProfile(formData);
      
      setEditMode(false);
      alert('프로필이 성공적으로 업데이트되었습니다.');
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      alert('프로필 업데이트에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="user-profile">
        <h1>내 정보 관리</h1>
        <div className="profile-container">
          <div className="loading">사용자 정보를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-profile">
        <h1>내 정보 관리</h1>
        <div className="profile-container">
          <div className="error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile">
      <h1>내 정보 관리</h1>
      <div className="profile-container">
        {!editMode ? (
          <div className="profile-details">
            <div className="profile-header">
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
                readOnly
                className="readonly-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="companyCode">회사 코드</label>
              <input
                type="text"
                id="companyCode"
                name="companyCode"
                value={formData.companyCode}
                readOnly
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