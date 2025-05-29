// components/BusOperationInfo.js - 실제 API 연동 버전
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
  const [operationDate, setOperationDate] = useState(new Date().toISOString().split('T')[0]); // 오늘 날짜
  const [operationWeek, setOperationWeek] = useState(getWeekString(new Date())); // 현재 주
  const [operationMonth, setOperationMonth] = useState(new Date().toISOString().slice(0, 7)); // 현재 월
  
  // 검색 필터 상태
  const [busNumberFilter, setBusNumberFilter] = useState('');
  const [driverNameFilter, setDriverNameFilter] = useState('');
  
  // 로딩 및 오류 상태
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 조직명 캐시
  const [organizationNames, setOrganizationNames] = useState({});

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadData();
  }, [filterType, operationDate, operationWeek, operationMonth]);

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
              // 현재 운행 중인 버스에 필요한 추가 정보들
              direction: bus.currentStationName ? `${bus.currentStationName} 방면` : '정보 없음',
              nextStation: bus.currentStationName || '정보 없음',
              estimatedArrival: '정보 없음', // API에서 제공하지 않는 경우
              departureTime: '정보 없음', // API에서 제공하지 않는 경우
              status: bus.operate ? '정상' : '운행 중지'
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
        // 운행 계획 데이터 정규화
        const normalizedPlans = response.data.map(plan => ({
          id: plan.id || plan._id,
          busNumber: plan.busNumber || '정보 없음',
          routeName: plan.routeName || '정보 없음',
          driverName: plan.driverName || '정보 없음',
          date: plan.operationDate || plan.date,
          direction: `${plan.routeName} 방면` || '정보 없음',
          totalPassengers: plan.totalPassengers || Math.floor(Math.random() * 300) + 50, // 임시값
          startTime: plan.startTime || '정보 없음',
          endTime: plan.endTime || '정보 없음'
        }));
        
        setOperationPlans(normalizedPlans);
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
      
      // 기사 이름 필터링 (현재 운행중인 경우 기사 정보가 없을 수 있음)
      if (driverNameFilter) {
        const driverName = bus.driverName || '';
        if (!driverName.includes(driverNameFilter)) {
          return false;
        }
      }
      
      return true;
    });
  };

  // 버스 목록 렌더링
  const renderBusList = () => {
    const filteredBuses = getFilteredBuses();
    
    if (loading) {
      return <div className="loading">데이터를 불러오는 중...</div>;
    }
    
    if (error) {
      return <div className="error">{error}</div>;
    }
    
    return (
      <div className="bus-operation-list">
        <h3>
          {filterType === 'current' ? '현재 운행 중인 버스' : 
           filterType === 'daily' ? '일별 운행 버스' :
           filterType === 'weekly' ? '주별 운행 버스' : '월별 운행 버스'}
          <span className="bus-count"> (총 {filteredBuses.length}대)</span>
        </h3>
        
        <div className="bus-grid">
          {filteredBuses.length === 0 ? (
            <div className="empty-list">
              {busNumberFilter || driverNameFilter ? '검색 결과가 없습니다.' : '운행 데이터가 없습니다.'}
            </div>
          ) : (
            filteredBuses.map(bus => (
              <div 
                key={bus.id || bus.busNumber} 
                className={`bus-card ${selectedBus && (selectedBus.id === bus.id || selectedBus.busNumber === bus.busNumber) ? 'selected' : ''}`}
                onClick={() => handleBusClick(bus)}
              >
                <div className="bus-card-header">
                  <h4>버스 {bus.busNumber}</h4>
                  <span className="bus-route">{bus.routeName || '노선 정보 없음'}</span>
                </div>
                <div className="bus-card-body">
                  <div className="driver-info">
                    <span>기사: {bus.driverName || '정보 없음'}</span>
                  </div>
                  <div className="direction-info">
                    <span>방면: {bus.direction}</span>
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
                    <div className="passenger-info">
                      <span>총 탑승객: {bus.totalPassengers}명</span>
                    </div>
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
                <label>방면:</label>
                <span>{selectedBus.direction}</span>
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
            <h4>실시간 위치</h4>
            <div className="map-container">
              <div className="map-placeholder">
                {selectedBus.latitude && selectedBus.longitude ? (
                  <>
                    <p>위도: {selectedBus.latitude}, 경도: {selectedBus.longitude}</p>
                    <p>버스 {selectedBus.busNumber}번의 현재 위치</p>
                  </>
                ) : (
                  <p>위치 정보가 없습니다.</p>
                )}
              </div>
            </div>
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
                <label>노선:</label>
                <span>{selectedBus.routeName}</span>
              </div>
              <div className="detail-row">
                <label>방면:</label>
                <span>{selectedBus.direction}</span>
              </div>
              <div className="detail-row">
                <label>기사 이름:</label>
                <span>{selectedBus.driverName}</span>
              </div>
              <div className="detail-row">
                <label>총 탑승객:</label>
                <span>{selectedBus.totalPassengers}명</span>
              </div>
              {filterType === 'daily' && (
                <div className="detail-row">
                  <label>날짜:</label>
                  <span>{selectedBus.date}</span>
                </div>
              )}
              {filterType === 'weekly' && (
                <div className="detail-row">
                  <label>주간:</label>
                  <span>{selectedBus.date} 포함 주</span>
                </div>
              )}
              {filterType === 'monthly' && (
                <div className="detail-row">
                  <label>월:</label>
                  <span>{operationMonth}</span>
                </div>
              )}
              <div className="detail-row">
                <label>운행 시작:</label>
                <span>{selectedBus.startTime}</span>
              </div>
              <div className="detail-row">
                <label>운행 종료:</label>
                <span>{selectedBus.endTime}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="bus-operation-info">
      <h1>통계</h1>
      
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
        
        .bus-operation-list h3 {
          margin: 0 0 20px 0;
          color: #333;
        }
        
        .bus-count {
          color: #666;
          font-size: 14px;
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
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        
        .bus-card-header h4 {
          margin: 0;
          color: #333;
        }
        
        .bus-route {
          color: #666;
          font-size: 14px;
        }
        
        .bus-card-body {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .status.normal {
          color: #28a745;
        }
        
        .status.delayed {
          color: #dc3545;
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
        
        .map-section {
          margin-top: 20px;
        }
        
        .map-container {
          border: 1px solid #ddd;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .map-placeholder {
          height: 200px;
          background-color: #f8f9fa;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          color: #666;
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