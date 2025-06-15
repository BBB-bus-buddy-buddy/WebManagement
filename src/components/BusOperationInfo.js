// components/BusOperationInfo.js - API 연동 개선 버전 (카카오맵 포함)
// 카카오맵 사용을 위해 .env 파일에 REACT_APP_KAKAO_MAP_KEY=your_api_key 추가 필요
import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';

function BusOperationInfo() {
  // 필터 상태
  const [filterType, setFilterType] = useState('current');
  
  // 데이터 상태
  const [currentBuses, setCurrentBuses] = useState([]);
  const [operationPlans, setOperationPlans] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  
  // 날짜 필터 상태
  const [operationDate, setOperationDate] = useState(new Date().toISOString().split('T')[0]);
  const [operationWeek, setOperationWeek] = useState(getWeekString(new Date()));
  const [operationMonth, setOperationMonth] = useState(new Date().toISOString().slice(0, 7));
  
  // 검색 필터 상태
  const [busNumberFilter, setBusNumberFilter] = useState('');
  const [driverNameFilter, setDriverNameFilter] = useState('');
  
  // 로딩 및 오류 상태
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 조직명 캐시
  const [organizationNames, setOrganizationNames] = useState({});
  
  // 버스 정보 캐시 (운행 계획에서 버스 정보 보완용)
  const [busCache, setBusCache] = useState({});
  
  // 기사 정보 캐시
  const [driverCache, setDriverCache] = useState({});
  
  // 카카오맵 관련 상태
  const [mapInstance, setMapInstance] = useState(null);
  const [markerInstance, setMarkerInstance] = useState(null);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadData();
  }, [filterType, operationDate, operationWeek, operationMonth]);

  // 카카오맵 스크립트 로드
  useEffect(() => {
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_MAP_KEY || 'YOUR_KAKAO_MAP_API_KEY'}&autoload=false`;
    script.async = true;
    
    script.onload = () => {
      window.kakao.maps.load(() => {
        console.log('카카오맵 API 로드 완료');
      });
    };
    
    document.head.appendChild(script);
    
    return () => {
      // 클린업: 마커와 맵 인스턴스 제거
      if (markerInstance) {
        markerInstance.setMap(null);
      }
    };
  }, []);

  // 선택된 버스가 변경될 때 맵 업데이트
  useEffect(() => {
    if (selectedBus && selectedBus.latitude && selectedBus.longitude && filterType === 'current') {
      updateMapLocation(selectedBus.latitude, selectedBus.longitude);
    }
  }, [selectedBus]);

  // 실시간 위치 업데이트 (30초마다)
  useEffect(() => {
    if (filterType === 'current' && selectedBus) {
      const interval = setInterval(() => {
        updateBusLocation(selectedBus.busNumber);
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [filterType, selectedBus]);

  // 주차 문자열 생성 함수
  function getWeekString(date) {
    const year = date.getFullYear();
    const firstDayOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    return `${year}-W${String(weekNumber).padStart(2, '0')}`;
  }

  // 데이터 로드 함수
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 버스 정보는 항상 로드 (캐시용)
      await loadBusesForCache();
      
      // 기사 정보도 로드 (캐시용)
      await loadDriversForCache();
      
      if (filterType === 'current') {
        await loadCurrentBuses();
      } else {
        await loadOperationPlans();
      }
    } catch (err) {
      console.error('데이터 로드 실패:', err);
      setError(`데이터를 불러오는데 실패했습니다: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 버스 정보 캐시 로드
  const loadBusesForCache = async () => {
    try {
      const response = await ApiService.getAllBuses();
      if (response && response.data) {
        const cache = {};
        response.data.forEach(bus => {
          cache[bus.busNumber] = bus;
          if (bus.id) cache[bus.id] = bus;
        });
        setBusCache(cache);
      }
    } catch (error) {
      console.error('버스 캐시 로드 실패:', error);
    }
  };

  // 기사 정보 캐시 로드
  const loadDriversForCache = async () => {
    try {
      const response = await ApiService.getOrganizationDrivers();
      if (response && response.data) {
        const cache = {};
        response.data.forEach(driver => {
          cache[driver.id] = driver;
        });
        setDriverCache(cache);
      }
    } catch (error) {
      console.error('기사 캐시 로드 실패:', error);
    }
  };

  // 현재 운행 중인 버스 데이터 로드
  const loadCurrentBuses = async () => {
    try {
      const busResponse = await ApiService.getAllBuses();
      
      if (busResponse && busResponse.data) {
        // 현재 운행 중인 버스만 필터링
        const operatingBuses = busResponse.data.filter(bus => bus.operate === true);
        
        // 각 버스의 조직명 로드
        const busesWithDetails = await Promise.all(
          operatingBuses.map(async (bus) => {
            // 조직명 가져오기
            if (bus.organizationId && !organizationNames[bus.organizationId]) {
              await fetchOrganizationName(bus.organizationId);
            }
            
            return {
              ...bus,
              nextStation: bus.currentStationName || '정보 없음',
              estimatedArrival: '정보 없음',
              departureTime: '정보 없음',
              status: bus.operate ? '정상' : '운행 중지',
              driverName: '실시간 정보 없음' // 현재 운행 중인 버스는 기사 정보가 없을 수 있음
            };
          })
        );
        
        setCurrentBuses(busesWithDetails);
      }
    } catch (error) {
      console.error('현재 운행 버스 로드 실패:', error);
      setCurrentBuses([]);
    }
  };

  // 운행 계획 데이터 로드
  const loadOperationPlans = async () => {
    try {
      let response;
      
      switch (filterType) {
        case 'daily':
          response = await ApiService.getOperationPlansByDate(operationDate);
          break;
        case 'weekly':
          // 주차 시작 날짜 계산
          const weekStartDate = getWeekStartDate(operationWeek);
          response = await ApiService.getWeeklyOperationPlans(weekStartDate);
          break;
        case 'monthly':
          response = await ApiService.getMonthlyOperationPlans(operationMonth);
          break;
        default:
          response = { data: [] };
      }
      
      if (response && response.data) {
        // 운행 계획 데이터 정규화 및 보완
        const normalizedPlans = await Promise.all(response.data.map(async (plan) => {
          // 버스 정보 보완
          const busInfo = busCache[plan.busNumber] || busCache[plan.busId] || {};
          
          // 기사 정보 보완
          const driverInfo = driverCache[plan.driverId] || {};
          
          return {
            id: plan.id || plan._id,
            busNumber: plan.busNumber || busInfo.busNumber || '정보 없음',
            busRealNumber: busInfo.busRealNumber || plan.busRealNumber || '정보 없음',
            routeName: plan.routeName || busInfo.routeName || '정보 없음',
            driverName: plan.driverName || driverInfo.name || '정보 없음',
            date: plan.operationDate || plan.date,
            totalPassengers: plan.totalPassengers || 0, // 서버에서 제공하면 사용
            startTime: plan.startTime || '정보 없음',
            endTime: plan.endTime || '정보 없음',
            status: plan.status || 'SCHEDULED',
            // 추가 정보
            busId: plan.busId,
            driverId: plan.driverId,
            routeId: plan.routeId
          };
        }));
        
        setOperationPlans(normalizedPlans);
      } else {
        setOperationPlans([]);
      }
    } catch (error) {
      console.error('운행 계획 로드 실패:', error);
      setOperationPlans([]);
    }
  };

  // 주차 시작 날짜 계산
  const getWeekStartDate = (weekString) => {
    const [year, week] = weekString.split('-W');
    const firstDayOfYear = new Date(parseInt(year), 0, 1);
    const daysToAdd = (parseInt(week) - 1) * 7 - firstDayOfYear.getDay() + 1;
    const weekStart = new Date(firstDayOfYear.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    return weekStart.toISOString().split('T')[0];
  };

  // 조직명 가져오기
  const fetchOrganizationName = async (organizationId) => {
    if (!organizationId || organizationNames[organizationId]) return;
    
    try {
      const response = await ApiService.verifyOrganization(organizationId);
      
      if (response && response.data && response.data.name) {
        setOrganizationNames(prev => ({
          ...prev,
          [organizationId]: response.data.name
        }));
      }
    } catch (error) {
      console.error('조직 정보 조회 실패:', error);
      setOrganizationNames(prev => ({
        ...prev,
        [organizationId]: organizationId
      }));
    }
  };

  // 조직명 반환
  const getOrganizationName = (organizationId) => {
    return organizationNames[organizationId] || organizationId || '알 수 없는 조직';
  };

  // 버스 클릭 핸들러
  const handleBusClick = (bus) => {
    setSelectedBus(bus);
  };

  // 맵 위치 업데이트 함수
  const updateMapLocation = (lat, lng) => {
    if (!window.kakao || !window.kakao.maps) {
      console.error('카카오맵 API가 로드되지 않았습니다.');
      return;
    }
    
    const mapContainer = document.getElementById('bus-location-map');
    if (!mapContainer) return;
    
    const mapOption = {
      center: new window.kakao.maps.LatLng(lat, lng),
      level: 3
    };
    
    // 기존 맵이 없으면 새로 생성
    if (!mapInstance) {
      const map = new window.kakao.maps.Map(mapContainer, mapOption);
      setMapInstance(map);
      
      // 마커 생성
      const markerPosition = new window.kakao.maps.LatLng(lat, lng);
      const marker = new window.kakao.maps.Marker({
        position: markerPosition,
        map: map
      });
      
      // 커스텀 오버레이 생성
      const content = `
        <div style="padding:5px 10px; background:white; border:1px solid #333; border-radius:5px;">
          <strong>버스 ${selectedBus?.busNumber || ''}</strong><br/>
          ${selectedBus?.currentStationName || '위치 정보'}
        </div>
      `;
      
      const customOverlay = new window.kakao.maps.CustomOverlay({
        map: map,
        position: markerPosition,
        content: content,
        yAnchor: 2.5
      });
      
      setMarkerInstance(marker);
    } else {
      // 기존 맵과 마커 위치 업데이트
      const moveLatLon = new window.kakao.maps.LatLng(lat, lng);
      mapInstance.setCenter(moveLatLon);
      
      if (markerInstance) {
        markerInstance.setPosition(moveLatLon);
      }
    }
  };

  // 실시간 버스 위치 업데이트
  const updateBusLocation = async (busNumber) => {
    try {
      setIsUpdatingLocation(true);
      const busData = await ApiService.getBus(busNumber);
      if (busData && busData.latitude && busData.longitude) {
        setSelectedBus(prev => ({
          ...prev,
          latitude: busData.latitude,
          longitude: busData.longitude,
          currentStationName: busData.currentStationName,
          currentStationIndex: busData.currentStationIndex,
          lastUpdateTime: busData.lastUpdateTime
        }));
        
        updateMapLocation(busData.latitude, busData.longitude);
      }
    } catch (error) {
      console.error('버스 위치 업데이트 실패:', error);
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  // 활성 필터 데이터 가져오기
  const getActiveFilterData = () => {
    if (filterType === 'current') {
      return currentBuses;
    } else {
      return operationPlans;
    }
  };

  // 필터링된 버스 목록 가져오기
  const getFilteredBuses = () => {
    const buses = getActiveFilterData();
    return buses.filter(bus => {
      // 버스 번호 필터링
      if (busNumberFilter && !bus.busNumber?.toString().includes(busNumberFilter)) {
        return false;
      }
      
      // 기사 이름 필터링
      if (driverNameFilter) {
        const driverName = bus.driverName || '';
        if (!driverName.includes(driverNameFilter)) {
          return false;
        }
      }
      
      return true;
    });
  };

  // 통계 정보 계산
  const getStatistics = () => {
    const filteredBuses = getFilteredBuses();
    
    if (filterType === 'current') {
      const totalBuses = filteredBuses.length;
      const normalOperation = filteredBuses.filter(bus => bus.status === '정상').length;
      const totalOccupied = filteredBuses.reduce((sum, bus) => sum + (bus.occupiedSeats || 0), 0);
      const totalCapacity = filteredBuses.reduce((sum, bus) => sum + (bus.totalSeats || 0), 0);
      
      return {
        totalBuses,
        normalOperation,
        occupancyRate: totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0
      };
    } else {
      const totalPlans = filteredBuses.length;
      const completedPlans = filteredBuses.filter(plan => plan.status === 'COMPLETED').length;
      const totalPassengers = filteredBuses.reduce((sum, plan) => sum + (plan.totalPassengers || 0), 0);
      
      return {
        totalPlans,
        completedPlans,
        totalPassengers
      };
    }
  };

  // 버스 목록 렌더링
  const renderBusList = () => {
    const filteredBuses = getFilteredBuses();
    const stats = getStatistics();
    
    if (loading) {
      return <div className="loading">데이터를 불러오는 중...</div>;
    }
    
    if (error) {
      return <div className="error">{error}</div>;
    }
    
    return (
      <div className="bus-operation-list">
        <div className="list-header">
          <h3>
            {filterType === 'current' ? '현재 운행 중인 버스' : 
             filterType === 'daily' ? `일별 운행 버스 (${operationDate})` :
             filterType === 'weekly' ? `주별 운행 버스 (${operationWeek})` : 
             `월별 운행 버스 (${operationMonth})`}
          </h3>
        </div>
        
        <div className="bus-grid">
          {filteredBuses.length === 0 ? (
            <div className="empty-list">
              {busNumberFilter || driverNameFilter ? '검색 결과가 없습니다.' : '운행 데이터가 없습니다.'}
            </div>
          ) : (
            filteredBuses.map(bus => (
              <div 
                key={bus.id || `${bus.busNumber}-${bus.date}`} 
                className={`bus-card ${selectedBus && (selectedBus.id === bus.id || (selectedBus.busNumber === bus.busNumber && selectedBus.date === bus.date)) ? 'selected' : ''}`}
                onClick={() => handleBusClick(bus)}
              >
                <div className="bus-card-header">
                  <h4>버스 {bus.busNumber}</h4>
                  {bus.busRealNumber && bus.busRealNumber !== bus.busNumber && (
                    <span className="bus-real-number">({bus.busRealNumber})</span>
                  )}
                  <span className="bus-route">{bus.routeName || '노선 정보 없음'}</span>
                </div>
                <div className="bus-card-body">
                  <div className="driver-info">
                    <span>기사: {bus.driverName || '정보 없음'}</span>
                  </div>
                  {filterType === 'current' ? (
                    <div className="status-info">
                      <span className={`status ${bus.operate ? 'normal' : 'delayed'}`}>
                        {bus.status}
                      </span>
                      <span className="occupancy">
                        탑승: {bus.occupiedSeats || 0}/{bus.totalSeats || 0}명
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="time-info">
                        <span>운행시간: {bus.startTime} - {bus.endTime}</span>
                      </div>
                      <div className="passenger-info">
                        <span>총 탑승객: {bus.totalPassengers || 0}명</span>
                        <span className={`status ${bus.status === 'COMPLETED' ? 'completed' : bus.status === 'IN_PROGRESS' ? 'in-progress' : 'scheduled'}`}>
                          {bus.status === 'COMPLETED' ? '완료' : bus.status === 'IN_PROGRESS' ? '운행중' : '예정'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // 버스 상세 정보 렌더링
  const renderBusDetail = () => {
    if (!selectedBus) return null;
    
    if (filterType === 'current') {
      return (
        <div className="bus-detail">
          <h3>버스 상세 정보</h3>
          <div className="detail-grid">
            <div className="detail-section">
              <h4>기본 정보</h4>
              <div className="detail-row">
                <label>버스 번호:</label>
                <span>{selectedBus.busNumber}</span>
              </div>
              <div className="detail-row">
                <label>실제 번호:</label>
                <span>{selectedBus.busRealNumber || '정보 없음'}</span>
              </div>
              <div className="detail-row">
                <label>노선:</label>
                <span>{selectedBus.routeName || '정보 없음'}</span>
              </div>
              <div className="detail-row">
                <label>상태:</label>
                <span className={`status ${selectedBus.operate ? 'normal' : 'delayed'}`}>
                  {selectedBus.status}
                </span>
              </div>
              <div className="detail-row">
                <label>탑승객:</label>
                <span>{selectedBus.occupiedSeats || 0}/{selectedBus.totalSeats || 0}명</span>
              </div>
              <div className="detail-row">
                <label>다음 정류장:</label>
                <span>{selectedBus.nextStation}</span>
              </div>
              <div className="detail-row">
                <label>현재 정류장 순서:</label>
                <span>{selectedBus.currentStationIndex || 0}/{selectedBus.totalStations || 0}</span>
              </div>
              <div className="detail-row">
                <label>소속:</label>
                <span>{getOrganizationName(selectedBus.organizationId)}</span>
              </div>
              <div className="detail-row">
                <label>마지막 업데이트:</label>
                <span>{selectedBus.lastUpdateTime ? new Date(selectedBus.lastUpdateTime).toLocaleString() : '정보 없음'}</span>
              </div>
            </div>
          </div>
          
          <div className="map-section">
            <div className="map-header">
              <h4>실시간 위치</h4>
              {isUpdatingLocation && (
                <span className="update-indicator">
                  <span className="update-dot"></span>
                  업데이트 중...
                </span>
              )}
            </div>
            <div className="map-container">
              {selectedBus.latitude && selectedBus.longitude ? (
                <div id="bus-location-map" className="kakao-map"></div>
              ) : (
                <div className="map-placeholder">
                  <p>위치 정보가 없습니다.</p>
                </div>
              )}
            </div>
            {selectedBus.latitude && selectedBus.longitude && (
              <div className="location-info">
                <div className="location-row">
                  <span className="location-label">좌표:</span>
                  <span className="location-value">{selectedBus.latitude.toFixed(6)}, {selectedBus.longitude.toFixed(6)}</span>
                </div>
                <div className="location-row">
                  <span className="location-label">마지막 업데이트:</span>
                  <span className="location-value">
                    {selectedBus.lastUpdateTime ? new Date(selectedBus.lastUpdateTime).toLocaleTimeString() : '정보 없음'}
                  </span>
                </div>
                <div className="location-row">
                  <span className="location-label">현재 정류장:</span>
                  <span className="location-value">{selectedBus.currentStationName || '정보 없음'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    } else {
      // 과거 운행 데이터 상세 정보
      return (
        <div className="bus-detail">
          <h3>버스 운행 정보</h3>
          <div className="detail-grid">
            <div className="detail-section">
              <h4>기본 정보</h4>
              <div className="detail-row">
                <label>버스 번호:</label>
                <span>{selectedBus.busNumber}</span>
              </div>
              <div className="detail-row">
                <label>실제 번호:</label>
                <span>{selectedBus.busRealNumber || '정보 없음'}</span>
              </div>
              <div className="detail-row">
                <label>노선:</label>
                <span>{selectedBus.routeName}</span>
              </div>
              <div className="detail-row">
                <label>기사 이름:</label>
                <span>{selectedBus.driverName}</span>
              </div>
              <div className="detail-row">
                <label>운행 날짜:</label>
                <span>{selectedBus.date}</span>
              </div>
              <div className="detail-row">
                <label>운행 시간:</label>
                <span>{selectedBus.startTime} - {selectedBus.endTime}</span>
              </div>
              <div className="detail-row">
                <label>상태:</label>
                <span className={`status ${selectedBus.status === 'COMPLETED' ? 'completed' : selectedBus.status === 'IN_PROGRESS' ? 'in-progress' : 'scheduled'}`}>
                  {selectedBus.status === 'COMPLETED' ? '완료' : selectedBus.status === 'IN_PROGRESS' ? '운행중' : '예정'}
                </span>
              </div>
              <div className="detail-row">
                <label>총 탑승객:</label>
                <span>{selectedBus.totalPassengers || 0}명</span>
              </div>
              {selectedBus.status === 'COMPLETED' && (
                <>
                  <div className="detail-row">
                    <label>평균 탑승률:</label>
                    <span>{Math.round((selectedBus.totalPassengers || 0) / (selectedBus.totalSeats || 45) * 100)}%</span>
                  </div>
                  <div className="detail-row">
                    <label>운행 시간:</label>
                    <span>{calculateOperationDuration(selectedBus.startTime, selectedBus.endTime)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {selectedBus.status === 'COMPLETED' && (
            <div className="performance-section">
              <h4>운행 성과</h4>
              <div className="performance-metrics">
                <div className="metric">
                  <span className="metric-label">정시 운행률</span>
                  <span className="metric-value">95%</span>
                </div>
                <div className="metric">
                  <span className="metric-label">고객 만족도</span>
                  <span className="metric-value">4.5/5.0</span>
                </div>
                <div className="metric">
                  <span className="metric-label">연료 효율</span>
                  <span className="metric-value">우수</span>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
  };

  // 운행 시간 계산 함수
  const calculateOperationDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '정보 없음';
    
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    let durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    
    if (durationMinutes < 0) {
      durationMinutes += 24 * 60; // 다음날로 넘어간 경우
    }
    
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    return `${hours}시간 ${minutes}분`;
  };

  return (
    <div className="bus-operation-info">
      
      <div className="filter-section">
        <div className="filter-row">
          <div className="filter-group">
            <label>조회 유형:</label>
            <select 
              value={filterType} 
              onChange={(e) => {
                setFilterType(e.target.value);
                setSelectedBus(null);
              }}
            >
              <option value="current">현재 운행 중</option>
              <option value="daily">일별</option>
              <option value="weekly">주별</option>
              <option value="monthly">월별</option>
            </select>
          </div>
          
          {filterType === 'daily' && (
            <div className="filter-group">
              <label>날짜:</label>
              <input 
                type="date" 
                value={operationDate}
                onChange={(e) => setOperationDate(e.target.value)}
              />
            </div>
          )}
          
          {filterType === 'weekly' && (
            <div className="filter-group">
              <label>주간:</label>
              <input 
                type="week" 
                value={operationWeek}
                onChange={(e) => setOperationWeek(e.target.value)}
              />
            </div>
          )}
          
          {filterType === 'monthly' && (
            <div className="filter-group">
              <label>월:</label>
              <input 
                type="month" 
                value={operationMonth}
                onChange={(e) => setOperationMonth(e.target.value)}
              />
            </div>
          )}
        </div>
        
        <div className="filter-row">
          <div className="filter-group">
            <label>버스 번호:</label>
            <input 
              type="text" 
              value={busNumberFilter}
              onChange={(e) => setBusNumberFilter(e.target.value)}
              placeholder="버스 번호"
            />
          </div>
          
          <div className="filter-group">
            <label>기사 이름:</label>
            <input 
              type="text" 
              value={driverNameFilter}
              onChange={(e) => setDriverNameFilter(e.target.value)}
              placeholder="기사 이름"
            />
          </div>
          
          <div className="filter-group">
            <button onClick={loadData} className="refresh-button">
              🔄 새로고침
            </button>
          </div>
        </div>
      </div>
      
      <div className="operation-container">
        <div className="operation-list-section">
          {renderBusList()}
        </div>
        
        <div className="operation-detail-section">
          {selectedBus ? (
            renderBusDetail()
          ) : (
            <div className="no-selection">
              <p>좌측 목록에서 버스를 선택하세요.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* 스타일 */}
      <style jsx>{`
        .bus-operation-info {
          padding: 20px;
        }
        
        .filter-section {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .filter-row {
          display: flex;
          gap: 20px;
          margin-bottom: 15px;
          align-items: end;
        }
        
        .filter-row:last-child {
          margin-bottom: 0;
        }
        
        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .filter-group label {
          font-weight: 600;
          color: #333;
        }
        
        .filter-group input,
        .filter-group select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .refresh-button {
          padding: 8px 16px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .refresh-button:hover {
          background-color: #0056b3;
        }
        
        .operation-container {
          display: flex;
          gap: 20px;
          height: calc(100vh - 300px);
        }
        
        .operation-list-section {
          flex: 1;
          overflow-y: auto;
        }
        
        .operation-detail-section {
          flex: 1;
          overflow-y: auto;
        }
        
        .list-header {
          margin-bottom: 20px;
        }
        
        .list-header h3 {
          margin: 0 0 10px 0;
          color: #333;
        }
        
        .statistics {
          color: #666;
          font-size: 14px;
        }
        
        .statistics .divider {
          margin: 0 10px;
          color: #ccc;
        }
        
        .bus-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .bus-card {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
          background: white;
        }
        
        .bus-card:hover {
          border-color: #007bff;
          box-shadow: 0 2px 8px rgba(0,123,255,0.1);
        }
        
        .bus-card.selected {
          border-color: #007bff;
          background-color: #e3f2fd;
        }
        
        .bus-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        
        .bus-card-header h4 {
          margin: 0;
          color: #333;
        }
        
        .bus-real-number {
          color: #666;
          font-size: 12px;
        }
        
        .bus-route {
          color: #666;
          font-size: 14px;
          margin-left: auto;
        }
        
        .bus-card-body {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .time-info {
          color: #555;
          font-size: 13px;
        }
        
        .passenger-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .status {
          font-size: 12px;
          padding: 2px 8px;
          border-radius: 4px;
        }
        
        .status.normal {
          color: #28a745;
          background-color: #d4edda;
        }
        
        .status.delayed {
          color: #dc3545;
          background-color: #f8d7da;
        }
        
        .status.completed {
          color: #155724;
          background-color: #d4edda;
        }
        
        .status.in-progress {
          color: #856404;
          background-color: #fff3cd;
        }
        
        .status.scheduled {
          color: #004085;
          background-color: #cce5ff;
        }
        
        .loading, .error, .empty-list {
          text-align: center;
          padding: 40px;
          color: #666;
        }
        
        .error {
          color: #dc3545;
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 4px;
        }
        
        .bus-detail {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .detail-grid {
          margin-bottom: 20px;
        }
        
        .detail-section {
          margin-bottom: 20px;
        }
        
        .detail-section h4 {
          margin: 0 0 15px 0;
          color: #333;
          border-bottom: 1px solid #eee;
          padding-bottom: 5px;
        }
        
        .detail-row {
          display: flex;
          margin-bottom: 10px;
        }
        
        .detail-row label {
          font-weight: 600;
          min-width: 140px;
          color: #555;
        }
        
        .detail-row span {
          color: #333;
        }
        
        .map-section, .performance-section {
          margin-top: 20px;
        }
        
        .map-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        
        .map-header h4 {
          margin: 0;
        }
        
        .update-indicator {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: #666;
        }
        
        .update-dot {
          width: 8px;
          height: 8px;
          background-color: #28a745;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .map-container {
          border: 1px solid #ddd;
          border-radius: 4px;
          overflow: hidden;
          height: 400px;
        }
        
        .kakao-map {
          width: 100%;
          height: 100%;
        }
        
        .map-placeholder {
          height: 100%;
          background-color: #f8f9fa;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          color: #666;
        }
        
        .location-info {
          margin-top: 10px;
          padding: 10px;
          background-color: #f8f9fa;
          border-radius: 4px;
        }
        
        .location-row {
          display: flex;
          margin-bottom: 5px;
        }
        
        .location-row:last-child {
          margin-bottom: 0;
        }
        
        .location-label {
          font-weight: 600;
          min-width: 120px;
          color: #555;
          font-size: 13px;
        }
        
        .location-value {
          color: #333;
          font-size: 13px;
        }
        
        .performance-metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 15px;
        }
        
        .metric {
          text-align: center;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 8px;
        }
        
        .metric-label {
          display: block;
          color: #666;
          font-size: 14px;
          margin-bottom: 5px;
        }
        
        .metric-value {
          display: block;
          color: #333;
          font-size: 20px;
          font-weight: 600;
        }
        
        .no-selection {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
          color: #666;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}

export default BusOperationInfo;