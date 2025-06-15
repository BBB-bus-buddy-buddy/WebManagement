// components/BusManagement.js - 실제 서버 구조에 맞게 수정
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
  const [searchTerm, setSearchTerm] = useState('');
  const [organizationNames, setOrganizationNames] = useState({}); // 조직 ID별 조직명 캐시
  const [editBus, setEditBus] = useState({
    busNumber: '',
    busRealNumber: '',
    routeId: '',
    totalSeats: 45
  });
  const [newBus, setNewBus] = useState({
    busRealNumber: '',
    routeId: '',
    totalSeats: 45
  });

  // 컴포넌트 마운트 시 버스 데이터와 노선 데이터 불러오기
  useEffect(() => {
    console.log('BusManagement 컴포넌트 마운트됨');
    fetchBuses();
    fetchRoutes();
  }, []);

  // 선택된 버스가 변경될 때마다 해당 조직명 가져오기
  useEffect(() => {
    if (selectedBus && selectedBus.organizationId && !organizationNames[selectedBus.organizationId]) {
      fetchOrganizationName(selectedBus.organizationId);
    }
  }, [selectedBus]);

  // 버스 목록 불러오기
  const fetchBuses = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('===== 버스 목록 조회 시작 =====');
      const busData = await ApiService.getAllBuses();
      
      console.log('받아온 버스 데이터:', busData);
      
      // 응답 데이터 검증 및 정규화
      let normalizedBusData = [];
      
      if (Array.isArray(busData)) {
        normalizedBusData = busData;
      } else if (busData && busData.data && Array.isArray(busData.data)) {
        normalizedBusData = busData.data;
      } else if (busData && typeof busData === 'object') {
        // 단일 객체인 경우 배열로 감싸기
        normalizedBusData = [busData];
      } else {
        console.warn('예상치 못한 버스 데이터 형태:', busData);
        normalizedBusData = [];
      }
      
      console.log('정규화된 버스 데이터:', normalizedBusData);
      console.log('버스 개수:', normalizedBusData.length);
      
      if (normalizedBusData.length > 0) {
        console.log('첫 번째 버스 샘플:', normalizedBusData[0]);
        
        // 각 버스의 조직명을 미리 가져와서 캐시
        const uniqueOrgIds = [...new Set(normalizedBusData.map(bus => bus.organizationId).filter(Boolean))];
        console.log('조직 ID 목록:', uniqueOrgIds);
        
        // 모든 조직명을 병렬로 가져오기
        await Promise.all(uniqueOrgIds.map(orgId => fetchOrganizationName(orgId)));
      }
      
      setBuses(normalizedBusData);
      console.log('===== 버스 목록 조회 완료 =====');
      
    } catch (err) {
      console.error('===== 버스 목록 조회 실패 =====');
      console.error('오류:', err);
      setError(`버스 정보를 불러오는데 실패했습니다: ${err.message}`);
      setBuses([]); // 에러 시 빈 배열로 설정
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

  // 조직명 가져오기 (Header.js 방식 참고 - 실제 API 사용)
  const fetchOrganizationName = async (organizationId) => {
    if (!organizationId) return '알 수 없는 조직';
    
    // 이미 캐시된 조직명이 있으면 사용
    if (organizationNames[organizationId]) {
      return organizationNames[organizationId];
    }
    
    try {
      // Header.js와 동일한 방식으로 조직 정보 조회
      const response = await ApiService.verifyOrganization(organizationId);
      
      if (response && response.data && response.data.name) {
        // 조직명을 캐시에 저장
        setOrganizationNames(prev => ({
          ...prev,
          [organizationId]: response.data.name
        }));
        return response.data.name;
      } else {
        // 조직명을 찾을 수 없는 경우 조직 ID 그대로 사용
        setOrganizationNames(prev => ({
          ...prev,
          [organizationId]: organizationId
        }));
        return organizationId;
      }
    } catch (error) {
      console.error('조직 정보 조회 실패:', error);
      // 오류 발생 시 조직 ID 그대로 사용
      setOrganizationNames(prev => ({
        ...prev,
        [organizationId]: organizationId
      }));
      return organizationId;
    }
  };

  // 동기 방식으로 조직명 반환 (캐시된 값만)
  const getOrganizationName = (organizationId) => {
    return organizationNames[organizationId] || organizationId || '알 수 없는 조직';
  };

  // 운행 상태 라벨 가져오기
  const getOperateStatusLabel = (operate) => {
    return operate ? '운행중' : '운행 중지';
  };

  // 마지막 업데이트 시간 포맷팅
  const formatLastUpdateTime = (timestamp) => {
    if (!timestamp) return '정보 없음';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return '유효하지 않은 시간';
    }
  };

  // 노선 이름 찾기 유틸리티 함수
  const getRouteName = (bus) => {
    // 1순위: 버스 객체에 직접 포함된 routeName
    if (bus.routeName) {
      return bus.routeName;
    }
    
    // 2순위: routeId로 routes 배열에서 찾기
    if (bus.routeId && routes.length > 0) {
      const route = routes.find(r => r.id === bus.routeId);
      return route ? (route.routeName || route.name) : '노선 정보 없음';
    }
    
    // 3순위: 기본값
    return '노선 정보 없음';
  };

  const getRouteNameById = (routeId) => {
    if (routeId && routes.length > 0) {
      const route = routes.find(r => r.id === routeId);
      return route ? (route.routeName || route.name) : '알 수 없는 노선';
    }
    return '노선 정보 없음';
  };

  // 안전한 버스 필터링 함수
  const getFilteredBuses = () => {
    // buses가 배열인지 확인
    if (!Array.isArray(buses)) {
      console.warn('buses가 배열이 아닙니다:', buses);
      return [];
    }

    if (!searchTerm) {
      return buses;
    }

    return buses.filter(bus => {
      const busNumber = bus.busNumber?.toString().toLowerCase() || '';
      const routeName = getRouteName(bus).toLowerCase();
      const search = searchTerm.toLowerCase();
      
      return busNumber.includes(search) || routeName.includes(search);
    });
  };

  // 버스 클릭 핸들러
  const handleBusClick = (bus) => {
    setSelectedBus(bus);
    setShowAddForm(false);
    setShowEditForm(false);
  };

  // 새 버스 추가 클릭 시
  const handleAddBusClick = () => {
    setSelectedBus(null);
    setShowAddForm(true);
    setShowEditForm(false);
    
    const initialBusData = {
      busRealNumber: '',
      routeId: routes.length > 0 ? routes[0].id : '',
      totalSeats: 45
    };
    
    console.log('새 버스 등록 초기 데이터:', initialBusData);
    setNewBus(initialBusData);
  };

  // 버스 삭제
  const handleDeleteBus = async (busNumber) => {
    if (window.confirm('정말로 이 버스를 삭제하시겠습니까?')) {
      try {
        await ApiService.deleteBus(busNumber);
        // 안전한 방식으로 필터링
        setBuses(prevBuses => Array.isArray(prevBuses) ? prevBuses.filter(bus => bus.busNumber !== busNumber) : []);
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

  // 수정용 입력 필드 변경 처리
  const handleBusInputChange = (e) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    if (name === 'totalSeats') {
      processedValue = parseInt(value) || 0;
    }
    
    console.log(`수정 버스 필드 변경: ${name} = ${processedValue}`);
    
    setEditBus({
      ...editBus,
      [name]: processedValue
    });
  };

  // 새 버스용 입력 필드 변경 처리
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    if (name === 'totalSeats') {
      processedValue = parseInt(value) || 0;
    }
    
    console.log(`새 버스 필드 변경: ${name} = ${processedValue}`);
    
    setNewBus({
      ...newBus,
      [name]: processedValue
    });
  };

  // 버스 등록 (실제 서버 스펙에 맞게 수정)
  const handleAddBus = async (e) => {
    e.preventDefault();
    
    try {
      console.log('===== 버스 등록 시작 =====');
      console.log('폼 데이터:', newBus);
      
      // 클라이언트 검증
      if (!newBus.busRealNumber) {
        alert('버스 번호를 입력해주세요.');
        return;
      }
      if (!newBus.routeId) {
        alert('노선을 선택해주세요.');
        return;
      }
      if (!newBus.totalSeats || newBus.totalSeats <= 0) {
        alert('올바른 좌석 수를 입력해주세요.');
        return;
      }
      
      // 버스 데이터 구성 (서버 스펙에 맞게)
      const busDataToAdd = {
        busRealNumber: newBus.busRealNumber,
        routeId: newBus.routeId,
        totalSeats: Number(newBus.totalSeats)
      };
      
      console.log('전송할 데이터:', busDataToAdd);
      
      const response = await ApiService.addBus(busDataToAdd);
      
      if (response && response.success) {
        console.log('버스 등록 성공:', response);
        
        // 버스 목록 새로고침
        await fetchBuses();
        
        // 폼 초기화
        setShowAddForm(false);
        setNewBus({
          busRealNumber: '',
          routeId: routes.length > 0 ? routes[0].id : '',
          totalSeats: 45
        });
        
        // 성공 메시지
        const busNumber = response.busNumber || '알 수 없음';
        alert(`버스가 성공적으로 등록되었습니다!\n가상 버스 번호: ${busNumber}\n실제 버스 번호: ${newBus.busRealNumber}\n노선: ${getRouteNameById(newBus.routeId)}\n좌석 수: ${newBus.totalSeats}석`);
        
        console.log('===== 버스 등록 완료 =====');
      }
    } catch (err) {
      console.error('===== 버스 등록 실패 =====');
      console.error('오류:', err);
      
      if (err.message && err.message.includes('ADMIN')) {
        alert('버스 등록에 실패했습니다. 관리자 권한이 필요합니다.');
      } else {
        alert(`버스 등록에 실패했습니다: ${err.message}`);
      }
    }
  };

  // 수정 버튼 클릭 시
  const handleEditBusClick = () => {
    if (selectedBus) {
      console.log('수정할 버스 선택:', selectedBus);
      
      const busToEdit = {
        busNumber: selectedBus.busNumber,
        busRealNumber: selectedBus.busRealNumber || '',
        routeId: selectedBus.routeId || '',
        totalSeats: selectedBus.totalSeats || 45
      };
      
      console.log('수정 폼에 설정할 데이터:', busToEdit);
      setEditBus(busToEdit);
      setShowEditForm(true);
    } else {
      alert('먼저 버스를 선택해주세요.');
    }
  };

  // 버스 수정 (실제 서버 스펙에 맞게 수정)
  const handleUpdateBus = async (e) => {
    e.preventDefault();
    
    try {
      console.log('===== 버스 수정 시작 =====');
      console.log('수정할 데이터:', editBus);
      
      // 클라이언트 검증
      if (!editBus.busNumber) {
        alert('버스 번호가 필요합니다.');
        return;
      }
      if (!editBus.busRealNumber) {
        alert('실제 버스 번호를 입력해주세요.');
        return;
      }
      if (!editBus.routeId) {
        alert('노선을 선택해주세요.');
        return;
      }
      if (!editBus.totalSeats || editBus.totalSeats <= 0) {
        alert('올바른 좌석 수를 입력해주세요.');
        return;
      }
      
      // 버스 수정 데이터 구성 (서버 스펙에 맞게)
      const busDataToUpdate = {
        busNumber: editBus.busNumber,
        busRealNumber: editBus.busRealNumber,
        routeId: editBus.routeId,
        totalSeats: Number(editBus.totalSeats)
      };
      
      console.log('전송할 수정 데이터:', busDataToUpdate);
      
      const response = await ApiService.updateBus(busDataToUpdate);
      
      if (response && response.success) {
        console.log('버스 수정 성공:', response);
        
        // 버스 목록 새로고침
        await fetchBuses();
        
        // 선택된 버스 정보 업데이트
        const updatedBus = Array.isArray(buses) ? buses.find(bus => bus.busNumber === editBus.busNumber) : null;
        if (updatedBus) {
          setSelectedBus({ ...updatedBus, ...busDataToUpdate });
        }
        
        // 수정 폼 닫기
        setShowEditForm(false);
        
        // 성공 메시지
        alert(`버스 정보가 성공적으로 수정되었습니다!\n가상 버스 번호: ${editBus.busNumber}\n실제 버스 번호: ${editBus.busRealNumber}\n노선: ${getRouteNameById(editBus.routeId)}\n좌석 수: ${editBus.totalSeats}석`);
        
        console.log('===== 버스 수정 완료 =====');
      }
    } catch (err) {
      console.error('===== 버스 수정 실패 =====');
      console.error('오류:', err);
      alert(`버스 정보 수정에 실패했습니다: ${err.message}`);
    }
  };

  // 필터된 버스 목록 가져오기
  const filteredBuses = getFilteredBuses();

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
            <p>현재 buses 타입: {Array.isArray(buses) ? '배열' : typeof buses}</p>
            <p>buses 내용: {JSON.stringify(buses)}</p>
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
            <div className="list-controls">
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="버스 번호 또는 노선 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button onClick={handleAddBusClick} className="add-button">+</button>
            </div>
          </div>
          <div className="bus-list">
            {loading && filteredBuses.length === 0 ? (
              <div className="loading">로딩 중...</div>
            ) : filteredBuses.length === 0 ? (
              <div className="empty-list">
                {searchTerm ? '검색 결과가 없습니다.' : '등록된 버스가 없습니다.'}
              </div>
            ) : (
              filteredBuses.map(bus => (
                <div
                  key={bus.busNumber}
                  className={`bus-item ${selectedBus && selectedBus.busNumber === bus.busNumber ? 'selected' : ''}`}
                  onClick={() => handleBusClick(bus)}
                >
                  <div className="bus-info">
                    <h3>버스 {bus.busNumber}</h3>
                    <p>노선: {getRouteName(bus)}</p>
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
                    <div className="detail-row">
                      <label>가상 버스 번호:</label>
                      <span className="detail-value">{selectedBus.busNumber}</span>
                    </div>
                    <div className="detail-row">
                      <label>실제 버스 번호:</label>
                      <span className="detail-value highlight">
                        {selectedBus.busRealNumber || '정보 없음'}
                      </span>
                    </div>
                    <div className="detail-row">
                      <label>운행 노선:</label>
                      <span className="detail-value highlight">
                        {getRouteName(selectedBus)}
                      </span>
                    </div>
                    <div className="detail-row">
                      <label>총 좌석 수:</label>
                      <span className="detail-value">
                        <strong>{selectedBus.totalSeats || '정보 없음'}</strong>석
                      </span>
                    </div>
                    <div className="detail-row">
                      <label>현재 운행 상태:</label>
                      <span className={`detail-value status-badge ${selectedBus.operate ? 'operating' : 'stopped'}`}>
                        {getOperateStatusLabel(selectedBus.operate)}
                      </span>
                    </div>
                    <div className="detail-row">
                      <label>소속:</label>
                      <span className="detail-value organization">
                        {getOrganizationName(selectedBus.organizationId)}
                      </span>
                    </div>
                    <div className="detail-row">
                      <label>마지막 업데이트:</label>
                      <span className="detail-value">
                        {formatLastUpdateTime(selectedBus.lastUpdateTime)}
                      </span>
                    </div>
                  </div>
                  <div className="detail-actions">
                    <button 
                      onClick={() => {
                        if (window.confirm(`정말로 버스 ${selectedBus.busNumber}를 삭제하시겠습니까?`)) {
                          handleDeleteBus(selectedBus.busNumber);
                        }
                      }}
                      className="delete-button"
                    >
                      버스 삭제
                    </button>
                  </div>
                </div>
              ) : (
                <div className="edit-bus-form">
                  <h3>버스 정보 수정</h3>
                  <div className="form-notice">
                    <p>※ 가상 버스 번호, 운행 상태, 조직 정보, 위치 정보는 시스템에서 자동으로 관리되며 수정할 수 없습니다.</p>
                  </div>
                  <form onSubmit={handleUpdateBus} className="bus-form">
                    <div className="form-group">
                      <label htmlFor="edit-busNumber">가상 버스 번호</label>
                      <input 
                        type="text" 
                        id="edit-busNumber" 
                        name="busNumber" 
                        value={editBus.busNumber} 
                        onChange={handleBusInputChange} 
                        required 
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                      <small className="form-hint">가상 버스 번호는 변경할 수 없습니다.</small>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="edit-busRealNumber">실제 버스 번호 *</label>
                      <input 
                        type="text" 
                        id="edit-busRealNumber" 
                        name="busRealNumber" 
                        value={editBus.busRealNumber} 
                        onChange={handleBusInputChange} 
                        required 
                        placeholder="예: 울산 74가 1234"
                      />
                      <small className="form-hint">버스의 실제 차량 번호를 입력하세요.</small>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="edit-routeId">운행 노선 *</label>
                      <select 
                        id="edit-routeId" 
                        name="routeId" 
                        value={editBus.routeId} 
                        onChange={handleBusInputChange} 
                        required
                      >
                        <option value="">노선을 선택하세요</option>
                        {routes.map(route => (
                          <option key={route.id} value={route.id}>
                            {route.routeName || route.name}
                          </option>
                        ))}
                      </select>
                      <small className="form-hint">현재 선택된 노선: {getRouteNameById(editBus.routeId)}</small>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="edit-totalSeats">총 좌석 수 *</label>
                      <input 
                        type="number" 
                        id="edit-totalSeats" 
                        name="totalSeats" 
                        min="1"
                        max="100"
                        value={editBus.totalSeats} 
                        onChange={handleBusInputChange} 
                        required 
                      />
                      <small className="form-hint">1~100 사이의 숫자를 입력하세요.</small>
                    </div>
                    
                    <div className="form-actions">
                      <button type="submit" className="save-button">수정 완료</button>
                      <button 
                        type="button" 
                        className="cancel-button"
                        onClick={() => setShowEditForm(false)}
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
              <form onSubmit={handleAddBus} className="bus-form">
                <div className="form-notice">
                  <p>※ 가상 버스 번호는 시스템에서 자동으로 생성됩니다.</p>
                  <p>※ 운행 상태, 조직 정보, 위치 정보는 시스템에서 자동으로 관리됩니다.</p>
                </div>
                
                <div className="form-group">
                  <label htmlFor="busRealNumber">실제 버스 번호 *</label>
                  <input
                    type="text"
                    id="busRealNumber"
                    name="busRealNumber"
                    value={newBus.busRealNumber}
                    onChange={handleInputChange}
                    required
                    placeholder="예: 울산 74가 1234"
                  />
                  <small className="form-hint">버스의 실제 차량 번호를 입력하세요.</small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="routeId">운행 노선 *</label>
                  <select 
                    id="routeId" 
                    name="routeId" 
                    value={newBus.routeId} 
                    onChange={handleInputChange} 
                    required
                  >
                    <option value="">노선을 선택하세요</option>
                    {routes.map(route => (
                      <option key={route.id} value={route.id}>
                        {route.routeName || route.name}
                      </option>
                    ))}
                  </select>
                  <small className="form-hint">버스가 운행할 노선을 선택하세요.</small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="totalSeats">총 좌석 수 *</label>
                  <input
                    type="number"
                    id="totalSeats"
                    name="totalSeats"
                    min="1"
                    max="100"
                    value={newBus.totalSeats}
                    onChange={handleInputChange}
                    required
                    placeholder="예: 45"
                  />
                  <small className="form-hint">1~100 사이의 숫자를 입력하세요.</small>
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
      
      {/* 인라인 스타일 */}
      <style jsx>{`
        .detail-value.highlight {
          color: #1976d2;
          font-weight: 600;
        }
        
        .detail-value.organization {
          color: #4caf50;
          font-weight: 600;
        }
        
        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.9em;
          font-weight: 500;
        }
        
        .status-badge.operating {
          background-color: #e8f5e8;
          color: #2e7d32;
        }
        
        .status-badge.stopped {
          background-color: #ffebee;
          color: #d32f2f;
        }
        
        .form-hint {
          display: block;
          margin-top: 4px;
          color: #666;
          font-size: 0.85em;
        }
        
        .detail-actions {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }
        
        .form-notice {
          background-color: #e3f2fd;
          border: 1px solid #2196f3;
          border-radius: 4px;
          padding: 10px;
          margin-bottom: 20px;
          color: #1976d2;
        }
      `}</style>
    </div>
  );
}

export default BusManagement;