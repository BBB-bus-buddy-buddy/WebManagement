// components/UserManagement.js
import React, { useState } from 'react';

function UserManagement() {
  // Dummy data for users - 데이터 형식 변경
  const [users, setUsers] = useState([
    {
      id: 1,
      name: '홍길동',
      birthDate: '1990-03-15',
      age: 35,
      gender: '남성',
      phone: '010-1234-5678',
      joinYear: 2020,
      rideHistory: [
        { 
          id: 1,
          busInfo: { number: '108', route: '강남-송파' },
          boardingStation: '강남역',
          boardingTime: '08:15',
          alightingStation: '송파역',
          alightingTime: '08:45',
          date: '2025-03-30'
        },
        { 
          id: 2,
          busInfo: { number: '302', route: '서초-강남' },
          boardingStation: '서초역',
          boardingTime: '17:30',
          alightingStation: '강남역',
          alightingTime: '17:50',
          date: '2025-03-29'
        }
      ]
    },
    {
      id: 2,
      name: '김영희',
      birthDate: '1995-08-22',
      age: 30,
      gender: '여성',
      phone: '010-9876-5432',
      joinYear: 2021,
      rideHistory: [
        { 
          id: 1,
          busInfo: { number: '401', route: '송파-강동' },
          boardingStation: '송파역',
          boardingTime: '09:45',
          alightingStation: '강동역',
          alightingTime: '10:15',
          date: '2025-03-30'
        }
      ]
    },
    {
      id: 3,
      name: '박철수',
      birthDate: '1988-12-10',
      age: 37,
      gender: '남성',
      phone: '010-5555-7777',
      joinYear: 2019,
      rideHistory: [
        { 
          id: 1,
          busInfo: { number: '108', route: '강남-송파' },
          boardingStation: '강남역',
          boardingTime: '10:20',
          alightingStation: '석촌역',
          alightingTime: '10:40',
          date: '2025-03-30'
        },
        { 
          id: 2,
          busInfo: { number: '108', route: '강남-송파' },
          boardingStation: '석촌역',
          boardingTime: '16:30',
          alightingStation: '송파역',
          alightingTime: '16:45',
          date: '2025-03-30'
        },
        { 
          id: 3,
          busInfo: { number: '302', route: '서초-강남' },
          boardingStation: '서초역',
          boardingTime: '09:15',
          alightingStation: '강남역',
          alightingTime: '09:35',
          date: '2025-03-28'
        }
      ]
    }
  ]);

  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleUserClick = (user) => {
    setSelectedUser(user);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleDeleteUser = (id) => {
    if (window.confirm('정말로 이 이용자를 삭제하시겠습니까?')) {
      setUsers(users.filter(user => user.id !== id));
      if (selectedUser && selectedUser.id === id) {
        setSelectedUser(null);
      }
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone.includes(searchQuery)
  );

  return (
    <div className="user-management">
      <h1>이용자 관리</h1>
      <div className="management-container">
        <div className="list-section">
          <div className="search-bar">
            <input
              type="text"
              placeholder="이름 또는 전화번호로 검색"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          <div className="user-list">
            {filteredUsers.map(user => (
              <div 
                key={user.id} 
                className={`user-item ${selectedUser && selectedUser.id === user.id ? 'selected' : ''}`}
                onClick={() => handleUserClick(user)}
              >
                <div className="user-info">
                  <h3>{user.name}</h3>
                  <p>{user.phone} | {user.age}세</p>
                </div>
                <div className="user-actions">
                  <div className="ride-count">
                    <span>총 {user.rideHistory.length}회 탑승</span>
                  </div>
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
            ))}
          </div>
        </div>
        
        <div className="detail-section">
          {selectedUser ? (
            <div className="user-details">
              <h2>이용자 상세 정보</h2>
              <div className="detail-info">
                <div className="detail-row">
                  <label>이름:</label>
                  <span>{selectedUser.name}</span>
                </div>
                <div className="detail-row">
                  <label>생년월일:</label>
                  <span>{selectedUser.birthDate} ({selectedUser.age}세)</span>
                </div>
                <div className="detail-row">
                  <label>성별:</label>
                  <span>{selectedUser.gender}</span>
                </div>
                <div className="detail-row">
                  <label>전화번호:</label>
                  <span>{selectedUser.phone}</span>
                </div>
                <div className="detail-row">
                  <label>가입 연도:</label>
                  <span>{selectedUser.joinYear}년</span>
                </div>
              </div>
              
              <div className="ride-history">
                <h3>탑승 기록</h3>
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>날짜</th>
                      <th>버스 번호</th>
                      <th>노선</th>
                      <th>탑승</th>
                      <th>하차</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedUser.rideHistory.map((ride) => (
                      <tr key={ride.id}>
                        <td>{ride.date}</td>
                        <td>{ride.busInfo.number}</td>
                        <td>{ride.busInfo.route}</td>
                        <td>{ride.boardingStation} ({ride.boardingTime})</td>
                        <td>{ride.alightingStation} ({ride.alightingTime})</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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