// components/Register.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios'; // axios 추가
import '../styles/Register.css';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    birthDate: '',
    company: '',
    companyCode: '',
    email: '',
    manager: '', // 담당자 필드 추가
    emergencyContact: '', // 담당자 긴급 연락처 추가
  });
  const [errors, setErrors] = useState({});
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // 조직 코드가 변경되면 인증 상태 초기화
    if (name === 'companyCode') {
      setIsCodeVerified(false);
      setVerificationMessage('');
    }
  };

  // 회사명과 조직 코드 인증 함수
  const verifyCompanyCode = async () => {
    if (!formData.companyCode.trim()) {
      setVerificationMessage('조직 코드를 입력하세요');
      return;
    }
    
    if (!formData.company.trim()) {
      setVerificationMessage('회사명을 먼저 입력하세요');
      return;
    }

    try {
      setIsVerifying(true);
      // 실제로는 서버에 인증 요청을 보내야 합니다
      // 아래는 더미 API 호출 예시입니다
      // const response = await axios.post('/api/verify-company-code', { 
      //   company: formData.company,
      //   companyCode: formData.companyCode 
      // });

      // 더미 응답 (실제 구현 시 이 부분을 API 호출로 대체)
      await new Promise(resolve => setTimeout(resolve, 1000)); // 인증 시뮬레이션
      
      // 유효한 회사-코드 조합이라고 가정 (실제로는 서버 응답에 따라 처리)
      const validCombinations = [
        { company: '삼성전자', code: 'SEC2023' },
        { company: 'LG전자', code: 'LGE2023' },
        { company: '현대자동차', code: 'HDC2023' },
        { company: '네이버', code: 'NAV2023' },
      ];
      
      const isValid = validCombinations.some(
        combo => combo.company === formData.company && combo.code === formData.companyCode
      );
      
      if (isValid) {
        setIsCodeVerified(true);
        setVerificationMessage('회사 정보가 성공적으로 인증되었습니다.');
      } else {
        setIsCodeVerified(false);
        setVerificationMessage('회사명과 조직 코드가 일치하지 않습니다.');
      }
    } catch (error) {
      console.error('회사 정보 인증 오류:', error);
      setVerificationMessage('인증 과정에서 오류가 발생했습니다.');
      setIsCodeVerified(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const validate = () => {
    const newErrors = {};

    // 아이디 검증
    if (!formData.username.trim()) {
      newErrors.username = '아이디를 입력하세요';
    } else if (formData.username.length < 4) {
      newErrors.username = '아이디는 4자 이상이어야 합니다';
    }

    // 비밀번호 검증
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력하세요';
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 6자 이상이어야 합니다';
    }

    // 비밀번호 확인 검증
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
    }

    // 이름 검증
    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력하세요';
    }

    // 생년월일 검증
    if (!formData.birthDate) {
      newErrors.birthDate = '생년월일을 입력하세요';
    }

    // 소속회사 검증
    if (!formData.company.trim()) {
      newErrors.company = '소속 회사를 입력하세요';
    }

    // 회사명 및 조직 코드 검증
    if (!formData.company.trim()) {
      newErrors.company = '소속 회사를 입력하세요';
    }
    
    if (!formData.companyCode.trim()) {
      newErrors.companyCode = '조직 코드를 입력하세요';
    } else if (!isCodeVerified) {
      newErrors.companyCode = '회사명과 조직 코드 인증이 필요합니다';
    }

    // 이메일 검증
    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력하세요';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '유효한 이메일 주소를 입력하세요';
    }

    // 담당자 검증
    if (!formData.manager.trim()) {
      newErrors.manager = '담당자 이름을 입력하세요';
    }

    // 담당자 긴급 연락처 검증
    if (!formData.emergencyContact.trim()) {
      newErrors.emergencyContact = '담당자 긴급 연락처를 입력하세요';
    } else if (!/^\d{3}-\d{3,4}-\d{4}$/.test(formData.emergencyContact)) {
      newErrors.emergencyContact = '연락처 형식이 올바르지 않습니다 (예: 010-1234-5678)';
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();

    if (Object.keys(validationErrors).length === 0) {
      // 실제 사용 시에는 서버에 회원가입 요청을 보내야 합니다
      // 여기서는 더미 데이터로 처리
      console.log('Registration data:', formData);
      alert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
      navigate('/login');
    } else {
      setErrors(validationErrors);
    }
  };

  return (
    <div className="register-container">
      <div className="register-form-container">
        <h1>회원가입</h1>
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="username">아이디</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="아이디를 입력하세요"
            />
            {errors.username && <span className="error-message">{errors.username}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">비밀번호 확인</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="비밀번호를 다시 입력하세요"
            />
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="name">이름</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="이름을 입력하세요"
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
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
            {errors.birthDate && <span className="error-message">{errors.birthDate}</span>}
          </div>



          <div className="form-group company-section">
            <label htmlFor="company">소속 회사</label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="소속된 회사를 입력하세요"
              className={isCodeVerified ? 'verified-input' : ''}
              readOnly={isCodeVerified}
            />
            {errors.company && <span className="error-message">{errors.company}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="companyCode">회사 조직 코드</label>
            <div className="code-verification-container">
              <input
                type="text"
                id="companyCode"
                name="companyCode"
                value={formData.companyCode}
                onChange={handleChange}
                placeholder="소속된 회사 조직 코드를 입력하세요"
                className={isCodeVerified ? 'verified-input' : ''}
                readOnly={isCodeVerified}
              />
              <button 
                type="button" 
                onClick={verifyCompanyCode} 
                className="verify-button"
                disabled={isVerifying || !formData.companyCode.trim() || !formData.company.trim()}
              >
                {isVerifying ? '인증 중...' : '인증'}
              </button>
            </div>
            {verificationMessage && (
              <span 
                className={`verification-message ${isCodeVerified ? 'success' : 'error'}`}
              >
                {verificationMessage}
              </span>
            )}
            {errors.companyCode && <span className="error-message">{errors.companyCode}</span>}
            
            {isCodeVerified && (
              <div className="verified-info">
                <span className="verified-icon">✓</span> 인증 완료: {formData.company} ({formData.companyCode})
                <button 
                  type="button" 
                  onClick={() => {
                    setIsCodeVerified(false);
                    setVerificationMessage('');
                  }}
                  className="reset-verification"
                >
                  재인증
                </button>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="이메일을 입력하세요"
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          {/* 담당자 필드 추가 */}
          <div className="form-group">
            <label htmlFor="manager">담당자</label>
            <input
              type="text"
              id="manager"
              name="manager"
              value={formData.manager}
              onChange={handleChange}
              placeholder="담당자 이름을 입력하세요"
            />
            {errors.manager && <span className="error-message">{errors.manager}</span>}
          </div>

          {/* 담당자 긴급 연락처 필드 추가 */}
          <div className="form-group">
            <label htmlFor="emergencyContact">담당자 긴급 연락처</label>
            <input
              type="text"
              id="emergencyContact"
              name="emergencyContact"
              value={formData.emergencyContact}
              onChange={handleChange}
              placeholder="형식: 010-1234-5678"
            />
            {errors.emergencyContact && <span className="error-message">{errors.emergencyContact}</span>}
          </div>

          <button type="submit" className="register-button">회원가입</button>
          <div className="login-link">
            이미 계정이 있으신가요? <Link to="/login">로그인</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;