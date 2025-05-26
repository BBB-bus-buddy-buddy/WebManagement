// components/UserManagement.js
import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';
import '../styles/UserManagement.css';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [organizationCache, setOrganizationCache] = useState({}); // 조직 정보 캐시
  const [loadingOrganizations, setLoadingOrganizations] = useState({}); // 조직 로딩 상태

  // 컴포넌트 마운트 시 이용자 데이터 로드
  useEffect(() => {
    fetchUsers();
  }, []);

  // 이용자 데이터 가져오기
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await ApiService.apiRequest('user?role=USER');
      
      console.log('API 응답 데이터:', response);
      
      // 응답 구조 확인 - user 속성에 배열이 있는지 확인
      if (response && response.user && Array.isArray(response.user)) {
        // "List<User> user" 형태로 온 응답 처리
        const userList = response.user;
        console.log('사용자 목록 데이터:', userList);
        
        // USER 역할을 가진 사용자만 필터링하고 안전하게 처리
        const userRoleOnly = userList.filter(user => {
          return user && typeof user === 'object' && user.role === 'USER';
        }).map(user => ({
          // 안전하게 데이터 추출
          id: user.id || user._id || 'unknown',
          name: user.name || '이름 없음',
          email: user.email || '이메일 없음',
          organizationId: user.organizationId || '',
          myStations: user.myStations || [],
          role: user.role
        }));
        
        setUsers(userRoleOnly);
        console.log('USER 역할을 가진 이용자만 필터링:', userRoleOnly);
        
        // 사용자 목록을 가져온 후 조직 정보 미리 로드
        preloadOrganizations(userRoleOnly);
      } 
      // data 속성 안에 user 배열이 있는지 확인
      else if (response && response.data && response.data.user && Array.isArray(response.data.user)) {
        const userList = response.data.user;
        const userRoleOnly = userList.filter(user => {
          return user && typeof user === 'object' && user.role === 'USER';
        }).map(user => ({
          id: user.id || user._id || 'unknown',
          name: user.name || '이름 없음',
          email: user.email || '이메일 없음',
          organizationId: user.organizationId || '',
          myStations: user.myStations || [],
          role: user.role
        }));
        setUsers(userRoleOnly);
        preloadOrganizations(userRoleOnly);
      }
      // 기존 구조 확인 (data 배열로 직접 오는 경우)
      else if (response && response.data && Array.isArray(response.data)) {
        const userRoleOnly = response.data.filter(user => {
          return user && typeof user === 'object' && user.role === 'USER';
        }).map(user => ({
          id: user.id || user._id || 'unknown',
          name: user.name || '이름 없음',
          email: user.email || '이메일 없음',
          organizationId: user.organizationId || '',
          myStations: user.myStations || [],
          role: user.role
        }));
        setUsers(userRoleOnly);
        preloadOrganizations(userRoleOnly);
      } 
      else {
        console.error('응답 데이터 형식이 예상과 다릅니다:', response);
        setUsers([]);
      }
      setError(null);
    } catch (err) {
      console.error('이용자 데이터 로드 중 오류:', err);
      setError('이용자 데이터를 불러오는 중 오류가 발생했습니다.');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 조직 정보 미리 로드
  const preloadOrganizations = async (userList) => {
    const uniqueOrgIds = [...new Set(
      userList
        .map(user => user.organizationId)
        .filter(orgId => orgId && !organizationCache[orgId])
    )];

    for (const orgId of uniqueOrgIds) {
      fetchOrganizationName(orgId);
    }
  };

  // 조직명 가져오기 (캐시 사용)
  const fetchOrganizationName = async (orgId) => {
    if (!orgId || organizationCache[orgId] || loadingOrganizations[orgId]) {
      return;
    }

    setLoadingOrganizations(prev => ({ ...prev, [orgId]: true }));

    try {
      const response = await ApiService.verifyOrganization(orgId);
      
      if (response && response.data && response.data.name) {
        setOrganizationCache(prev => ({
          ...prev,
          [orgId]: response.data.name
        }));
      } else {
        // API에서 조직명을 찾을 수 없는 경우 조직 ID를 그대로 저장
        setOrganizationCache(prev => ({
          ...prev,
          [orgId]: orgId
        }));
      }
    } catch (error) {
      console.error(`조직 정보 조회 실패 (${orgId}):`, error);
      // 오류 발생 시 조직 ID를 그대로 저장
      setOrganizationCache(prev => ({
        ...prev,
        [orgId]: orgId
      }));
    } finally {
      setLoadingOrganizations(prev => ({ ...prev, [orgId]: false }));
    }
  };

  // 조직 ID로 조직명 가져오기 (캐시 우선 사용)
  const getOrganizationName = (orgId) => {
    if (!orgId) return '정보 없음';
    
    // 캐시에 있는 경우 반환
    if (organizationCache[orgId]) {
      return organizationCache[orgId];
    }
    
    // 로딩 중인 경우
    if (loadingOrganizations[orgId]) {
      return '조직 정보 로딩 중...';
    }
    
    // 캐시에 없고 로딩 중이 아닌 경우 API 호출
    fetchOrganizationName(orgId);
    return orgId; // 임시로 조직 ID 반환
  };

  // 이용자 클릭 처리 - 상세 조회 API 호출 없이 목록 데이터 사용
  const handleUserClick = (user) => {
    // 이미 선택된 사용자면 아무 작업 없음
    if (selectedUser && selectedUser.id === user.id) {
      return;
    }
    
    // 목록에서 가져온 사용자 정보를 바로 표시
    setSelectedUser(user);
    
    // 선택된 사용자의 조직 정보가 없으면 가져오기
    if (user.organizationId && !organizationCache[user.organizationId]) {
      fetchOrganizationName(user.organizationId);
    }
  };

  // 검색 처리
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // 이용자 삭제
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

  // 검색어에 따라 이용자 필터링 - 안전한 버전으로 수정
  const filteredUsers = users.filter(user =>
    // 사용자 객체가 존재하는지 먼저 확인
    user && (
      // 이름으로 검색
      (user.name && typeof user.name === 'string' && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      // 이메일로 검색
      (user.email && typeof user.email === 'string' && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  );

  // 즐겨찾기 정류장 렌더링을 위한 안전한 처리
  const renderMyStations = (myStations) => {
    if (!myStations || !Array.isArray(myStations) || myStations.length === 0) {
      return <p>등록된 즐겨찾기 정류장이 없습니다.</p>;
    }

    return (
      <div className="stations-list">
        {myStations.map((station, index) => {
          let stationName = '정류장 정보 없음';
          
          // station이 문자열인 경우
          if (typeof station === 'string') {
            stationName = station;
          }
          // station이 객체이고 name 속성이 있는 경우
          else if (station && typeof station === 'object' && station.name) {
            stationName = station.name;
          }
          // station이 객체이지만 id, collectionName, databaseName 같은 참조 객체인 경우
          else if (station && typeof station === 'object') {
            // MongoDB DBRef 객체인 경우 처리
            if (station.id || station._id) {
              stationName = `정류장 ID: ${station.id || station._id}`;
            } else {
              stationName = '정류장 정보 없음';
            }
          }
          
          return (
            <div key={index} className="station-item">
              <span>{stationName}</span>
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

  console.log('렌더링 전 이용자 목록:', filteredUsers);
  
  return (
    <div className="user-management">
      <h1>이용자 관리</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="management-container">
        <div className="list-section">
          <div className="list-header">
            <h2>이용자 목록</h2>
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
              <div className="empty-list">등록된 이용자가 없습니다.</div>
            ) : (
              filteredUsers.map(user => (
                <div 
                  key={user.id} // 안전한 key 제공
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
                <div className="detail-section">
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