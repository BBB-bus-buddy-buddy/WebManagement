// components/BusDriverManagement.js
import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';

function BusDriverManagement() {
  // 상태 관리
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [driverOperationPlans, setDriverOperationPlans] = useState([]);

  // 컴포넌트 마운트 시 기사 데이터 로드
  useEffect(() => {
    fetchDrivers();
  }, []);

  // 기사 데이터 가져오기 (DRIVER 역할의 사용자)
  const fetchDrivers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // DRIVER 역할의 사용자만 조회
      const response = await ApiService.apiRequest('user?role=DRIVER');
      
      console.log('기사 API 응답 데이터:', response);
      
      let driverList = [];
      
      // 응답 구조 확인 - user 속성에 배열이 있는지 확인
      if (response && response.user && Array.isArray(response.user)) {
        driverList = response.user;
      } 
      // data 속성 안에 user 배열이 있는지 확인
      else if (response && response.data && response.data.user && Array.isArray(response.data.user)) {
        driverList = response.data.user;
      }
      // 기존 구조 확인 (data 배열로 직접 오는 경우)
      else if (response && response.data && Array.isArray(response.data)) {
        driverList = response.data;
      } 
      else if (Array.isArray(response)) {
        driverList = response;
      }
      else {
        console.error('응답 데이터 형식이 예상과 다릅니다:', response);
        driverList = [];
      }
      
      console.log('추출된 driverList:', driverList);
      
      // DRIVER 역할만 필터링
      const driverRoleOnly = driverList.filter(user => user && user.role === 'DRIVER');
      console.log('DRIVER 역할 필터링 후:', driverRoleOnly);
      
      // 각 기사의 데이터 구조 확인
      driverRoleOnly.forEach((driver, index) => {
        console.log(`기사 ${index} 데이터:`, {
          name: driver.name,
          birthDate: driver.birthDate,
          identity: driver.identity,
          phoneNumber: driver.phoneNumber,
          licenseType: driver.licenseType,
          licenseNumber: driver.licenseNumber,
          licenseSerial: driver.licenseSerial,
          licenseExpiryDate: driver.licenseExpiryDate
        });
      });
      
      // 운행 기록 정보 추가
      const driversWithRecords = await Promise.all(
        driverRoleOnly.map(async (driver) => {
          try {
            // 각 기사의 운행 기록 조회 시도
            const operationPlans = await fetchDriverOperationHistory(driver.name);
            return {
              ...driver,
              drivingRecords: operationPlans || []
            };
          } catch (error) {
            console.warn(`기사 ${driver.name}의 운행 기록 조회 실패:`, error);
            return {
              ...driver,
              drivingRecords: []
            };
          }
        })
      );
      
      setDrivers(driversWithRecords);
      console.log('최종 기사 목록:', driversWithRecords);
      
    } catch (err) {
      console.error('기사 데이터 로드 중 오류:', err);
      setError('기사 데이터를 불러오는 중 오류가 발생했습니다.');
      setDrivers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 기사별 운행 기록 조회 (이름으로 검색)
  const fetchDriverOperationHistory = async (driverName) => {
    try {
      // 전체 운행 계획 조회
      const response = await ApiService.getAllOperationPlans();
      
      if (response && Array.isArray(response.data)) {
        // 해당 기사의 운행 기록만 필터링 (이름으로)
        const driverPlans = response.data.filter(plan => {
          return plan.driverName === driverName;
        });
        
        // 운행 기록을 앱 형식으로 변환
        return driverPlans.map(plan => ({
          date: plan.operationDate || new Date().toISOString().split('T')[0],
          busNumber: plan.busNumber || '정보 없음',
          route: plan.routeName || '정보 없음',
          startTime: plan.operationTime ? plan.operationTime.split('-')[0] : '정보 없음',
          endTime: plan.operationTime ? plan.operationTime.split('-')[1] : '정보 없음'
        }));
      }
      
      return [];
    } catch (error) {
      console.warn('운행 기록 조회 실패:', error);
      return [];
    }
  };

  // 기사 클릭 처리
  const handleDriverClick = async (driver) => {
    if (selectedDriver && selectedDriver._id?.$oid === driver._id?.$oid) {
      return;
    }
    
    setSelectedDriver(driver);
    
    // 선택된 기사의 최신 운행 기록 조회
    try {
      const operationHistory = await fetchDriverOperationHistory(driver.name);
      setDriverOperationPlans(operationHistory);
    } catch (error) {
      console.error('운행 기록 조회 실패:', error);
      setDriverOperationPlans([]);
    }
  };

  // 검색 처리
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // 기사 삭제
  const handleDeleteDriver = async (driver) => {
    const driverId = driver._id?.$oid || driver.id;
    
    if (!driverId) {
      console.error('삭제할 기사의 ID가 없습니다');
      return;
    }
    
    if (window.confirm('정말로 이 버스 기사를 삭제하시겠습니까?')) {
      try {
        await ApiService.apiRequest(`user/${driverId}`, 'DELETE');
        
        // 성공적으로 삭제된 후 기사 목록 새로고침
        fetchDrivers();
        
        if (selectedDriver && selectedDriver._id?.$oid === driverId) {
          setSelectedDriver(null);
          setDriverOperationPlans([]);
        }
        
        alert('버스 기사가 삭제되었습니다.');
      } catch (error) {
        console.error('기사 삭제 중 오류:', error);
        alert('기사 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // 검색어에 따라 기사 필터링
  const filteredDrivers = drivers.filter(driver =>
    driver && driver.name && driver.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 나이 계산 함수 (YYYYMMDD 형식)
  const calculateAge = (birthDate) => {
    console.log('calculateAge - birthDate:', birthDate);
    if (!birthDate) return '정보 없음';
    
    try {
      // YYYYMMDD 형식을 YYYY-MM-DD로 변환
      const birthDateStr = birthDate.toString();
      if (birthDateStr.length !== 8) return '정보 없음';
      
      const year = parseInt(birthDateStr.substring(0, 4));
      const month = parseInt(birthDateStr.substring(4, 6));
      const day = parseInt(birthDateStr.substring(6, 8));
      
      const today = new Date();
      const birth = new Date(year, month - 1, day);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      return age;
    } catch (error) {
      console.error('나이 계산 오류:', error);
      return '정보 없음';
    }
  };

  // 생년월일 포맷팅 (YYYYMMDD -> YYYY-MM-DD)
  const formatBirthDate = (birthDate) => {
    console.log('formatBirthDate - birthDate:', birthDate);
    if (!birthDate) return '정보 없음';
    
    try {
      const birthDateStr = birthDate.toString();
      if (birthDateStr.length !== 8) return '정보 없음';
      
      const year = birthDateStr.substring(0, 4);
      const month = birthDateStr.substring(4, 6);
      const day = birthDateStr.substring(6, 8);
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('생년월일 포맷팅 오류:', error);
      return '정보 없음';
    }
  };

  // 성별 추출 (주민등록번호에서)
  const getGenderFromIdentity = (identity) => {
    console.log('getGenderFromIdentity - identity:', identity);
    if (!identity) return '정보 없음';
    
    try {
      const identityStr = identity.toString();
      if (identityStr.length < 8) return '정보 없음';
      
      const genderCode = identityStr.charAt(7);
      if (genderCode === '1' || genderCode === '3') return '남성';
      if (genderCode === '2' || genderCode === '4') return '여성';
      return '정보 없음';
    } catch (error) {
      console.error('성별 추출 오류:', error);
      return '정보 없음';
    }
  };

  // 면허 만료일까지 남은 기간 계산
  const getLicenseStatus = (expiryDate) => {
    if (!expiryDate) return '정보 없음';
    
    try {
      const today = new Date();
      const expiry = new Date(expiryDate);
      const diffTime = expiry - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return '만료됨';
      if (diffDays < 30) return `${diffDays}일 후 만료`;
      if (diffDays < 365) return `${Math.ceil(diffDays / 30)}개월 후 만료`;
      return `${Math.ceil(diffDays / 365)}년 후 만료`;
    } catch (error) {
      return '정보 없음';
    }
  };

  // 전화번호 표시 함수
  const getPhoneDisplay = (phoneNumber) => {
    if (!phoneNumber) return '정보 없음';
    return phoneNumber;
  };

  // 가입 연도 계산 (생년월일 기반으로 추정)
  const getJoinYear = (birthDate) => {
    if (!birthDate) return new Date().getFullYear();
    
    try {
      const year = parseInt(birthDate.substring(0, 4));
      // 20세가 되는 해 + 2년 정도로 추정
      return year + 22;
    } catch (error) {
      return new Date().getFullYear();
    }
  };

  // 기사 번호 생성 (면허번호 기반)
  const getDriverNumber = (driver) => {
    if (!driver) return '정보 없음';
    
    // 면허 시리얼 번호가 있으면 사용, 없으면 이메일 기반
    if (driver.licenseSerial) {
      return `D-${driver.licenseSerial}`;
    }
    
    // 이메일 앞부분 + ID 뒷부분으로 기사 번호 생성
    const emailPrefix = driver.email ? driver.email.split('@')[0] : 'D';
    const idSuffix = driver._id?.$oid ? driver._id.$oid.slice(-4) : '0000';
    
    return `${emailPrefix.toUpperCase()}-${idSuffix}`;
  };

  // 회사 정보 표시
  const getCompanyDisplay = (organizationId) => {
    const organizations = {
      "Uasidnw": "울산과학대학교",
      // 필요에 따라 다른 조직 추가
    };
    
    return organizations[organizationId] || organizationId || '정보 없음';
  };

  // 로딩 상태 표시
  if (isLoading && drivers.length === 0) {
    return (
      <div className="loading-container">
        <p>데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="bus-driver-management">
      <h1>버스 기사 관리</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="management-container">
        <div className="list-section">
          <div className="list-header">
            <h2>버스 기사 목록</h2>
            <div className="search-container">
              <input
                type="text"
                placeholder="기사 이름으로 검색"
                value={searchQuery}
                onChange={handleSearch}
                className="search-input"
              />
            </div>
          </div>
          <div className="driver-list">
            {isLoading ? (
              <div className="loading">로딩 중...</div>
            ) : filteredDrivers.length === 0 ? (
              <div className="empty-list">등록된 버스 기사가 없습니다.</div>
            ) : (
              filteredDrivers.map(driver => (
                <div 
                  key={driver._id?.$oid || 'unknown'}
                  className={`driver-item ${selectedDriver && selectedDriver._id?.$oid === driver._id?.$oid ? 'selected' : ''}`}
                  onClick={() => handleDriverClick(driver)}
                >
                  <div className="driver-photo">
                    <img 
                      src="/api/placeholder/80/80" 
                      alt={driver.name || '기사'} 
                      onError={(e) => {
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 24 24' fill='%23ccc'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z'/%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                  <div className="driver-info">
                    <h3>{driver.name || '이름 없음'}</h3>
                    <p>{getCompanyDisplay(driver.organizationId)} | 기사번호: {getDriverNumber(driver)}</p>
                    <p>면허: {driver.licenseType || '정보 없음'}</p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDriver(driver);
                    }} 
                    className="delete-button"
                  >
                    삭제
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="detail-section">
          {selectedDriver ? (
            <div className="driver-details">
              <div className="detail-header">
                <h2>버스 기사 상세 정보</h2>
              </div>
              <div className="detail-grid">
                <div className="driver-photo-large">
                  <img 
                    src="/api/placeholder/150/150" 
                    alt={selectedDriver.name || '기사'} 
                    onError={(e) => {
                      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 24 24' fill='%23ccc'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z'/%3E%3C/svg%3E";
                    }}
                  />
                </div>
                <div className="detail-info">
                  <div className="detail-section-title">기본 정보</div>
                  <div className="detail-row">
                    <label>이름:</label>
                    <span>{selectedDriver.name || '정보 없음'}</span>
                  </div>
                  <div className="detail-row">
                    <label>생년월일:</label>
                    <span>
                      {selectedDriver.birthDate ? 
                        `${formatBirthDate(selectedDriver.birthDate)} (${calculateAge(selectedDriver.birthDate)}세)` : 
                        '정보 없음'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <label>성별:</label>
                    <span>{getGenderFromIdentity(selectedDriver.identity)}</span>
                  </div>
                  <div className="detail-row">
                    <label>전화번호:</label>
                    <span>{selectedDriver.phoneNumber || '정보 없음'}</span>
                  </div>
                  <div className="detail-row">
                    <label>이메일:</label>
                    <span>{selectedDriver.email || '정보 없음'}</span>
                  </div>
                  <div className="detail-row">
                    <label>소속 회사:</label>
                    <span>{getCompanyDisplay(selectedDriver.organizationId)}</span>
                  </div>
                  <div className="detail-row">
                    <label>기사 번호:</label>
                    <span>{getDriverNumber(selectedDriver)}</span>
                  </div>
                  
                  <div className="detail-section-title">면허 정보</div>
                  <div className="detail-row">
                    <label>면허 종류:</label>
                    <span>{selectedDriver.licenseType || '정보 없음'}</span>
                  </div>
                  <div className="detail-row">
                    <label>면허 번호:</label>
                    <span>{selectedDriver.licenseNumber || '정보 없음'}</span>
                  </div>
                  <div className="detail-row">
                    <label>면허 시리얼:</label>
                    <span>{selectedDriver.licenseSerial || '정보 없음'}</span>
                  </div>
                  <div className="detail-row">
                    <label>면허 만료일:</label>
                    <span>
                      {selectedDriver.licenseExpiryDate ? 
                        `${selectedDriver.licenseExpiryDate} (${getLicenseStatus(selectedDriver.licenseExpiryDate)})` : 
                        '정보 없음'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="driving-records">
                <h3>운행 기록</h3>
                {driverOperationPlans.length > 0 ? (
                  <table className="records-table">
                    <thead>
                      <tr>
                        <th>날짜</th>
                        <th>버스 번호</th>
                        <th>노선</th>
                        <th>운행 시작 시간</th>
                        <th>운행 종료 시간</th>
                      </tr>
                    </thead>
                    <tbody>
                      {driverOperationPlans.slice(0, 10).map((record, index) => (
                        <tr key={index}>
                          <td>{record.date}</td>
                          <td>{record.busNumber}</td>
                          <td>{record.route}</td>
                          <td>{record.startTime}</td>
                          <td>{record.endTime}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>운행 기록이 없습니다.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <p>좌측 목록에서 버스 기사를 선택하세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BusDriverManagement;