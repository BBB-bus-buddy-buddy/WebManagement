// components/BusManagement.js
import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';
import '../styles/Management.css';

function BusManagement() {
  // 상태 관리
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [busDetails, setBusDetails] = useState(null);
  const [busSeats, setBusSeats] = useState(null);
  const [busLocation, setBusLocation] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [editBus, setEditBus] = useState({
    busNumber: '',
    routeId: '',
    totalSeats: 45
  });
  const [newBus, setNewBus] = useState({
    busNumber: '',
    routeId: '',
    totalSeats: 45
  });

  // 컴포넌트 마운트 시 버스 데이터와 노선 데이터 불러오기
  useEffect(() => {
    fetchBuses();
    fetchRoutes();
  }, []);

  // 버스 목록 불러오기
  const fetchBuses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ApiService.apiRequest('bus');
      console.log('API 응답 데이터:', response);
      
      if (response && Array.isArray(response.data)) {
        setBuses(response.data);
      } else if (response && response.data) {
        setBuses(response.data);
      } else {
        console.error('응답 데이터 형식이 예상과 다릅니다:', response);
        setBuses([]);
      }
    } catch (err) {
      console.error('Error fetching buses:', err);
      setError('버스 정보를 불러오는데 실패했습니다.');
      setBuses([]);
    } finally {
      setLoading(false);
    }
  };

  // 노선 목록 불러오기
  const fetchRoutes = async () => {
    try {
      const response = await ApiService.apiRequest('route');
      if (response && Array.isArray(response.data)) {
        setRoutes(response.data);
      } else if (response && response.data) {
        setRoutes(response.data);
      } else {
        console.error('노선 데이터 형식이 예상과 다릅니다:', response);
        setRoutes([]);
      }
    } catch (err) {
      console.error('Error fetching routes:', err);
      setRoutes([]);
    }
  };

  // 특정 버스 상세 정보 불러오기 
  const fetchBusDetail = async (busNumber) => {
    setLoading(true);
    setError(null);
    try {
      const response = await ApiService.apiRequest(`bus/${busNumber}`);
      if (response) {
        setBusDetails(response);
        return response;
      } else {
        setError('버스 상세 정보를 불러오는데 실패했습니다.');
        return null;
      }
    } catch (err) {
      console.error(`Error fetching bus ${busNumber} detail:`, err);
      setError('버스 상세 정보를 불러오는데 실패했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 버스 좌석 정보 불러오기
  const fetchBusSeats = async (busNumber) => {
    try {
      const response = await ApiService.apiRequest(`bus/seats/${busNumber}`);
      if (response) {
        setBusSeats(response);
        return response;
      }
      return null;
    } catch (err) {
      console.error(`Error fetching bus ${busNumber} seats:`, err);
      return null;
    }
  };

  // 버스 위치 정보 불러오기
  const fetchBusLocation = async (busNumber) => {
    try {
      const response = await ApiService.apiRequest(`bus/location/${busNumber}`);
      if (response) {
        setBusLocation(response);
        return response;
      }
      return null;
    } catch (err) {
      console.error(`Error fetching bus ${busNumber} location:`, err);
      return null;
    }
  };

  const handleBusClick = async (bus) => {
    setSelectedBus(bus);
    setShowAddForm(false);
    setShowEditForm(false);
    
    // 상세 정보, 좌석 정보, 위치 정보 불러오기
    const busDetail = await fetchBusDetail(bus.busNumber);
    if (busDetail) {
      await Promise.all([
        fetchBusSeats(bus.busNumber),
        fetchBusLocation(bus.busNumber)
      ]);
    }
  };

  const handleAddBusClick = () => {
    setSelectedBus(null);
    setBusDetails(null);
    setBusSeats(null);
    setBusLocation(null);
    setShowAddForm(true);
    setShowEditForm(false);
    setNewBus({
      busNumber: '',
      routeId: routes.length > 0 ? routes[0].id : '',
      totalSeats: 45
    });
  };

  const handleDeleteBus = async (busNumber) => {
    if (window.confirm('정말로 이 버스를 삭제하시겠습니까?')) {
      try {
        await ApiService.apiRequest(`bus/${busNumber}`, 'DELETE');
        setBuses(buses.filter(bus => bus.busNumber !== busNumber));
        if (selectedBus && selectedBus.busNumber === busNumber) {
          setSelectedBus(null);
          setBusDetails(null);
          setBusSeats(null);
          setBusLocation(null);
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

  const handleAddBus = async (e) => {
    e.preventDefault();
    
    // API 요청 파라미터 구성 - Admin ROLE만 사용 가능한 API
    const busData = {
      busNumber: newBus.busNumber,
      routeId: newBus.routeId,
      totalSeats: newBus.totalSeats
    };
    
    try {
      console.log('보내는 데이터:', busData);
      const response = await ApiService.apiRequest('bus', 'POST', busData);
      
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
        routeId: selectedBus.routeId || '',
        totalSeats: selectedBus.totalSeats || 45
      };
      
      setEditBus(busToEdit);
      setShowEditForm(true);
    } else {
      alert('먼저 버스를 선택해주세요.');
    }
  };

  const handleUpdateBus = async (e) => {
    e.preventDefault();
    
    try {
      console.log('업데이트 데이터:', editBus);
      const response = await ApiService.apiRequest('bus', 'PUT', editBus);
      
      if (response) {
        // 업데이트 성공 후 버스 목록 새로고침
        fetchBuses();
        // 선택된 버스 상세 정보 새로고침
        if (selectedBus) {
          const updatedBusDetail = await fetchBusDetail(editBus.busNumber);
          if (updatedBusDetail) {
            setSelectedBus(updatedBusDetail);
          }
        }
        setShowEditForm(false);
        alert('버스 정보가 성공적으로 수정되었습니다.');
      }
    } catch (err) {
      console.error('Error updating bus:', err);
      alert('버스 정보 수정에 실패했습니다.');
    }
  };

  // 노선 이름 찾기
  const getRouteName = (routeId) => {
    if (!routeId) return '정보 없음';
    const route = routes.find(r => r.id === routeId);
    return route ? route.name : routeId;
  };

  return (
    <div className="bus-management">
      <h1>버스 관리</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="management-container">
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
                    <p>총 좌석: {bus.totalSeats || '정보 없음'}</p>
                    <p className="route-info">노선: {getRouteName(bus.routeId)}</p>
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
                      <label>노선:</label>
                      <span>{getRouteName(selectedBus.routeId)}</span>
                    </div>
                    <div className="detail-row">
                      <label>총 좌석:</label>
                      <span>{selectedBus.totalSeats || '정보 없음'}</span>
                    </div>
                    
                    {busSeats && (
                      <>
                        <div className="detail-section-title">좌석 정보</div>
                        <div className="detail-row">
                          <label>탑승 좌석:</label>
                          <span>{busSeats.occupiedSeats || 0}석</span>
                        </div>
                        <div className="detail-row">
                          <label>가용 좌석:</label>
                          <span>{busSeats.availableSeats || selectedBus.totalSeats}석</span>
                        </div>
                      </>
                    )}
                    
                    {busLocation && (
                      <>
                        <div className="detail-section-title">위치 정보</div>
                        <div className="detail-row">
                          <label>위치 좌표:</label>
                          <span>
                            {busLocation.coordinates ? 
                              `위도: ${busLocation.coordinates[0]}, 경도: ${busLocation.coordinates[1]}` : 
                              '위치 정보 없음'}
                          </span>
                        </div>
                        <div className="detail-row">
                          <label>마지막 정류장:</label>
                          <span>{busLocation.prevStationId || '정보 없음'}</span>
                        </div>
                        <div className="detail-row">
                          <label>마지막 업데이트:</label>
                          <span>{busLocation.timestamp ? new Date(busLocation.timestamp).toLocaleString() : '정보 없음'}</span>
                        </div>
                      </>
                    )}
                    
                    {busDetails && busDetails.organizationId && (
                      <>
                        <div className="detail-section-title">기타 정보</div>
                        <div className="detail-row">
                          <label>소속:</label>
                          <span>{busDetails.organizationId}</span>
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
                            <option key={route.id} value={route.id}>{route.name}</option>
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
                    <label htmlFor="busNumber">버스 번호 (3~6자리 고유 코드)</label>
                    <input
                      type="text"
                      id="busNumber"
                      name="busNumber"
                      value={newBus.busNumber}
                      onChange={handleInputChange}
                      required
                      minLength="3"
                      maxLength="6"
                      pattern="[0-9]+"
                    />
                    <small className="form-hint">3~6자리의 숫자로 입력하세요.</small>
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
                        <option key={route.id} value={route.id}>{route.name}</option>
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