// components/BusManagement.js - 지도 문제 완전 해결 버전
import React, { useState, useEffect, useRef } from 'react';
import ApiService from '../services/api';
import '../styles/Management.css';

function BusManagement() {
  // 상태 관리
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [busLocationData, setBusLocationData] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [stations, setStations] = useState([]);
  const [organizationCache, setOrganizationCache] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
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

  // Ref를 사용한 안전한 지도 관리
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const isMapInitializing = useRef(false);

  // 컴포넌트 마운트 시 데이터 불러오기
  useEffect(() => {
    fetchBuses();
    fetchRoutes();
    fetchStations();
    loadKakaoMapScript();
  }, []);

  // 카카오맵 API 스크립트 로드
  const loadKakaoMapScript = () => {
    if (window.kakao && window.kakao.maps) {
      console.log('카카오맵 API가 이미 로드되어 있습니다.');
      setMapLoaded(true);
      return;
    }
    
    const script = document.createElement('script');
    script.id = 'kakao-map-script';
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=3b43e1905f0a0c9567279f725b9730ed&autoload=false`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => {
        console.log('카카오맵 API 로드 완료');
        setMapLoaded(true);
      });
    };
    
    document.head.appendChild(script);
  };

  // 버스 목록 불러오기 - 실제 데이터 구조에 맞게 수정
  const fetchBuses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await ApiService.getAllBuses();
      console.log('버스 API 응답 데이터:', response);
      
      let busData = [];
      
      // 응답 구조 분석 및 처리 - List<Bus> buses 형태
      if (response && Array.isArray(response.buses)) {
        busData = response.buses;
      } else if (response && Array.isArray(response.data)) {
        busData = response.data;
      } else if (response && response.data && !Array.isArray(response.data)) {
        busData = [response.data];
      } else if (Array.isArray(response)) {
        busData = response;
      } else {
        console.error('예상과 다른 응답 구조:', response);
        busData = [];
      }

      // 실제 Bus 엔티티 구조에 맞게 데이터 처리
      const processedBuses = busData.map(bus => ({
        id: bus.id || bus._id?.$oid || bus.busNumber,
        busNumber: bus.busNumber,
        totalSeats: bus.totalSeats || 45,
        occupiedSeats: bus.occupiedSeats || 0,
        availableSeats: bus.availableSeats || (bus.totalSeats - (bus.occupiedSeats || 0)),
        location: bus.location, // GeoJsonPoint 형태
        stationsNames: bus.stationsNames || [], // 정류장 이름 목록
        timestamp: bus.timestamp // Instant 타입
      }));

      console.log('처리된 버스 데이터:', processedBuses);
      setBuses(processedBuses);
      
    } catch (err) {
      console.error('Error fetching buses:', err);
      setError('버스 정보를 불러오는데 실패했습니다.');
      setBuses([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 노선 목록 불러오기 - 수정된 버전
  const fetchRoutes = async () => {
    try {
      const response = await ApiService.getAllRoutes();
      console.log('노선 API 응답:', response);
      
      let routeData = [];
      
      if (response && Array.isArray(response.data)) {
        routeData = response.data;
      } else if (response && response.data && !Array.isArray(response.data)) {
        routeData = [response.data];
      } else if (Array.isArray(response)) {
        routeData = response;
      } else {
        console.error('예상과 다른 노선 응답 구조:', response);
        routeData = [];
      }

      // MongoDB 구조에 맞게 데이터 처리
      const processedRoutes = routeData.map(route => ({
        id: route._id?.$oid || route.id,
        name: route.routeName || route.name,
        ...route
      }));

      console.log('처리된 노선 데이터:', processedRoutes);
      setRoutes(processedRoutes);
    } catch (err) {
      console.error('Error fetching routes:', err);
      setRoutes([]);
    }
  };

  // 정류장 목록 불러오기
  const fetchStations = async () => {
    try {
      const response = await ApiService.getAllStations();
      console.log('정류장 API 응답:', response);
      
      let stationData = [];
      
      if (response && Array.isArray(response.data)) {
        stationData = response.data;
      } else if (response && response.data && !Array.isArray(response.data)) {
        stationData = [response.data];
      } else if (Array.isArray(response)) {
        stationData = response;
      }

      const processedStations = stationData.map(station => ({
        id: station._id?.$oid || station.id,
        name: station.name,
        ...station
      }));

      console.log('처리된 정류장 데이터:', processedStations);
      setStations(processedStations);
    } catch (err) {
      console.error('Error fetching stations:', err);
      setStations([]);
    }
  };

  // 버스 검색 기능 - 실제 데이터 구조에 맞게 수정
  const searchBusesByNumber = async (busNumber) => {
    try {
      setIsLoading(true);
      const response = await ApiService.getBus(busNumber);
      
      if (response) {
        const processedBus = {
          id: response.id || response._id?.$oid || response.busNumber,
          busNumber: response.busNumber,
          totalSeats: response.totalSeats || 45,
          occupiedSeats: response.occupiedSeats || 0,
          availableSeats: response.availableSeats || (response.totalSeats - (response.occupiedSeats || 0)),
          location: response.location, // GeoJsonPoint 형태
          stationsNames: response.stationsNames || [], // 정류장 이름 목록
          timestamp: response.timestamp // Instant 타입
        };
        setBuses([processedBus]);
      } else {
        setBuses([]);
      }
      setError(null);
    } catch (err) {
      console.error('버스 검색 중 오류:', err);
      setError('버스 검색 중 오류가 발생했습니다.');
      setBuses([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 버스 클릭 처리 - 완전히 단순화
  const handleBusClick = async (bus) => {
    console.log('버스 클릭:', bus.busNumber);
    
    setSelectedBus(bus);
    setBusLocationData(null);
    setShowAddForm(false);
    setShowEditForm(false);
    
    // 지도 초기화 상태 리셋
    isMapInitializing.current = false;
    
    // 위치 정보 API 호출
    try {
      const locationResponse = await ApiService.getBusLocation(bus.busNumber);
      console.log('위치 API 응답:', locationResponse);
      
      if (locationResponse && locationResponse.data) {
        setBusLocationData(locationResponse.data);
        // useEffect에서 지도 초기화가 자동으로 실행됨
      } else {
        console.log('위치 정보가 없습니다.');
        setBusLocationData(null);
      }
    } catch (error) {
      console.error('위치 정보 로드 실패:', error);
      setBusLocationData(null);
    }
  };

  // 지도 초기화 - useEffect를 사용한 안전한 방식
  useEffect(() => {
    if (busLocationData && mapLoaded && selectedBus && !isMapInitializing.current) {
      initializeBusLocationMap(busLocationData);
    }
  }, [busLocationData, mapLoaded, selectedBus]);

  // 버스 위치 지도 초기화 - 완전히 새로운 안전한 방식
  const initializeBusLocationMap = (locationData) => {
    // 중복 초기화 방지
    if (isMapInitializing.current) {
      console.log('지도 초기화 중이므로 중복 호출 무시');
      return;
    }

    isMapInitializing.current = true;
    console.log('지도 초기화 시작');

    if (!mapLoaded || !window.kakao || !window.kakao.maps) {
      console.error('카카오맵이 로드되지 않았습니다.');
      isMapInitializing.current = false;
      return;
    }

    const mapContainer = document.getElementById('bus-location-map');
    if (!mapContainer) {
      console.error('지도 컨테이너를 찾을 수 없습니다.');
      isMapInitializing.current = false;
      return;
    }

    try {
      const latitude = locationData.latitude;
      const longitude = locationData.longitude;
      
      if (!isFinite(latitude) || !isFinite(longitude)) {
        console.error('유효하지 않은 좌표:', { latitude, longitude });
        mapContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">좌표 정보가 올바르지 않습니다.</div>';
        isMapInitializing.current = false;
        return;
      }

      console.log('지도 생성 좌표:', { latitude, longitude });

      // 기존 지도 인스턴스 정리
      if (mapInstanceRef.current) {
        try {
          // 기존 지도의 모든 이벤트 리스너 제거
          window.kakao.maps.event.removeListener(mapInstanceRef.current, 'tilesloaded');
          mapInstanceRef.current = null;
        } catch (e) {
          console.log('기존 지도 정리 중 오류 (무시 가능):', e);
        }
      }

      // 컨테이너 완전히 초기화
      mapContainer.innerHTML = '';
      mapContainer.style.width = '100%';
      mapContainer.style.height = '300px';
      mapContainer.style.position = 'relative';

      // 지도 생성
      const mapOptions = {
        center: new window.kakao.maps.LatLng(latitude, longitude),
        level: 3
      };

      const map = new window.kakao.maps.Map(mapContainer, mapOptions);
      mapInstanceRef.current = map;

      console.log('지도 객체 생성 완료');

      // 마커 생성
      const markerPosition = new window.kakao.maps.LatLng(latitude, longitude);
      const marker = new window.kakao.maps.Marker({
        position: markerPosition
      });
      marker.setMap(map);

      // 정보 창 생성
      const infoWindow = new window.kakao.maps.InfoWindow({
        content: `
          <div style="padding: 8px; min-width: 150px; text-align: center; font-size: 12px;">
            <strong>버스 ${selectedBus?.busNumber}</strong><br>
            <small>위도: ${latitude.toFixed(6)}<br>경도: ${longitude.toFixed(6)}</small>
          </div>
        `
      });
      infoWindow.open(map, marker);

      // 지도 크기 재조정
      setTimeout(() => {
        if (map && typeof map.relayout === 'function') {
          map.relayout();
          console.log('지도 초기화 완료');
        }
        isMapInitializing.current = false;
      }, 500);

    } catch (error) {
      console.error('지도 초기화 중 오류:', error);
      mapContainer.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #666;">
          <p>지도 생성에 실패했습니다.</p>
          <p style="font-size: 12px; color: #999;">오류: ${error.message}</p>
        </div>
      `;
      isMapInitializing.current = false;
    }
  };

  const handleAddBusClick = () => {
    setSelectedBus(null);
    setBusLocationData(null);
    setShowAddForm(true);
    setShowEditForm(false);
    setNewBus({
      busNumber: '',
      routeId: routes.length > 0 ? '' : '',
      totalSeats: 45
    });
  };

  const handleDeleteBus = async (busNumber) => {
    if (window.confirm('정말로 이 버스를 삭제하시겠습니까?')) {
      try {
        await ApiService.deleteBus(busNumber);
        setBuses(buses.filter(bus => bus.busNumber !== busNumber));
        if (selectedBus && selectedBus.busNumber === busNumber) {
          setSelectedBus(null);
          setBusLocationData(null);
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

  // 버스 추가 - 수정된 버전 (API 스펙에 맞게 수정)
  const handleAddBus = async (e) => {
    e.preventDefault();
    
    // 필수 필드 검증
    if (!newBus.busNumber.trim()) {
      alert('버스 번호를 입력해주세요.');
      return;
    }
    
    if (!newBus.routeId) {
      alert('노선을 선택해주세요.');
      return;
    }

    // API 스펙에 맞는 요청 데이터 구성
    const busData = {
      busNumber: newBus.busNumber.trim(),
      routeId: newBus.routeId,
      totalSeats: newBus.totalSeats.toString() // 문자열로 변환
    };
    
    try {
      console.log('버스 등록 요청 데이터:', busData);
      
      const response = await ApiService.addBus(busData);
      console.log('버스 등록 응답:', response);
      
      if (response) {
        // 성공 후 목록 새로고침
        await fetchBuses();
        setShowAddForm(false);
        
        // 폼 초기화
        setNewBus({
          busNumber: '',
          routeId: '',
          totalSeats: 45
        });
        
        alert('버스가 성공적으로 등록되었습니다.');
      }
    } catch (err) {
      console.error('Error adding bus:', err);
      
      // 오류 메시지 세분화
      if (err.message.includes('400')) {
        alert('입력한 정보를 확인해주세요. (버스 번호 중복 또는 잘못된 형식)');
      } else if (err.message.includes('401') || err.message.includes('ADMIN ROLE')) {
        alert('버스 등록에 실패했습니다. 관리자 권한이 필요합니다.');
      } else if (err.message.includes('404')) {
        alert('선택한 노선을 찾을 수 없습니다.');
      } else {
        alert(`버스 등록에 실패했습니다: ${err.message}`);
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

  // 버스 수정 - 수정된 버전
  const handleUpdateBus = async (e) => {
    e.preventDefault();
    
    // 필수 필드 검증
    if (!editBus.routeId) {
      alert('노선을 선택해주세요.');
      return;
    }
    
    // API 스펙에 맞는 요청 데이터 구성
    const busData = {
      busNumber: editBus.busNumber,
      routeId: editBus.routeId,
      totalSeats: editBus.totalSeats
    };
    
    try {
      console.log('버스 수정 요청 데이터:', busData);
      
      const response = await ApiService.updateBus(busData);
      console.log('버스 수정 응답:', response);
      
      if (response) {
        // 성공 후 목록 새로고침
        await fetchBuses();
        setShowEditForm(false);
        
        // 선택된 버스 정보도 업데이트
        const updatedBus = buses.find(bus => bus.busNumber === editBus.busNumber);
        if (updatedBus) {
          setSelectedBus({
            ...updatedBus,
            totalSeats: editBus.totalSeats
          });
        }
        
        alert('버스 정보가 성공적으로 수정되었습니다.');
      }
    } catch (err) {
      console.error('Error updating bus:', err);
      alert(`버스 정보 수정에 실패했습니다: ${err.message}`);
    }
  };

  // 노선 이름 찾기 (여전히 필요 - 폼에서 사용)
  const getRouteName = (routeId) => {
    if (!routeId) return '정보 없음';
    const route = routes.find(r => r.id === routeId);
    return route ? route.name : '알 수 없는 노선';
  };

  // 좌표 포맷팅 - 새로운 API 응답 구조에 맞게 수정 (소수점 첫째자리까지)
  const formatCoordinates = () => {
    if (!busLocationData) {
      return '위치 정보 없음';
    }
    
    const { latitude, longitude } = busLocationData;
    
    if (!isFinite(latitude) || !isFinite(longitude)) {
      return '위치 정보 형식 오류';
    }
    
    return `위도: ${latitude.toFixed(1)}, 경도: ${longitude.toFixed(1)}`;
  };

  // 시간 포맷팅 - 새로운 API 응답 구조에 맞게 수정
  const formatTimestamp = () => {
    if (!busLocationData || !busLocationData.timestamp) {
      return '정보 없음';
    }
    
    try {
      const date = new Date(busLocationData.timestamp);
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      console.error('시간 포맷팅 오류:', error);
      return '시간 정보 오류';
    }
  };

  // 정류장 목록 표시
  const renderStationsList = (stationsNames) => {
    if (!stationsNames || !Array.isArray(stationsNames) || stationsNames.length === 0) {
      return <span>정류장 정보 없음</span>;
    }
    
    return (
      <div className="stations-list">
        {stationsNames.map((stationName, index) => (
          <span key={index} className="station-badge">
            {index + 1}. {stationName}
            {index < stationsNames.length - 1 && ' → '}
          </span>
        ))}
      </div>
    );
  };

  // 버스 검색 (debounce 적용)
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
    
    window.searchTimeout = setTimeout(() => {
      if (value && value.trim()) {
        searchBusesByNumber(value.trim());
      } else {
        fetchBuses();
      }
    }, 300);
  };

  // 컴포넌트 언마운트 시 정리 - 지도 인스턴스 정리 포함
  useEffect(() => {
    return () => {
      // 검색 타이머 정리
      if (window.searchTimeout) {
        clearTimeout(window.searchTimeout);
      }
      
      // 지도 인스턴스 정리
      if (mapInstanceRef.current) {
        try {
          window.kakao.maps.event.removeListener(mapInstanceRef.current, 'tilesloaded');
          mapInstanceRef.current = null;
        } catch (e) {
          console.log('지도 정리 중 오류 (무시 가능):', e);
        }
      }
      
      // 초기화 상태 리셋
      isMapInitializing.current = false;
    };
  }, []);

  // 로딩 상태 표시
  if (isLoading && !selectedBus && !showAddForm && !showEditForm && buses.length === 0) {
    return (
      <div className="loading-container">
        <p>데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="bus-management">
      <div className="management-header">
        <h1>버스 관리</h1>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="management-container">
        <div className="list-section">
          <div className="list-header">
            <h2>버스 목록</h2>
            <div className="search-container">
              <input
                type="text"
                placeholder="버스 번호 검색..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="search-input"
              />
            </div>
            <button onClick={handleAddBusClick} className="add-button">+ 버스 등록</button>
          </div>
          <div className="bus-list">
            {isLoading && buses.length === 0 ? (
              <div className="loading">로딩 중...</div>
            ) : buses.length === 0 ? (
              <div className="empty-list">등록된 버스가 없습니다.</div>
            ) : (
              buses.map(bus => (
                <div
                  key={bus.id}
                  className={`bus-item ${selectedBus && selectedBus.id === bus.id ? 'selected' : ''}`}
                  onClick={() => handleBusClick(bus)}
                >
                  <div className="bus-info">
                    <h3>버스 {bus.busNumber}</h3>
                    <p>총 좌석: {bus.totalSeats}석</p>
                    <p>탑승: {bus.occupiedSeats}석 / 가용: {bus.availableSeats}석</p>
                    {bus.stationsNames && bus.stationsNames.length > 0 && (
                      <p className="route-info">
                        운행 노선: {bus.stationsNames[0]} → {bus.stationsNames[bus.stationsNames.length - 1]} 
                        ({bus.stationsNames.length}개 정류장)
                      </p>
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
          {selectedBus && !showEditForm ? (
            <div className="bus-details">
              <div className="detail-header">
                <h2>버스 상세 정보</h2>
                <button onClick={handleEditBusClick} className="edit-button">버스 정보 수정</button>
              </div>
              <div className="detail-info">
                <div className="detail-section-title">기본 정보</div>
                <div className="detail-row">
                  <label>버스 번호:</label>
                  <span>{selectedBus.busNumber}</span>
                </div>
                <div className="detail-row">
                  <label>총 좌석:</label>
                  <span>{selectedBus.totalSeats}석</span>
                </div>
                <div className="detail-row">
                  <label>탑승 좌석:</label>
                  <span>{selectedBus.occupiedSeats}석</span>
                </div>
                <div className="detail-row">
                  <label>가용 좌석:</label>
                  <span>{selectedBus.availableSeats}석</span>
                </div>
                <div className="detail-row">
                  <label>좌석 이용률:</label>
                  <span>
                    {selectedBus.totalSeats > 0 ? 
                      `${((selectedBus.occupiedSeats / selectedBus.totalSeats) * 100).toFixed(1)}%` : 
                      '0%'
                    }
                  </span>
                </div>
                
                <div className="detail-section-title">운행 노선 정보</div>
                <div className="detail-row">
                  <label>운행 정류장:</label>
                  <div className="stations-display">
                    {renderStationsList(selectedBus.stationsNames)}
                  </div>
                </div>
                <div className="detail-row">
                  <label>총 정류장 수:</label>
                  <span>
                    {selectedBus.stationsNames ? selectedBus.stationsNames.length : 0}개
                  </span>
                </div>
                
                <div className="detail-section-title">위치 정보</div>
                <div className="detail-row">
                  <label>현재 위치:</label>
                  <span>{formatCoordinates()}</span>
                </div>
                <div className="detail-row">
                  <label>위치 업데이트:</label>
                  <span>{formatTimestamp()}</span>
                </div>
                
                {/* 카카오맵 표시 - 스타일 개선 */}
                <div className="location-map-section">
                  <h4>실시간 위치</h4>
                  <div 
                    id="bus-location-map" 
                    className="bus-location-map"
                    style={{
                      width: '100%',
                      height: '300px',
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0',
                      backgroundColor: '#f8f9fa',
                      display: 'block',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {!mapLoaded ? (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        color: '#666',
                        fontSize: '14px'
                      }}>
                        카카오맵 API를 로딩 중입니다...
                      </div>
                    ) : !busLocationData ? (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        color: '#666',
                        fontSize: '14px'
                      }}>
                        위치 정보를 불러오는 중입니다...
                      </div>
                    ) : (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        color: '#666',
                        fontSize: '14px'
                      }}>
                        지도를 준비 중입니다...
                      </div>
                    )}
                  </div>
                  {busLocationData && (
                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                      <p>디버그 정보: 위도 {busLocationData.latitude}, 경도 {busLocationData.longitude}</p>
                      <p>지도 로드 상태: {mapLoaded ? '완료' : '로딩 중'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : showAddForm ? (
            <div className="add-bus-form">
              <h2>새 버스 등록</h2>
              <form onSubmit={handleAddBus}>
                <div className="form-section">
                  <div className="form-section-title">기본 정보</div>
                  <div className="form-group">
                    <label htmlFor="busNumber">버스 번호 (3~6자리 고유 코드) *</label>
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
                      placeholder="예: 108, 1234"
                      disabled // 버스 번호 입력 비활성화
                      style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
                    />
                    <small className="form-hint" style={{ color: '#999' }}>
                      버스 번호는 시스템에서 자동으로 할당됩니다.
                    </small>
                  </div>
                  <div className="form-group">
                    <label htmlFor="routeId">노선 *</label>
                    <select 
                      id="routeId" 
                      name="routeId" 
                      value={newBus.routeId} 
                      onChange={handleInputChange} 
                      required
                    >
                      <option value="">노선을 선택하세요</option>
                      {routes.length > 0 ? (
                        routes.map(route => (
                          <option key={route.id} value={route.id}>
                            {route.name}
                          </option>
                        ))
                      ) : (
                        <option disabled>노선 로딩 중...</option>
                      )}
                    </select>
                    {routes.length === 0 && (
                      <small className="form-hint">노선 정보를 불러오는 중입니다...</small>
                    )}
                    <small className="form-hint">
                      ※ 버스 등록 후 시스템에서 자동으로 해당 노선의 정류장 정보가 설정됩니다.
                    </small>
                  </div>
                  <div className="form-group">
                    <label htmlFor="totalSeats">총 좌석 *</label>
                    <input
                      type="number"
                      id="totalSeats"
                      name="totalSeats"
                      min="1"
                      max="100"
                      value={newBus.totalSeats}
                      onChange={handleInputChange}
                      required
                      placeholder="45"
                    />
                    <small className="form-hint">1~100 사이의 숫자를 입력하세요.</small>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="save-button" disabled={isLoading}>
                    {isLoading ? '등록 중...' : '등록'}
                  </button>
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => setShowAddForm(false)}
                    disabled={isLoading}
                  >
                    취소
                  </button>
                </div>
                
                <div className="admin-notice">
                  <p>※ 버스 등록은 관리자 권한이 필요합니다.</p>
                  <p>※ 버스 번호는 시스템에서 자동으로 할당됩니다.</p>
                  <p>※ 모든 필수 항목(*)을 입력해주세요.</p>
                </div>
              </form>
            </div>
          ) : showEditForm ? (
            <div className="edit-bus-form">
              <h3>버스 정보 수정</h3>
              <form onSubmit={handleUpdateBus}>
                <div className="form-section">
                  <div className="form-section-title">기본 정보</div>
                  <div className="form-group">
                    <label htmlFor="editBusNumber">버스 번호</label>
                    <input 
                      type="text" 
                      id="editBusNumber" 
                      name="busNumber" 
                      value={editBus.busNumber} 
                      onChange={handleBusInputChange} 
                      required 
                      readOnly
                      className="readonly-input"
                      style={{ backgroundColor: '#f0f0f0' }}
                    />
                    <small className="form-hint">버스 번호는 변경할 수 없습니다.</small>
                  </div>
                  <div className="form-group">
                    <label htmlFor="editRouteId">노선 *</label>
                    <select 
                      id="editRouteId" 
                      name="routeId" 
                      value={editBus.routeId} 
                      onChange={handleBusInputChange} 
                      required
                    >
                      <option value="">노선을 선택하세요</option>
                      {routes.length > 0 ? (
                        routes.map(route => (
                          <option key={route.id} value={route.id}>
                            {route.name}
                          </option>
                        ))
                      ) : (
                        <option disabled>노선 로딩 중...</option>
                      )}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="editTotalSeats">총 좌석 *</label>
                    <input 
                      type="number" 
                      id="editTotalSeats" 
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
                  <button type="submit" className="save-button" disabled={isLoading}>
                    {isLoading ? '저장 중...' : '저장'}
                  </button>
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={() => setShowEditForm(false)}
                    disabled={isLoading}
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