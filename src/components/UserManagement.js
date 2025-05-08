// components/UserManagement.js
import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';
import '../styles/UserManagement.css'; // 스타일 파일 임포트

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 컴포넌트 마운트 시 이용자 데이터 로드
  useEffect(() => {
    fetchUsers();
  }, []);

  // 이용자 데이터 가져오기
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await ApiService.getAllUsers();
      
      if (response && response.data) {
        // 응답 데이터가 배열인지 확인
        const userData = Array.isArray(response.data) ? response.data : [response.data];
        console.log('이용자 데이터:', userData);
        setUsers(userData);
      } else {
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

  // 특정 이용자 상세 정보 가져오기
  const fetchUserDetail = async (userId) => {
    try {
      setIsLoading(true);
      const response = await ApiService.getUser(userId);
      
      if (response && response.data) {
        setSelectedUser(response.data);
      } else {
        setError('이용자 상세 정보를 불러오는 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('이용자 상세 정보 로드 중 오류:', err);
      setError('이용자 상세 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 이용자 클릭 처리
  const handleUserClick = (user) => {
    // 이미 선택된 사용자면 상세 정보만 표시
    if (selectedUser && selectedUser.id === user.id) {
      setSelectedUser(user);
      return;
    }
    
    // 새로운 사용자 선택 시 상세 정보 조회
    if (user.id) {
      fetchUserDetail(user.id);
    } else {
      setSelectedUser(user);
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
        await ApiService.deleteUser(id);
        
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
    (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // 로딩 상태 표시
  if (isLoading && !selectedUser) {
    return (
      <div className="loading-container">
        <p>데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  // 오류 상태 표시
  if (error && !selectedUser) {
    return (
      <div className="error-container">
        <h2>오류가 발생했습니다</h2>
        <p>{error}</p>
        <button onClick={fetchUsers}>
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="user-management">
      <h1>이용자 관리</h1>
      <div className="management-container">
        <div className="list-section">
          <div className="list-header">
            <h2>이용자 목록</h2>
            <div className="search-container">
              <input
                type="text"
                placeholder="이름 또는 이메일로 검색"
                value={searchQuery}
                onChange={handleSearch}
                className="search-input"
              />
            </div>
          </div>
          <div className="user-list">
            {filteredUsers.length === 0 ? (
              <div className="empty-list">등록된 이용자가 없습니다.</div>
            ) : (
              filteredUsers.map(user => (
                <div 
                  key={user.id} 
                  className={`user-item ${selectedUser && selectedUser.id === user.id ? 'selected' : ''}`}
                  onClick={() => handleUserClick(user)}
                >
                  <div className="user-info">
                    <h3>{user.name || '이름 없음'}</h3>
                    <p>{user.email || '이메일 없음'}</p>
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
                  <label>역할:</label>
                  <span>{selectedUser.role || '정보 없음'}</span>
                </div>
                <div className="detail-section">
                  <h3>즐겨찾는 정류장</h3>
                  {selectedUser.myStations && selectedUser.myStations.length > 0 ? (
                    <div className="stations-list">
                      {selectedUser.myStations.map((station, index) => (
                        <div key={index} className="station-item">
                          <span>{typeof station === 'object' && station.name ? station.name : (station || '정류장 정보 없음')}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>등록된 즐겨찾기 정류장이 없습니다.</p>
                  )}
                </div>
                {selectedUser.createdAt && (
                  <div className="detail-section">
                    <h3>생성일</h3>
                    <p>{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                  </div>
                )}
                {selectedUser.updatedAt && (
                  <div className="detail-section">
                    <h3>최종 수정일</h3>
                    <p>{new Date(selectedUser.updatedAt).toLocaleDateString()}</p>
                  </div>
                )}
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