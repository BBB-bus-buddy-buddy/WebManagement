// components/BusManagement.js
import React, { useState } from 'react';

function BusManagement() {
  // 버스 더미 데이터 - 추가 정보 포함
  const [buses, setBuses] = useState([
    {
      id: 1,
      number: '108',
      model: '현대 슈퍼에어로시티',
      capacity: 45,
      manufactureDate: '2022-05-15', // 출고 날짜
      year: 2022, // 연식
      price: 120000000, // 가격 (원)
      mileage: 45820, // 운행 키로수 (km)
      fuel: '디젤', // 연료 종류
      maintenanceStatus: '양호', // 정비 상태
      lastMaintenanceDate: '2025-02-15', // 최근 정비일
      insuranceExpiryDate: '2025-12-31', // 보험 만료일
      operationRecords: [
        { 
          id: 1, 
          route: '강남-송파', 
          driverName: '김철수', 
          date: '2025-03-30', 
          startTime: '08:00', 
          endTime: '16:00' 
        },
        { 
          id: 2, 
          route: '강남-송파', 
          driverName: '김철수', 
          date: '2025-03-29', 
          startTime: '08:00', 
          endTime: '16:00' 
        },
        { 
          id: 3, 
          route: '강남-송파', 
          driverName: '김철수', 
          date: '2025-03-28', 
          startTime: '08:00', 
          endTime: '16:00' 
        }
      ]
    },
    {
      id: 2,
      number: '302',
      model: '대우 BS110CN',
      capacity: 40,
      manufactureDate: '2021-08-20',
      year: 2021,
      price: 110000000,
      mileage: 67520,
      fuel: '디젤',
      maintenanceStatus: '점검 필요',
      lastMaintenanceDate: '2024-12-10',
      insuranceExpiryDate: '2025-09-15',
      operationRecords: [
        { 
          id: 1, 
          route: '서초-강남', 
          driverName: '박영희', 
          date: '2025-03-30', 
          startTime: '14:00', 
          endTime: '22:00' 
        },
        { 
          id: 2, 
          route: '서초-강남', 
          driverName: '박영희', 
          date: '2025-03-29', 
          startTime: '14:00', 
          endTime: '22:00' 
        }
      ]
    },
    {
      id: 3,
      number: '401',
      model: '현대 유니시티',
      capacity: 45,
      manufactureDate: '2023-02-10',
      year: 2023,
      price: 135000000,
      mileage: 28150,
      fuel: '전기',
      maintenanceStatus: '양호',
      lastMaintenanceDate: '2025-01-20',
      insuranceExpiryDate: '2026-02-28',
      operationRecords: [
        { 
          id: 1, 
          route: '송파-강동', 
          driverName: '이민수', 
          date: '2025-03-30', 
          startTime: '06:00', 
          endTime: '14:00' 
        }
      ]
    },
    {
      id: 4,
      number: '152',
      model: '현대 슈퍼에어로시티',
      capacity: 45,
      manufactureDate: '2022-11-05',
      year: 2022,
      price: 122000000,
      mileage: 38750,
      fuel: '디젤',
      maintenanceStatus: '양호',
      lastMaintenanceDate: '2025-03-01',
      insuranceExpiryDate: '2025-11-30',
      operationRecords: [
        { 
          id: 1, 
          route: '강북-도봉', 
          driverName: '최지영', 
          date: '2025-03-30', 
          startTime: '22:00', 
          endTime: '06:00' 
        }
      ]
    },
    {
      id: 5,
      number: '273',
      model: '대우 BS110CN',
      capacity: 40,
      manufactureDate: '2021-06-18',
      year: 2021,
      price: 108000000,
      mileage: 72380,
      fuel: '디젤',
      maintenanceStatus: '정비 중',
      lastMaintenanceDate: '2025-03-25',
      insuranceExpiryDate: '2025-07-10',
      operationRecords: [
        { 
          id: 1, 
          route: '종로-중구', 
          driverName: '정현우', 
          date: '2025-03-30', 
          startTime: '06:00', 
          endTime: '14:00' 
        }
      ]
    }
  ]);

  const [selectedBus, setSelectedBus] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editBus, setEditBus] = useState({
    number: '',
    model: '',
    capacity: 40,
    manufactureDate: '',
    year: new Date().getFullYear(),
    price: 0,
    mileage: 0,
    fuel: '디젤',
    maintenanceStatus: '양호',
    lastMaintenanceDate: '',
    insuranceExpiryDate: ''
  });
  const [newBus, setNewBus] = useState({
    number: '',
    model: '',
    capacity: 40,
    manufactureDate: '',
    year: new Date().getFullYear(),
    price: 0,
    mileage: 0,
    fuel: '디젤',
    maintenanceStatus: '양호',
    lastMaintenanceDate: '',
    insuranceExpiryDate: ''
  });

  // 가격을 화폐 형식으로 포맷팅하는 함수
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ko-KR', { 
      style: 'currency', 
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(value);
  };

  // 키로수를 포맷팅하는 함수
  const formatMileage = (value) => {
    return new Intl.NumberFormat('ko-KR').format(value) + ' km';
  };

  const handleBusClick = (bus) => {
    setSelectedBus(bus);
    setShowAddForm(false);
    setShowEditForm(false);
  };

  const handleAddBusClick = () => {
    setSelectedBus(null);
    setShowAddForm(true);
    setShowEditForm(false);
  };

  const handleDeleteBus = (id) => {
    if (window.confirm('정말로 이 버스를 삭제하시겠습니까?')) {
      setBuses(buses.filter(bus => bus.id !== id));
      if (selectedBus && selectedBus.id === id) {
        setSelectedBus(null);
      }
    }
  };

  const handleBusInputChange = (e) => {
    const { name, value } = e.target;
    // 입력값 형식에 따라 적절한 타입으로 변환
    let processedValue = value;
    
    if (name === 'capacity' || name === 'year') {
      processedValue = parseInt(value) || '';
    } else if (name === 'price' || name === 'mileage') {
      // 콤마 제거 후 숫자로 변환
      processedValue = parseInt(value.replace(/,/g, '')) || 0;
    }
    
    setEditBus({
      ...editBus,
      [name]: processedValue
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // 입력값 형식에 따라 적절한 타입으로 변환
    let processedValue = value;
    
    if (name === 'capacity' || name === 'year') {
      processedValue = parseInt(value) || '';
    } else if (name === 'price' || name === 'mileage') {
      // 콤마 제거 후 숫자로 변환
      processedValue = parseInt(value.replace(/,/g, '')) || 0;
    }
    
    setNewBus({
      ...newBus,
      [name]: processedValue
    });
  };

  const handleAddBus = (e) => {
    e.preventDefault();
    const newBusEntry = {
      id: buses.length + 1,
      operationRecords: [],
      ...newBus
    };

    setBuses([...buses, newBusEntry]);
    setShowAddForm(false);
    setNewBus({
      number: '',
      model: '',
      capacity: 40,
      manufactureDate: '',
      year: new Date().getFullYear(),
      price: 0,
      mileage: 0,
      fuel: '디젤',
      maintenanceStatus: '양호',
      lastMaintenanceDate: '',
      insuranceExpiryDate: ''
    });
  };

  const handleEditBusClick = () => {
    if (selectedBus) {
      setEditBus({...selectedBus});
      setShowEditForm(true);
    } else {
      alert('먼저 버스를 선택해주세요.');
    }
  };

  const handleUpdateBus = (e) => {
    e.preventDefault();
    
    // 운행 기록을 유지하기 위해 선택된 버스의 운행 기록 복사
    const updatedBus = {
      ...editBus,
      operationRecords: selectedBus.operationRecords
    };
    
    setBuses(buses.map(bus => 
      bus.id === updatedBus.id ? updatedBus : bus
    ));
    setSelectedBus(updatedBus);
    setShowEditForm(false);
  };

  // 화면에 표시할 연식 계산
  const calculateAge = (year) => {
    const currentYear = new Date().getFullYear();
    return currentYear - year;
  };

  // 보험 만료일 상태 확인
  const checkInsuranceStatus = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { status: '만료', className: 'expired' };
    } else if (diffDays <= 30) {
      return { status: '만료 임박', className: 'expiring-soon' };
    } else {
      return { status: '유효', className: 'valid' };
    }
  };

  return (
    <div className="bus-management">
      <h1>버스 관리</h1>
      <div className="management-container">
        <div className="list-section">
          <div className="list-header">
            <h2>버스 목록</h2>
            <button onClick={handleAddBusClick} className="add-button">+ 버스 등록</button>
          </div>
          <div className="bus-list">
            {buses.map(bus => (
              <div
                key={bus.id}
                className={`bus-item ${selectedBus && selectedBus.id === bus.id ? 'selected' : ''}`}
                onClick={() => handleBusClick(bus)}
              >
                <div className="bus-info">
                  <h3>버스 {bus.number}</h3>
                  <p>{bus.model} | {bus.capacity}석 | {bus.year}년식</p>
                  <p className="bus-mileage">{formatMileage(bus.mileage)}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteBus(bus.id);
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
          {selectedBus ? (
            <div className="bus-details">
              <div className="detail-header">
                <h2>버스 상세 정보</h2>
                {!showEditForm && (
                  <button onClick={handleEditBusClick} className="edit-button">버스 정보 수정</button>
                )}
              </div>
              {!showEditForm ? (
                <div>
                  <div className="detail-info">
                    <div className="detail-section-title">기본 정보</div>
                    <div className="detail-row">
                      <label>버스 번호:</label>
                      <span>{selectedBus.number}</span>
                    </div>
                    <div className="detail-row">
                      <label>버스 모델명:</label>
                      <span>{selectedBus.model}</span>
                    </div>
                    <div className="detail-row">
                      <label>좌석 정원:</label>
                      <span>{selectedBus.capacity}석</span>
                    </div>
                    <div className="detail-row">
                      <label>출고 날짜:</label>
                      <span>{selectedBus.manufactureDate}</span>
                    </div>
                    <div className="detail-row">
                      <label>연식:</label>
                      <span>{selectedBus.year}년 ({calculateAge(selectedBus.year)}년 경과)</span>
                    </div>
                    <div className="detail-row">
                      <label>구매 가격:</label>
                      <span>{formatCurrency(selectedBus.price)}</span>
                    </div>
                    
                    <div className="detail-section-title">운행 및 정비 정보</div>
                    <div className="detail-row">
                      <label>운행 키로수:</label>
                      <span>{formatMileage(selectedBus.mileage)}</span>
                    </div>
                    <div className="detail-row">
                      <label>연료 종류:</label>
                      <span>{selectedBus.fuel}</span>
                    </div>
                    <div className="detail-row">
                      <label>정비 상태:</label>
                      <span className={`maintenance-status ${selectedBus.maintenanceStatus === '양호' ? 'good' : selectedBus.maintenanceStatus === '정비 중' ? 'in-maintenance' : 'needs-maintenance'}`}>
                        {selectedBus.maintenanceStatus}
                      </span>
                    </div>
                    <div className="detail-row">
                      <label>최근 정비일:</label>
                      <span>{selectedBus.lastMaintenanceDate}</span>
                    </div>
                    
                  </div>
                  
                  <div className="operation-records">
                    <h3>운행 기록</h3>
                    {selectedBus.operationRecords && selectedBus.operationRecords.length > 0 ? (
                      <table className="records-table">
                        <thead>
                          <tr>
                            <th>날짜</th>
                            <th>노선</th>
                            <th>운전자</th>
                            <th>운행 시작 시간</th>
                            <th>운행 종료 시간</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedBus.operationRecords.map((record) => (
                            <tr key={record.id}>
                              <td>{record.date}</td>
                              <td>{record.route}</td>
                              <td>{record.driverName}</td>
                              <td>{record.startTime}</td>
                              <td>{record.endTime}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="no-records">운행 기록이 없습니다.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="edit-bus-form">
                  <h3>버스 정보 수정</h3>
                  <form onSubmit={handleUpdateBus}>
                    <div className="form-section">
                      <div className="form-section-title">기본 정보</div>
                      <div className="form-group">
                        <label htmlFor="number">버스 번호</label>
                        <input 
                          type="text" 
                          id="number" 
                          name="number" 
                          value={editBus.number} 
                          onChange={handleBusInputChange} 
                          required 
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="model">버스 모델명</label>
                        <input 
                          type="text" 
                          id="model" 
                          name="model" 
                          value={editBus.model} 
                          onChange={handleBusInputChange} 
                          required 
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="capacity">좌석 정원</label>
                        <input 
                          type="number" 
                          id="capacity" 
                          name="capacity" 
                          min="1"
                          value={editBus.capacity} 
                          onChange={handleBusInputChange} 
                          required 
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="manufactureDate">출고 날짜</label>
                        <input 
                          type="date" 
                          id="manufactureDate" 
                          name="manufactureDate" 
                          value={editBus.manufactureDate} 
                          onChange={handleBusInputChange} 
                          required 
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="year">연식</label>
                        <input 
                          type="number" 
                          id="year" 
                          name="year" 
                          min="1990"
                          max={new Date().getFullYear()}
                          value={editBus.year} 
                          onChange={handleBusInputChange} 
                          required 
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="price">구매 가격(원)</label>
                        <input 
                          type="text" 
                          id="price" 
                          name="price" 
                          value={editBus.price.toLocaleString()} 
                          onChange={handleBusInputChange} 
                          required 
                        />
                      </div>
                    </div>
                    
                    <div className="form-section">
                      <div className="form-section-title">운행 및 정비 정보</div>
                      <div className="form-group">
                        <label htmlFor="mileage">운행 키로수(km)</label>
                        <input 
                          type="text" 
                          id="mileage" 
                          name="mileage" 
                          value={editBus.mileage.toLocaleString()} 
                          onChange={handleBusInputChange} 
                          required 
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="fuel">연료 종류</label>
                        <select
                          id="fuel"
                          name="fuel"
                          value={editBus.fuel}
                          onChange={handleBusInputChange}
                          required
                        >
                          <option value="디젤">디젤</option>
                          <option value="CNG">CNG</option>
                          <option value="전기">전기</option>
                          <option value="수소">수소</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="maintenanceStatus">정비 상태</label>
                        <select
                          id="maintenanceStatus"
                          name="maintenanceStatus"
                          value={editBus.maintenanceStatus}
                          onChange={handleBusInputChange}
                          required
                        >
                          <option value="양호">양호</option>
                          <option value="점검 필요">점검 필요</option>
                          <option value="정비 중">정비 중</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="lastMaintenanceDate">최근 정비일</label>
                        <input 
                          type="date" 
                          id="lastMaintenanceDate" 
                          name="lastMaintenanceDate" 
                          value={editBus.lastMaintenanceDate} 
                          onChange={handleBusInputChange} 
                          required 
                        />
                      </div>
                    </div>
                    
                    <div className="form-actions">
                      <button type="submit" className="save-button">저장</button>
                      <button 
                        type="button" 
                        className="cancel-button"
                        onClick={() => {
                          setShowEditForm(false);
                        }}
                      >
                        취소
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ) : showAddForm ? (
            <div className="add-bus-form">
              <h2>새 버스 등록</h2>
              <form onSubmit={handleAddBus}>
                <div className="form-section">
                  <div className="form-section-title">기본 정보</div>
                  <div className="form-group">
                    <label htmlFor="number">버스 번호</label>
                    <input
                      type="text"
                      id="number"
                      name="number"
                      value={newBus.number}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="model">버스 모델명</label>
                    <input
                      type="text"
                      id="model"
                      name="model"
                      value={newBus.model}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="capacity">좌석 정원</label>
                    <input
                      type="number"
                      id="capacity"
                      name="capacity"
                      min="1"
                      value={newBus.capacity}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="manufactureDate">출고 날짜</label>
                    <input 
                      type="date" 
                      id="manufactureDate" 
                      name="manufactureDate" 
                      value={newBus.manufactureDate} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="year">연식</label>
                    <input 
                      type="number" 
                      id="year" 
                      name="year" 
                      min="1990"
                      max={new Date().getFullYear()}
                      value={newBus.year} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="price">구매 가격(원)</label>
                    <input 
                      type="text" 
                      id="price" 
                      name="price" 
                      value={newBus.price.toLocaleString()} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                </div>
                
                <div className="form-section">
                  <div className="form-section-title">운행 및 정비 정보</div>
                  <div className="form-group">
                    <label htmlFor="mileage">운행 키로수(km)</label>
                    <input 
                      type="text" 
                      id="mileage" 
                      name="mileage" 
                      value={newBus.mileage.toLocaleString()} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="fuel">연료 종류</label>
                    <select
                      id="fuel"
                      name="fuel"
                      value={newBus.fuel}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="디젤">디젤</option>
                      <option value="CNG">CNG</option>
                      <option value="전기">전기</option>
                      <option value="수소">수소</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="maintenanceStatus">정비 상태</label>
                    <select
                      id="maintenanceStatus"
                      name="maintenanceStatus"
                      value={newBus.maintenanceStatus}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="양호">양호</option>
                      <option value="점검 필요">점검 필요</option>
                      <option value="정비 중">정비 중</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastMaintenanceDate">최근 정비일</label>
                    <input 
                      type="date" 
                      id="lastMaintenanceDate" 
                      name="lastMaintenanceDate" 
                      value={newBus.lastMaintenanceDate} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="save-button">등록</button>
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => setShowAddForm(false)}
                  >
                    취소
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="no-selection">
              <p>좌측 목록에서 버스를 선택하거나 새 버스를 등록하세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BusManagement;