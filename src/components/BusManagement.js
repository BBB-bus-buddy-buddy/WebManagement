// components/BusManagement.js
import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';
import '../styles/Management.css';

function BusManagement() {
  // 상태 관리
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [editBus, setEditBus] = useState({
    busNumber: '',
    busRealNumber: '',
    routeId: '',
    totalSeats: 45,
    operationalStatus: 'ACTIVE',
    serviceStatus: 'NOT_IN_SERVICE'
  });
  const [newBus, setNewBus] = useState({
    busRealNumber: '',
    routeId: '',
    totalSeats: 45,
    operationalStatus: 'ACTIVE',
    serviceStatus: 'NOT_IN_SERVICE'
  });

  // 상태 옵션들
  const operationalStatusOptions = [
    { value: 'ACTIVE', label: '활성' },
    { value: 'INACTIVE', label: '비활성' },
    { value: 'MAINTENANCE', label: '정비중' }
  ];

  const serviceStatusOptions = [
    { value: 'IN_SERVICE', label: '운행중' },
    { value: 'NOT_IN_SERVICE', label: '운행 대기' },
    { value: 'OUT_OF_SERVICE', label: '운행 종료' }
  ];

  // 컴포넌트 마운트 시 버스 데이터와 노선 데이터 불러오기
  useEffect(() => {
    console.log('BusManagement 컴포넌트 마운트됨');
    fetchBuses();
    fetchRoutes();
  }, []);

  // 버스 목록 불러오기 (새 API 스펙에 맞게 수정)
  const fetchBuses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ApiService.getAllBuses();
      console.log('버스 API 응답 데이터:', response);
      
      let busData = [];
      
      // 새 API 응답 구조 처리
      if (response) {
        // 케이스 1: response.data가 배열인 경우
        if (response.data && Array.isArray(response.data)) {
          console.log('케이스 1: response.data 배열');
          busData = response.data;
        }
        // 케이스 2: response 자체가 배열인 경우
        else if (Array.isArray(response)) {
          console.log('케이스 2: response 자체가 배열');
          busData = response;
        }
        // 케이스 3: response가 단일 객체인 경우
        else if (response.busNumber) {
          console.log('케이스 3: response 단일 객체');
          busData = [response];
        }
      }
      
      console.log('파싱된 버스 데이터:', busData);
      console.log('버스 데이터 개수:', busData.length);
      
      if (busData.length > 0) {
        console.log('첫 번째 버스 데이터 샘플:', busData[0]);
      }
      
      setBuses(busData);
      
      if (busData.length === 0) {
        console.error('응답 데이터 형식이 예상과 다르거나 데이터가 없습니다:', response);
        setError('버스 데이터를 찾을 수 없습니다.');
      }
    } catch (err) {
      console.error('Error fetching buses:', err);
      setError(`버스 정보를 불러오는데 실패했습니다: ${err.message}`);
      setBuses([]);
    } finally {
      setLoading(false);
    }
  };

  // 노선 목록 불러오기
  const fetchRoutes = async () => {
    try {
      const response = await ApiService.apiRequest('routes');
      if (response && Array.isArray(response.data)) {
        setRoutes(response.data);
      } else if (response && response.data) {
        setRoutes([response.data]);
      } else if (Array.isArray(response)) {
        setRoutes(response);
      } else {
        console.error('노선 데이터 형식이 예상과 다릅니다:', response);
        setRoutes([]);
      }
    } catch (err) {
      console.error('Error fetching routes:', err);
      setRoutes([]);
    }
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
    setNewBus({
      busRealNumber: '',
      routeId: routes.length > 0 ? routes[0].id : '',
      totalSeats: 45,
      operationalStatus: 'ACTIVE',
      serviceStatus: 'NOT_IN_SERVICE'
    });
  };

  const handleDeleteBus = async (busNumber) => {
    if (window.confirm('정말로 이 버스를 삭제하시겠습니까?')) {
      try {
        await ApiService.deleteBus(busNumber);
        setBuses(buses.filter(bus => bus.busNumber !== busNumber));
        if (selectedBus && selectedBus.busNumber === busNumber) {
          setSelectedBus(null);
        }
        alert('버스가 성공적으로 삭제되었습니다.');
      } catch (err) {
        console.error('Error deleting bus:', err);
        alert('버스 삭제에 실패했습니다.');
      }
    }
  };

  const handleBusInputChange = (e) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    if (name === 'totalSeats') {
      processedValue = parseInt(value) || 45;
    }
    
    setEditBus({
      ...editBus,
      [name]: processedValue
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    if (name === 'totalSeats') {
      processedValue = parseInt(value) || 45;
    }
    
    setNewBus({
      ...newBus,
      [name]: processedValue
    });
  };

  // 버스 등록 (새 API 스펙에 맞게 수정)
  const handleAddBus = async (e) => {
    e.preventDefault();
    
    try {
      console.log('보내는 데이터:', newBus);
      const response = await ApiService.addBus(newBus);
      
      if (response) {
        console.log('저장된 버스 데이터:', response);
        fetchBuses(); // 버스 목록 새로고침
        setShowAddForm(false);
        alert('버스가 성공적으로 등록되었습니다.');
      }
    } catch (err) {
      console.error('Error adding bus:', err);
      if (err.message && err.message.includes('ADMIN ROLE')) {
        alert('버스 등록에 실패했습니다. 관리자 권한이 필요합니다.');
      } else {
        alert('버스 등록에 실패했습니다.');
      }
    }
  };

  const handleEditBusClick = () => {
    if (selectedBus) {
      const busToEdit = {
        busNumber: selectedBus.busNumber,
        busRealNumber: selectedBus.busRealNumber || '',
        routeId: selectedBus.routeId || '',
        totalSeats: selectedBus.totalSeats || 45,
        operationalStatus: selectedBus.operationalStatus || 'ACTIVE',
        serviceStatus: selectedBus.serviceStatus || 'NOT_IN_SERVICE'
      };
      
      setEditBus(busToEdit);
      setShowEditForm(true);
    } else {
      alert('먼저 버스를 선택해주세요.');
    }
  };

  // 버스 수정 (새 API 스펙에 맞게 수정)
  const handleUpdateBus = async (e) => {
    e.preventDefault();
    
    try {
      console.log('업데이트 데이터:', editBus);
      const response = await ApiService.updateBus(editBus);
      
      if (response) {
        // 업데이트 성공 후 버스 목록 새로고침
        fetchBuses();
        // 선택된 버스 정보 업데이트
        const updatedBus = buses.find(bus => bus.busNumber === editBus.busNumber);
        if (updatedBus) {
          setSelectedBus({ ...updatedBus, ...editBus });
        }
        setShowEditForm(false);
        alert('버스 정보가 성공적으로 수정되었습니다.');
      }
    } catch (err) {
      console.error('Error updating bus:', err);
      alert('버스 정보 수정에 실패했습니다.');
    }
  };

  // 노선 이름 찾기 (새 API에서는 routeName이 직접 포함됨)
  const getRouteName = (bus) => {
    // 새 API 응답에 routeName이 직접 포함되어 있음
    if (bus.routeName) {
      return bus.routeName;
    }
    
    // 백업: routeId로 노선 이름 찾기
    if (bus.routeId) {
      const route = routes.find(r => r.id === bus.routeId);
      return route ? (route.routeName || route.name) : bus.routeId;
    }
    
    return '정보 없음';
  };

  // 상태 라벨 가져오기
  const getOperationalStatusLabel = (status) => {
    const option = operationalStatusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  };

  const getServiceStatusLabel = (status) => {
    const option = serviceStatusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  };

  return (
    <div className="bus-management">
      <h1>버스 관리</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="management-container">
        {/* 디버깅을 위한 테스트 섹션 */}
        {error && (
          <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#ffebee', border: '1px solid #f44336', borderRadius: '4px' }}>
            <h4>오류 발생:</h4>
            <p>{error}</p>
            <button onClick={fetchBuses} style={{ marginTop: '10px', padding: '8px 16px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px' }}>
              다시 시도
            </button>
            <button 
              onClick={async () => {
                console.log('=== API 직접 테스트 시작 ===');
                try {
                  const response = await fetch('http://devse.kr:12589/api/bus', {
                    method: 'GET',
                    headers: {
                      'Authorization': `Bearer ${ApiService.getToken()}`,
                      'Content-Type': 'application/json',
                    },
                  });
                  console.log('응답 상태:', response.status);
                  console.log('응답 헤더:', response.headers);
                  const data = await response.json();
                  console.log('직접 fetch 결과:', data);
                  alert('콘솔에서 결과를 확인하세요');
                } catch (err) {
                  console.error('직접 fetch 오류:', err);
                  alert('직접 fetch 실패: ' + err.message);
                }
              }}
              style={{ marginTop: '10px', marginLeft: '10px', padding: '8px 16px', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              API 직접 테스트
            </button>
          </div>
        )}
        
        <div className="list-section">
          <div className="list-header">
            <h2>버스 목록</h2>
            <button onClick={handleAddBusClick} className="add-button">+ 버스 등록</button>
          </div>
          <div className="bus-list">
            {loading && buses.length === 0 ? (
              <div className="loading">로딩 중...</div>
            ) : buses.length === 0 ? (
              <div className="empty-list">등록된 버스가 없습니다.</div>
            ) : (
              buses.map(bus => (
                <div
                  key={bus.busNumber}
                  className={`bus-item ${selectedBus && selectedBus.busNumber === bus.busNumber ? 'selected' : ''}`}
                  onClick={() => handleBusClick(bus)}
                >
                  <div className="bus-info">
                    <h3>버스 {bus.busNumber}</h3>
                    <p>실제 번호: {bus.busRealNumber || '정보 없음'}</p>
                    <p>총 좌석: {bus.totalSeats || '정보 없음'}</p>
                    <p className="route-info">노선: {getRouteName(bus)}</p>
                    <p>상태: {getOperationalStatusLabel(bus.operationalStatus)} / {getServiceStatusLabel(bus.serviceStatus)}</p>
                    {/* 새 API 응답의 실시간 정보 표시 */}
                    <p>탑승객: {bus.currentPassengers || 0}명 / 가용석: {bus.availableSeats || bus.totalSeats || 0}석</p>
                    {bus.currentlyOperating && (
                      <p className="operating-status">🚌 현재 운행중</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteBus(bus.busNumber);
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
                      <span>{selectedBus.busNumber}</span>
                    </div>
                    <div className="detail-row">
                      <label>실제 버스 번호:</label>
                      <span>{selectedBus.busRealNumber || '정보 없음'}</span>
                    </div>
                    <div className="detail-row">
                      <label>노선:</label>
                      <span>{getRouteName(selectedBus)}</span>
                    </div>
                    <div className="detail-row">
                      <label>총 좌석:</label>
                      <span>{selectedBus.totalSeats || '정보 없음'}석</span>
                    </div>
                    <div className="detail-row">
                      <label>운영 상태:</label>
                      <span>{getOperationalStatusLabel(selectedBus.operationalStatus)}</span>
                    </div>
                    <div className="detail-row">
                      <label>서비스 상태:</label>
                      <span>{getServiceStatusLabel(selectedBus.serviceStatus)}</span>
                    </div>
                    
                    <div className="detail-section-title">실시간 정보</div>
                    <div className="detail-row">
                      <label>현재 탑승객:</label>
                      <span>{selectedBus.currentPassengers || 0}명</span>
                    </div>
                    <div className="detail-row">
                      <label>가용 좌석:</label>
                      <span>{selectedBus.availableSeats || selectedBus.totalSeats || 0}석</span>
                    </div>
                    <div className="detail-row">
                      <label>현재 운행 중:</label>
                      <span>{selectedBus.currentlyOperating ? '예' : '아니오'}</span>
                    </div>
                    
                    {selectedBus.currentDriverName && (
                      <>
                        <div className="detail-section-title">운행 정보</div>
                        <div className="detail-row">
                          <label>현재 기사:</label>
                          <span>{selectedBus.currentDriverName}</span>
                        </div>
                        <div className="detail-row">
                          <label>현재 운행 ID:</label>
                          <span>{selectedBus.currentOperationId || '정보 없음'}</span>
                        </div>
                      </>
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
                        <label htmlFor="busNumber">버스 번호</label>
                        <input 
                          type="text" 
                          id="busNumber" 
                          name="busNumber" 
                          value={editBus.busNumber} 
                          onChange={handleBusInputChange} 
                          required 
                          readOnly // 버스 번호는 변경 불가능
                        />
                        <small className="form-hint">버스 번호는 변경할 수 없습니다.</small>
                      </div>
                      <div className="form-group">
                        <label htmlFor="busRealNumber">실제 버스 번호</label>
                        <input 
                          type="text" 
                          id="busRealNumber" 
                          name="busRealNumber" 
                          value={editBus.busRealNumber} 
                          onChange={handleBusInputChange} 
                          placeholder="실제 버스 번호 입력"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="routeId">노선</label>
                        <select 
                          id="routeId" 
                          name="routeId" 
                          value={editBus.routeId} 
                          onChange={handleBusInputChange} 
                          required
                        >
                          <option value="">노선을 선택하세요</option>
                          {routes.map(route => (
                            <option key={route.id} value={route.id}>{route.routeName || route.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="totalSeats">총 좌석</label>
                        <input 
                          type="number" 
                          id="totalSeats" 
                          name="totalSeats" 
                          min="1"
                          max="100"
                          value={editBus.totalSeats} 
                          onChange={handleBusInputChange} 
                          required 
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="operationalStatus">운영 상태</label>
                        <select 
                          id="operationalStatus" 
                          name="operationalStatus" 
                          value={editBus.operationalStatus} 
                          onChange={handleBusInputChange} 
                          required
                        >
                          {operationalStatusOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="serviceStatus">서비스 상태</label>
                        <select 
                          id="serviceStatus" 
                          name="serviceStatus" 
                          value={editBus.serviceStatus} 
                          onChange={handleBusInputChange} 
                          required
                        >
                          {serviceStatusOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
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
                    <label htmlFor="busRealNumber">실제 버스 번호</label>
                    <input
                      type="text"
                      id="busRealNumber"
                      name="busRealNumber"
                      value={newBus.busRealNumber}
                      onChange={handleInputChange}
                      required
                      placeholder="실제 버스 번호 입력"
                    />
                    <small className="form-hint">실제 운행하는 버스의 번호를 입력하세요.</small>
                  </div>
                  <div className="form-group">
                    <label htmlFor="routeId">노선</label>
                    <select 
                      id="routeId" 
                      name="routeId" 
                      value={newBus.routeId} 
                      onChange={handleInputChange} 
                      required
                    >
                      <option value="">노선을 선택하세요</option>
                      {routes.map(route => (
                        <option key={route.id} value={route.id}>{route.routeName || route.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="totalSeats">총 좌석</label>
                    <input
                      type="number"
                      id="totalSeats"
                      name="totalSeats"
                      min="1"
                      max="100"
                      value={newBus.totalSeats}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="operationalStatus">운영 상태</label>
                    <select 
                      id="operationalStatus" 
                      name="operationalStatus" 
                      value={newBus.operationalStatus} 
                      onChange={handleInputChange} 
                      required
                    >
                      {operationalStatusOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="serviceStatus">서비스 상태</label>
                    <select 
                      id="serviceStatus" 
                      name="serviceStatus" 
                      value={newBus.serviceStatus} 
                      onChange={handleInputChange} 
                      required
                    >
                      {serviceStatusOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
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
                
                <div className="admin-notice">
                  <p>※ 버스 등록은 관리자 권한이 필요합니다.</p>
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