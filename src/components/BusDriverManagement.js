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

  // 버스 기사 데이터 가져오기
  const fetchDrivers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // User API에서 DRIVER 역할만 조회
      const response = await ApiService.getOrganizationDrivers();
      
      if (response?.data && Array.isArray(response.data)) {
        // 각 기사의 운행 기록 정보 추가
        const driversWithRecords = await Promise.all(
          response.data.map(async (driver) => {
            try {
              const operationPlans = await ApiService.getDriverOperationPlans(driver.name, { limit: 5 });
              return {
                ...driver,
                drivingRecords: operationPlans
              };
            } catch (error) {
              return {
                ...driver,
                drivingRecords: []
              };
            }
          })
        );
        
        setDrivers(driversWithRecords);
      } else {
        setDrivers([]);
      }
      
    } catch (err) {
      setError('기사 데이터를 불러오는 중 오류가 발생했습니다.');
      setDrivers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 기사 클릭 처리
  const handleDriverClick = async (driver) => {
    if (selectedDriver?.id === driver.id) {
      return;
    }
    
    setSelectedDriver(driver);
    
    try {
      const operationPlans = await ApiService.getDriverOperationPlans(driver.name, { limit: 10 });
      setDriverOperationPlans(operationPlans);
    } catch (error) {
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
      alert('삭제할 기사의 ID가 없습니다.');
      return;
    }
    
    if (window.confirm(`정말로 ${driver.name} 기사를 삭제하시겠습니까?`)) {
      try {
        await ApiService.deleteDriver(driverId);
        
        // 성공적으로 삭제된 후 기사 목록 새로고침
        await fetchDrivers();
        
        if (selectedDriver?.id === driverId) {
          setSelectedDriver(null);
          setDriverOperationPlans([]);
        }
        
        alert(`${driver.name} 기사가 삭제되었습니다.`);
      } catch (error) {
        alert('기사 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // 검색어에 따라 기사 필터링
  const filteredDrivers = drivers.filter(driver =>
    driver?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 유틸리티 함수들
  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    
    try {
      const birthDateStr = birthDate.toString();
      if (birthDateStr.length !== 8) return null;
      
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
      return null;
    }
  };

  const formatBirthDate = (birthDate) => {
    if (!birthDate) return null;
    
    try {
      const birthDateStr = birthDate.toString();
      if (birthDateStr.length !== 8) return null;
      
      const year = birthDateStr.substring(0, 4);
      const month = birthDateStr.substring(4, 6);
      const day = birthDateStr.substring(6, 8);
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      return null;
    }
  };

  const getGenderFromIdentity = (identity) => {
    if (!identity) return '정보 없음';
    
    try {
      const identityStr = identity.toString();
      if (identityStr.length < 8) return '정보 없음';
      
      const genderCode = identityStr.charAt(7);
      if (genderCode === '1' || genderCode === '3') return '남성';
      if (genderCode === '2' || genderCode === '4') return '여성';
      return '정보 없음';
    } catch (error) {
      return '정보 없음';
    }
  };

  const getLicenseStatus = (expiryDate) => {
    if (!expiryDate) return { status: 'unknown', message: '정보 없음' };
    
    try {
      const today = new Date();
      const expiry = new Date(expiryDate);
      const diffTime = expiry - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return { status: 'expired', message: '만료됨', daysLeft: diffDays };
      } else if (diffDays < 30) {
        return { status: 'warning', message: `${diffDays}일 후 만료`, daysLeft: diffDays };
      } else if (diffDays < 365) {
        const months = Math.ceil(diffDays / 30);
        return { status: 'normal', message: `${months}개월 후 만료`, daysLeft: diffDays };
      } else {
        const years = Math.ceil(diffDays / 365);
        return { status: 'normal', message: `${years}년 후 만료`, daysLeft: diffDays };
      }
    } catch (error) {
      return { status: 'error', message: '정보 없음' };
    }
  };

  const generateDriverNumber = (driver) => {
    if (!driver) return '정보 없음';
    
    if (driver.licenseSerial) {
      return `D-${driver.licenseSerial}`;
    }
    
    const emailPrefix = driver.email ? driver.email.split('@')[0] : 'D';
    const idSuffix = driver._id?.$oid ? driver._id.$oid.slice(-4) : 
                     driver.id ? driver.id.slice(-4) : '0000';
    
    return `${emailPrefix.toUpperCase()}-${idSuffix}`;
  };

  // 조직 표시 이름
  const getCompanyDisplay = (organizationId) => {
    const organizations = {
      "Uasidnw": "울산과학대학교",
    };
    return organizations[organizationId] || organizationId || '정보 없음';
  };

  // 로딩 상태 표시
  if (isLoading) {
    return (
      <div className="loading-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        fontSize: '18px'
      }}>
        <div>
          <div style={{ marginBottom: '10px' }}>🚌 버스 기사 데이터를 불러오는 중...</div>
          <div style={{ fontSize: '14px', color: '#666' }}>잠시만 기다려주세요</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bus-driver-management" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#2c3e50', marginBottom: '10px' }}>🚌 버스 기사 관리</h1>
        <p style={{ color: '#7f8c8d', margin: 0 }}>조직 내 버스 기사들의 정보를 관리합니다</p>
      </div>
      
      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          ❌ {error}
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 200px)' }}>
        {/* 좌측 기사 목록 */}
        <div style={{ 
          flex: '1', 
          backgroundColor: '#fff', 
          borderRadius: '10px', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          padding: '20px'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ margin: 0, color: '#34495e' }}>기사 목록 ({filteredDrivers.length}명)</h2>
              <button 
                onClick={fetchDrivers}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                🔄 새로고침
              </button>
            </div>
            <input
              type="text"
              placeholder="🔍 기사 이름으로 검색"
              value={searchQuery}
              onChange={handleSearch}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div style={{ 
            maxHeight: 'calc(100% - 120px)', 
            overflowY: 'auto',
            border: '1px solid #ecf0f1',
            borderRadius: '5px'
          }}>
            {filteredDrivers.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#95a5a6'
              }}>
                {drivers.length === 0 ? '등록된 버스 기사가 없습니다.' : '검색 결과가 없습니다.'}
              </div>
            ) : (
              filteredDrivers.map(driver => (
                <div 
                  key={driver.id}
                  onClick={() => handleDriverClick(driver)}
                  style={{
                    padding: '15px',
                    borderBottom: '1px solid #ecf0f1',
                    cursor: 'pointer',
                    backgroundColor: selectedDriver?.id === driver.id ? '#e3f2fd' : 'white',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedDriver?.id !== driver.id) {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedDriver?.id !== driver.id) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                        <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50' }}>
                          {driver.name}
                        </span>
                        <span style={{
                          marginLeft: '10px',
                          padding: '2px 8px',
                          backgroundColor: '#27ae60',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}>
                          DRIVER
                        </span>
                      </div>
                      <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '3px' }}>
                        🏢 {getCompanyDisplay(driver.organizationId)}
                      </div>
                      <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '3px' }}>
                        🎫 기사번호: {generateDriverNumber(driver)}
                      </div>
                      <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
                        🚗 면허: {driver.licenseType || '정보 없음'}
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDriver(driver);
                      }} 
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      🗑️ 삭제
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* 우측 상세 정보 */}
        <div style={{ 
          flex: '1.5', 
          backgroundColor: '#fff', 
          borderRadius: '10px', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          padding: '20px'
        }}>
          {selectedDriver ? (
            <div style={{ height: '100%', overflowY: 'auto' }}>
              <div style={{ marginBottom: '25px' }}>
                <h2 style={{ margin: 0, color: '#34495e', marginBottom: '5px' }}>
                  🧑‍💼 {selectedDriver.name} 기사 상세 정보
                </h2>
                <p style={{ margin: 0, color: '#7f8c8d', fontSize: '14px' }}>
                  마지막 업데이트: {new Date().toLocaleString()}
                </p>
              </div>
              
              {/* 기본 정보 카드 */}
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>👤 기본 정보</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ fontWeight: 'bold', color: '#34495e' }}>이름:</label>
                    <div style={{ marginTop: '5px' }}>{selectedDriver.name}</div>
                  </div>
                  <div>
                    <label style={{ fontWeight: 'bold', color: '#34495e' }}>생년월일:</label>
                    <div style={{ marginTop: '5px' }}>
                      {selectedDriver.birthDate ? 
                        `${formatBirthDate(selectedDriver.birthDate)} (${calculateAge(selectedDriver.birthDate)}세)` : 
                        '정보 없음'}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontWeight: 'bold', color: '#34495e' }}>성별:</label>
                    <div style={{ marginTop: '5px' }}>{getGenderFromIdentity(selectedDriver.identity)}</div>
                  </div>
                  <div>
                    <label style={{ fontWeight: 'bold', color: '#34495e' }}>전화번호:</label>
                    <div style={{ marginTop: '5px' }}>{selectedDriver.phoneNumber || '정보 없음'}</div>
                  </div>
                  <div>
                    <label style={{ fontWeight: 'bold', color: '#34495e' }}>이메일:</label>
                    <div style={{ marginTop: '5px' }}>{selectedDriver.email}</div>
                  </div>
                  <div>
                    <label style={{ fontWeight: 'bold', color: '#34495e' }}>소속 회사:</label>
                    <div style={{ marginTop: '5px' }}>{getCompanyDisplay(selectedDriver.organizationId)}</div>
                  </div>
                </div>
              </div>
              
              {/* 면허 정보 카드 */}
              <div style={{
                backgroundColor: '#fff3cd',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>🚗 면허 정보</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ fontWeight: 'bold', color: '#34495e' }}>면허 종류:</label>
                    <div style={{ marginTop: '5px' }}>{selectedDriver.licenseType || '정보 없음'}</div>
                  </div>
                  <div>
                    <label style={{ fontWeight: 'bold', color: '#34495e' }}>면허 번호:</label>
                    <div style={{ marginTop: '5px' }}>{selectedDriver.licenseNumber || '정보 없음'}</div>
                  </div>
                  <div>
                    <label style={{ fontWeight: 'bold', color: '#34495e' }}>면허 시리얼:</label>
                    <div style={{ marginTop: '5px' }}>{selectedDriver.licenseSerial || '정보 없음'}</div>
                  </div>
                  <div>
                    <label style={{ fontWeight: 'bold', color: '#34495e' }}>면허 만료일:</label>
                    <div style={{ marginTop: '5px' }}>
                      {selectedDriver.licenseExpiryDate ? 
                        `${selectedDriver.licenseExpiryDate} (${getLicenseStatus(selectedDriver.licenseExpiryDate).message})` : 
                        '정보 없음'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 운행 기록 카드 */}
              <div style={{
                backgroundColor: '#d1ecf1',
                padding: '20px',
                borderRadius: '8px'
              }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>📊 최근 운행 기록</h3>
                {driverOperationPlans.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      backgroundColor: 'white',
                      borderRadius: '5px',
                      overflow: 'hidden'
                    }}>
                      <thead style={{ backgroundColor: '#34495e', color: 'white' }}>
                        <tr>
                          <th style={{ padding: '12px', textAlign: 'left' }}>날짜</th>
                          <th style={{ padding: '12px', textAlign: 'left' }}>버스 번호</th>
                          <th style={{ padding: '12px', textAlign: 'left' }}>노선</th>
                          <th style={{ padding: '12px', textAlign: 'left' }}>시작</th>
                          <th style={{ padding: '12px', textAlign: 'left' }}>종료</th>
                        </tr>
                      </thead>
                      <tbody>
                        {driverOperationPlans.slice(0, 5).map((record, index) => (
                          <tr key={index} style={{
                            borderBottom: '1px solid #ecf0f1',
                            backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white'
                          }}>
                            <td style={{ padding: '10px' }}>{record.date}</td>
                            <td style={{ padding: '10px' }}>{record.busNumber}</td>
                            <td style={{ padding: '10px' }}>{record.route}</td>
                            <td style={{ padding: '10px' }}>{record.startTime}</td>
                            <td style={{ padding: '10px' }}>{record.endTime}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {driverOperationPlans.length > 5 && (
                      <p style={{ 
                        textAlign: 'center', 
                        marginTop: '10px', 
                        color: '#7f8c8d',
                        fontSize: '14px'
                      }}>
                        최근 5개 기록만 표시됩니다. (총 {driverOperationPlans.length}개 기록)
                      </p>
                    )}
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#95a5a6',
                    backgroundColor: 'white',
                    borderRadius: '5px'
                  }}>
                    📭 운행 기록이 없습니다.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              color: '#95a5a6'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🚌</div>
              <div style={{ fontSize: '18px', marginBottom: '10px' }}>기사를 선택해주세요</div>
              <div style={{ fontSize: '14px' }}>좌측 목록에서 버스 기사를 클릭하면 상세 정보를 볼 수 있습니다</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BusDriverManagement;