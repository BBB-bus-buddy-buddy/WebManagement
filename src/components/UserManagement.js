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
  const [organizations, setOrganizations] = useState({
    "Uasidnw": "울산과학대학교" // 기본 조직 정보
  });

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
        
        // USER 역할을 가진 사용자만 필터링
        const userRoleOnly = userList.filter(user => user && user.role === 'USER');
        setUsers(userRoleOnly);
        console.log('USER 역할을 가진 이용자만 필터링:', userRoleOnly);
      } 
      // data 속성 안에 user 배열이 있는지 확인
      else if (response && response.data && response.data.user && Array.isArray(response.data.user)) {
        const userList = response.data.user;
        const userRoleOnly = userList.filter(user => user && user.role === 'USER');
        setUsers(userRoleOnly);
      }
      // 기존 구조 확인 (data 배열로 직접 오는 경우)
      else if (response && response.data && Array.isArray(response.data)) {
        const userRoleOnly = response.data.filter(user => user && user.role === 'USER');
        setUsers(userRoleOnly);
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

  // 이용자 클릭 처리 - 상세 조회 API 호출 없이 목록 데이터 사용
  const handleUserClick = (user) => {
    // 이미 선택된 사용자면 아무 작업 없음
    if (selectedUser && selectedUser.id === user.id) {
      return;
    }
    
    // 목록에서 가져온 사용자 정보를 바로 표시
    setSelectedUser(user);
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
      (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      // 이메일로 검색
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  );

  // 조직 ID로 조직명 가져오기
  const getOrganizationName = (orgId) => {
    if (!orgId) return '정보 없음';
    return organizations[orgId] || orgId;
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
                  key={user.id || 'unknown'} // 안전한 key 제공
                  className={`user-item ${selectedUser && selectedUser.id === user.id ? 'selected' : ''}`}
                  onClick={() => handleUserClick(user)}
                >
                  <div className="user-info">
                    <h3>{user.name || '이름 없음'}</h3>
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
                  <span>{selectedUser.name || '정보 없음'}</span>
                </div>
                <div className="detail-row">
                  <label>이메일:</label>
                  <span>{selectedUser.email || '정보 없음'}</span>
                </div>
                <div className="detail-row">
                  <label>소속:</label>
                  <span>{getOrganizationName(selectedUser.organizationId)}</span>
                </div>
                <div className="detail-section">
                  <h3>즐겨찾는 정류장</h3>
                  {selectedUser.myStations && selectedUser.myStations.length > 0 ? (
                    <div className="stations-list">
                      {selectedUser.myStations.map((station, index) => (
                        <div key={index} className="station-item">
                          <span>{typeof station === 'object' && station && station.name ? station.name : (station || '정류장 정보 없음')}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>등록된 즐겨찾기 정류장이 없습니다.</p>
                  )}
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