// components/UserManagement.js - 조직별 필터링 적용
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

  // 컴포넌트 마운트 시 현재 사용자 정보와 이용자 데이터 로드
  useEffect(() => {
    fetchUsers();
  }, []);

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

  // 즐겨찾기 정류장 렌더링
  const renderMyStations = (myStations) => {
    if (!myStations || !Array.isArray(myStations) || myStations.length === 0) {
      return <p>등록된 즐겨찾기 정류장이 없습니다.</p>;
    }

    return (
      <div className="stations-list">
        {myStations.map((station, index) => {
          let stationName = '정류장 정보 없음';
          
          if (typeof station === 'string') {
            stationName = station;
          } else if (station && typeof station === 'object' && station.name) {
            stationName = station.name;
          } else if (station && typeof station === 'object') {
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

  return (
    <div className="user-management">
      <div className="management-header">
        <h1>이용자 관리</h1>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="management-container">
        <div className="list-section">
          <div className="list-header">
            <h2>이용자 목록 ({filteredUsers.length}명)</h2>
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
                  <span>{organizationName || selectedUser.organizationId || '정보 없음'}</span>
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