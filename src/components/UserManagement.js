// components/UserManagement.js - 조직별 필터링 적용 (정류장 UI 개선)
import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';
import '../styles/UserManagement.css';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [organizationName, setOrganizationName] = useState('');
  const [organizationMap, setOrganizationMap] = useState({}); // 조직 ID -> 조직명 매핑
  const [stationMap, setStationMap] = useState({}); // 정류장 ID -> 정류장 정보 매핑

  // 컴포넌트 마운트 시 현재 사용자 정보와 이용자 데이터 로드
  useEffect(() => {
    fetchOrganizationInfo();
    fetchStations(); // 정류장 정보 미리 로드
    fetchUsers();
  }, []);

  // 조직 정보 가져오기
  const fetchOrganizationInfo = async () => {
    try {
      // 현재 로그인한 사용자의 조직 정보 가져오기
      const response = await ApiService.getCurrentOrganization();
      
      if (response && response.data && response.data.name) {
        setOrganizationName(response.data.name);
        // 조직 매핑에 추가
        if (response.data.id || response.data.organizationId) {
          setOrganizationMap(prev => ({
            ...prev,
            [response.data.id || response.data.organizationId]: response.data.name
          }));
        }
      }
    } catch (error) {
      console.error('조직 정보 조회 실패:', error);
    }
  };

  // 정류장 정보 미리 로드
  const fetchStations = async () => {
    try {
      const response = await ApiService.getOrganizationStations();
      
      if (response && response.data && Array.isArray(response.data)) {
        const stations = {};
        response.data.forEach(station => {
          const stationId = station._id || station.id;
          if (stationId) {
            stations[stationId] = {
              id: stationId,
              name: station.name || '정류장명 없음',
              location: station.location
            };
          }
        });
        setStationMap(stations);
        console.log('정류장 매핑 데이터:', stations);
      }
    } catch (error) {
      console.error('정류장 정보 로드 실패:', error);
    }
  };

  // 조직 ID로 조직명 가져오기
  const getOrganizationName = (orgId) => {
    // 이미 매핑에 있으면 반환
    if (organizationMap[orgId]) {
      return organizationMap[orgId];
    }
    
    // 현재 조직과 같으면 현재 조직명 반환
    if (organizationName && orgId) {
      return organizationName;
    }
    
    // 기본 조직명 매핑 (알려진 조직들)
    const knownOrganizations = {
      "Uasidnw": "울산과학대학교",
      // 필요시 다른 조직 추가
    };
    
    return knownOrganizations[orgId] || orgId || '정보 없음';
  };

  // 정류장 ID로 정류장명 가져오기
  const getStationName = (stationId) => {
    if (!stationId) return '정보 없음';
    
    // 문자열인 경우 정류장명으로 간주
    if (typeof stationId === 'string' && !stationMap[stationId]) {
      return stationId;
    }
    
    // 정류장 매핑에서 찾기
    const station = stationMap[stationId];
    if (station && station.name) {
      return station.name;
    }
    
    // 찾을 수 없는 경우 ID 표시 대신 알 수 없음 표시
    return '정류장 정보 없음';
  };

  // 현재 조직의 이용자 데이터만 가져오기
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      // 조직별 필터링된 이용자 조회 메서드 사용
      const response = await ApiService.getOrganizationUsers();
      
      console.log('조직 이용자 API 응답 데이터:', response);
      
      if (response && response.data && Array.isArray(response.data)) {
        // 이미 서버에서 조직별로 필터링된 데이터
        const userRoleOnly = response.data.map(user => ({
          // 안전하게 데이터 추출
          id: user.id || user._id || 'unknown',
          name: user.name || '이름 없음',
          email: user.email || '이메일 없음',
          organizationId: user.organizationId || '',
          myStations: user.myStations || [],
          role: user.role
        }));
        
        setUsers(userRoleOnly);
        console.log('조직 이용자 목록:', userRoleOnly);
      } else {
        console.error('응답 데이터 형식이 예상과 다릅니다:', response);
        setUsers([]);
      }
      setError(null);
    } catch (err) {
      console.error('조직 이용자 데이터 로드 중 오류:', err);
      setError('이용자 데이터를 불러오는 중 오류가 발생했습니다.');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 이용자 클릭 처리
  const handleUserClick = (user) => {
    if (selectedUser && selectedUser.id === user.id) {
      return;
    }
    setSelectedUser(user);
  };

  // 검색 처리
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // 이용자 삭제 (조직 내 이용자만)
  const handleDeleteUser = async (id) => {
    if (!id) {
      console.error('삭제할 이용자의 ID가 없습니다');
      return;
    }
    
    if (window.confirm('정말로 이 이용자를 삭제하시겠습니까?')) {
      try {
        await ApiService.apiRequest(`user/${id}`, 'DELETE');
        
        // 성공적으로 삭제된 후 이용자 목록 새로고침
        fetchUsers();
        
        if (selectedUser && selectedUser.id === id) {
          setSelectedUser(null);
        }
        
        alert('이용자가 삭제되었습니다.');
      } catch (error) {
        console.error('이용자 삭제 중 오류:', error);
        alert('이용자 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // 검색어에 따라 이용자 필터링
  const filteredUsers = users.filter(user =>
    user && (
      (user.name && typeof user.name === 'string' && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.email && typeof user.email === 'string' && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  );

  // 간단한 정류장 리스트 렌더링
  const renderMyStations = (myStations) => {
    if (!myStations || !Array.isArray(myStations) || myStations.length === 0) {
      return (
        <div className="empty-stations">
          <p>등록된 즐겨찾기 정류장이 없습니다.</p>
        </div>
      );
    }

    return (
      <div className="stations-simple-list">
        {myStations.map((station, index) => {
          let stationName = '정류장 정보 없음';
          
          if (typeof station === 'string') {
            stationName = getStationName(station);
          } else if (station && typeof station === 'object') {
            const stationId = station.id || station._id;
            stationName = station.name || getStationName(stationId);
          }
          
          return (
            <div key={index} className="station-simple-item">
              {stationName}
            </div>
          );
        })}
      </div>
    );
  };

  // 로딩 상태 표시
  if (isLoading && users.length === 0) {
    return (
      <div className="loading-container">
        <p>데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="management-header">
        <h1>이용자 관리</h1>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="management-container">
        <div className="list-section">
          <div className="list-header">
            <span>이용자 목록</span>
            <div className="search-container">
              <input
                type="text"
                placeholder="이름으로 검색"
                value={searchQuery}
                onChange={handleSearch}
                className="search-input"
              />
            </div>
          </div>
          <div className="user-list">
            {isLoading ? (
              <div className="loading">로딩 중...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="empty-list">
                {searchQuery ? '검색 결과가 없습니다.' : '등록된 이용자가 없습니다.'}
              </div>
            ) : (
              filteredUsers.map(user => (
                <div 
                  key={user.id}
                  className={`user-item ${selectedUser && selectedUser.id === user.id ? 'selected' : ''}`}
                  onClick={() => handleUserClick(user)}
                >
                  <div className="user-info">
                    <h3>{user.name}</h3>
                  </div>
                  <div className="user-actions">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteUser(user.id);
                      }} 
                      className="delete-button"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="detail-section">
          {selectedUser ? (
            <div className="user-details">
              <div className="detail-header">
                <h2>이용자 상세 정보</h2>
              </div>
              <div className="detail-info">
                <div className="detail-row">
                  <label>이름:</label>
                  <span>{selectedUser.name}</span>
                </div>
                <div className="detail-row">
                  <label>이메일:</label>
                  <span>{selectedUser.email}</span>
                </div>
                <div className="detail-row">
                  <label>소속:</label>
                  <span>{getOrganizationName(selectedUser.organizationId)}</span>
                </div>
                <div className="favorite-stations-section">
                  <h3>즐겨찾는 정류장</h3>
                  {renderMyStations(selectedUser.myStations)}
                </div>
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <p>좌측 목록에서 이용자를 선택하세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserManagement;