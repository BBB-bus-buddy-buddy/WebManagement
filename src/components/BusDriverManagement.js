// components/BusDriverManagement.js
import React, { useState } from 'react';

function BusDriverManagement() {
  // Dummy data for bus drivers - 주소 필드 제거 및 운행 기록 업데이트
  const [drivers, setDrivers] = useState([
    {
      id: 1,
      photo: '/api/placeholder/80/80',
      name: '김철수',
      birthDate: '1975-05-15',
      age: 50,
      gender: '남성',
      phone: '010-1234-5678',
      company: '서울교통',
      driverNumber: 'D-1001',
      joinYear: 2015,
      drivingRecords: [
        { date: '2025-03-30', busNumber: '108', route: '강남-송파', startTime: '08:00', endTime: '16:00' },
        { date: '2025-03-29', busNumber: '108', route: '강남-송파', startTime: '08:00', endTime: '16:00' },
        { date: '2025-03-28', busNumber: '108', route: '강남-송파', startTime: '08:00', endTime: '16:00' }
      ]
    },
    {
      id: 2,
      photo: '/api/placeholder/80/80',
      name: '박영희',
      birthDate: '1980-08-22',
      age: 45,
      gender: '여성',
      phone: '010-9876-5432',
      company: '서울교통',
      driverNumber: 'D-1002',
      joinYear: 2017,
      drivingRecords: [
        { date: '2025-03-30', busNumber: '302', route: '서초-강남', startTime: '14:00', endTime: '22:00' },
        { date: '2025-03-29', busNumber: '302', route: '서초-강남', startTime: '14:00', endTime: '22:00' },
        { date: '2025-03-28', busNumber: '302', route: '서초-강남', startTime: '14:00', endTime: '22:00' }
      ]
    },
    {
      id: 3,
      photo: '/api/placeholder/80/80',
      name: '이민수',
      birthDate: '1983-12-10',
      age: 42,
      gender: '남성',
      phone: '010-5555-7777',
      company: '송파교통',
      driverNumber: 'D-2001',
      joinYear: 2018,
      drivingRecords: [
        { date: '2025-03-30', busNumber: '401', route: '송파-강동', startTime: '06:00', endTime: '14:00' },
        { date: '2025-03-29', busNumber: '401', route: '송파-강동', startTime: '06:00', endTime: '14:00' },
        { date: '2025-03-28', busNumber: '401', route: '송파-강동', startTime: '06:00', endTime: '14:00' }
      ]
    }
  ]);

  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editDriver, setEditDriver] = useState(null);

  const handleDriverClick = (driver) => {
    setSelectedDriver(driver);
    setShowEditForm(false);
  };

  const handleDeleteDriver = (id) => {
    if (window.confirm('정말로 이 버스 기사를 삭제하시겠습니까?')) {
      setDrivers(drivers.filter(driver => driver.id !== id));
      if (selectedDriver && selectedDriver.id === id) {
        setSelectedDriver(null);
      }
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditDriver({
      ...editDriver,
      [name]: value
    });
  };

  return (
    <div className="bus-driver-management">
      <h1>버스 기사 관리</h1>
      <div className="management-container">
        <div className="list-section">
          <div className="list-header">
            <h2>버스 기사 목록</h2>
          </div>
          <div className="driver-list">
            {drivers.map(driver => (
              <div 
                key={driver.id} 
                className={`driver-item ${selectedDriver && selectedDriver.id === driver.id ? 'selected' : ''}`}
                onClick={() => handleDriverClick(driver)}
              >
                <div className="driver-photo">
                  <img src={driver.photo} alt={driver.name} />
                </div>
                <div className="driver-info">
                  <h3>{driver.name}</h3>
                  <p>{driver.company} | 기사번호: {driver.driverNumber}</p>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteDriver(driver.id);
                  }} 
                  className="delete-button"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="detail-section">
          {selectedDriver && !showEditForm ? (
            <div className="driver-details">
              <div className="detail-header">
                <h2>버스 기사 상세 정보</h2>
              </div>
              <div className="detail-grid">
                <div className="driver-photo-large">
                  <img src={selectedDriver.photo} alt={selectedDriver.name} />
                </div>
                <div className="detail-info">
                  <div className="detail-row">
                    <label>이름:</label>
                    <span>{selectedDriver.name}</span>
                  </div>
                  <div className="detail-row">
                    <label>생년월일:</label>
                    <span>{selectedDriver.birthDate} ({selectedDriver.age}세)</span>
                  </div>
                  <div className="detail-row">
                    <label>성별:</label>
                    <span>{selectedDriver.gender}</span>
                  </div>
                  <div className="detail-row">
                    <label>전화번호:</label>
                    <span>{selectedDriver.phone}</span>
                  </div>
                  <div className="detail-row">
                    <label>소속 회사:</label>
                    <span>{selectedDriver.company}</span>
                  </div>
                  <div className="detail-row">
                    <label>기사 번호:</label>
                    <span>{selectedDriver.driverNumber}</span>
                  </div>
                  <div className="detail-row">
                    <label>가입 연도:</label>
                    <span>{selectedDriver.joinYear}년</span>
                  </div>
                </div>
              </div>
              
              <div className="driving-records">
                <h3>운행 기록</h3>
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
                    {selectedDriver.drivingRecords.map((record, index) => (
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