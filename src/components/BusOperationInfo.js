// components/BusOperationInfo.js
import React, { useState } from 'react';

function BusOperationInfo() {
  // 필터 상태
  const [filterType, setFilterType] = useState('current');
  
  // 더미 데이터 - 현재 운행 중인 버스
  const currentBuses = [
    {
      id: 1,
      number: '108',
      driver: {
        id: 1,
        name: '김철수',
        photo: '/api/placeholder/50/50',
        phone: '010-1234-5678',
        driverNumber: 'D-1001'
      },
      route: '강남-송파',
      direction: '송파 방면',
      status: '정상',
      occupancy: 28,
      capacity: 45,
      location: { lat: 37.5172, lng: 127.0473 }, // 위치 좌표
      nextStation: '석촌역',
      departureTime: '08:30',
      estimatedArrival: '09:15'
    },
    {
      id: 2,
      number: '302',
      driver: {
        id: 2,
        name: '박영희',
        photo: '/api/placeholder/50/50',
        phone: '010-9876-5432',
        driverNumber: 'D-1002'
      },
      route: '서초-강남',
      direction: '강남 방면',
      status: '정상',
      occupancy: 35,
      capacity: 40,
      location: { lat: 37.4923, lng: 127.0292 }, // 위치 좌표
      nextStation: '강남역',
      departureTime: '08:45',
      estimatedArrival: '09:10'
    },
    {
      id: 3,
      number: '401',
      driver: {
        id: 3,
        name: '이민수',
        photo: '/api/placeholder/50/50',
        phone: '010-5555-7777',
        driverNumber: 'D-2001'
      },
      route: '송파-강동',
      direction: '강동 방면',
      status: '정상',
      occupancy: 22,
      capacity: 45,
      location: { lat: 37.5145, lng: 127.1060 }, // 위치 좌표
      nextStation: '천호역',
      departureTime: '08:15',
      estimatedArrival: '09:00'
    }
  ];
  
  // 더미 데이터 - 일별/주별/월별/연별 운행 버스 기록
  const historicalBuses = {
    daily: [
      {
        id: 1,
        date: '2025-03-30',
        number: '108',
        driver: {
          id: 1,
          name: '김철수',
          driverNumber: 'D-1001'
        },
        route: '강남-송파',
        direction: '송파 방면',
        totalPassengers: 352
      },
      {
        id: 2,
        date: '2025-03-30',
        number: '302',
        driver: {
          id: 2,
          name: '박영희',
          driverNumber: 'D-1002'
        },
        route: '서초-강남',
        direction: '강남 방면',
        totalPassengers: 287
      }
    ],
    weekly: [
      {
        id: 1,
        weekOf: '2025-03-24',
        number: '108',
        driver: {
          id: 1,
          name: '김철수',
          driverNumber: 'D-1001'
        },
        route: '강남-송파',
        direction: '송파 방면',
        totalPassengers: 2187
    },
    {
      id: 2,
      weekOf: '2025-03-24',
      number: '302',
      driver: {
        id: 2,
        name: '박영희',
        driverNumber: 'D-1002'
      },
      route: '서초-강남',
      direction: '강남 방면',
      totalPassengers: 1845
    }
  ],
  monthly: [
    {
      id: 1,
      month: '2025-03',
      number: '108',
      driver: {
        id: 1,
        name: '김철수',
        driverNumber: 'D-1001'
      },
      route: '강남-송파',
      direction: '송파 방면',
      totalPassengers: 9542
    },
    {
      id: 2,
      month: '2025-03',
      number: '302',
      driver: {
        id: 2,
        name: '박영희',
        driverNumber: 'D-1002'
      },
      route: '서초-강남',
      direction: '강남 방면',
      totalPassengers: 8127
    }
  ],
  yearly: [
    {
      id: 1,
      year: '2025',
      number: '108',
      driver: {
        id: 1,
        name: '김철수',
        driverNumber: 'D-1001'
      },
      route: '강남-송파',
      direction: '송파 방면',
      totalPassengers: 28740
    },
    {
      id: 2,
      year: '2025',
      number: '302',
      driver: {
        id: 2,
        name: '박영희',
        driverNumber: 'D-1002'
      },
      route: '서초-강남',
      direction: '강남 방면',
      totalPassengers: 24380
    }
  ]
};

const [selectedBus, setSelectedBus] = useState(null);
const [operationDate, setOperationDate] = useState('2025-03-30'); // For daily filter
const [operationWeek, setOperationWeek] = useState('2025-W13'); // For weekly filter
const [operationMonth, setOperationMonth] = useState('2025-03'); // For monthly filter
const [operationYear, setOperationYear] = useState('2025'); // For yearly filter
const [busNumberFilter, setBusNumberFilter] = useState('');
const [driverNameFilter, setDriverNameFilter] = useState('');

const handleBusClick = (bus) => {
  setSelectedBus(bus);
};

const getActiveFilterData = () => {
  if (filterType === 'current') {
    return currentBuses;
  } else {
    return historicalBuses[filterType];
  }
};

const getFilteredBuses = () => {
  const buses = getActiveFilterData();
  return buses.filter(bus => {
    // 버스 번호 필터링
    if (busNumberFilter && !bus.number.includes(busNumberFilter)) {
      return false;
    }
    
    // 기사 이름 필터링
    if (driverNameFilter && !bus.driver.name.includes(driverNameFilter)) {
      return false;
    }
    
    return true;
  });
};

const renderBusList = () => {
  const filteredBuses = getFilteredBuses();
  
  return (
    <div className="bus-operation-list">
      <h3>
        {filterType === 'current' ? '현재 운행 중인 버스' : 
         filterType === 'daily' ? '일별 운행 버스' :
         filterType === 'weekly' ? '주별 운행 버스' :
         filterType === 'monthly' ? '월별 운행 버스' : '연도별 운행 버스'}
        <span className="bus-count"> (총 {filteredBuses.length}대)</span>
      </h3>
      
      <div className="bus-grid">
        {filteredBuses.map(bus => (
          <div 
            key={bus.id} 
            className={`bus-card ${selectedBus && selectedBus.id === bus.id ? 'selected' : ''}`}
            onClick={() => handleBusClick(bus)}
          >
            <div className="bus-card-header">
              <h4>버스 {bus.number}</h4>
              <span className="bus-route">{bus.route}</span>
            </div>
            <div className="bus-card-body">
              <div className="driver-info">
                <span>기사: {bus.driver.name}</span>
              </div>
              <div className="direction-info">
                <span>방면: {bus.direction}</span>
              </div>
              {filterType === 'current' ? (
                <div className="status-info">
                  <span className={`status ${bus.status === '정상' ? 'normal' : 'delayed'}`}>
                    {bus.status}
                  </span>
                  <span className="occupancy">
                    탑승: {bus.occupancy}/{bus.capacity}명
                  </span>
                </div>
              ) : (
                <div className="passenger-info">
                  <span>총 탑승객: {bus.totalPassengers}명</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

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
              <span>{selectedBus.number}</span>
            </div>
            <div className="detail-row">
              <label>노선:</label>
              <span>{selectedBus.route}</span>
            </div>
            <div className="detail-row">
              <label>방면:</label>
              <span>{selectedBus.direction}</span>
            </div>
            <div className="detail-row">
              <label>상태:</label>
              <span className={`status ${selectedBus.status === '정상' ? 'normal' : 'delayed'}`}>
                {selectedBus.status}
              </span>
            </div>
            <div className="detail-row">
              <label>탑승객:</label>
              <span>{selectedBus.occupancy}/{selectedBus.capacity}명</span>
            </div>
            <div className="detail-row">
              <label>출발 시간:</label>
              <span>{selectedBus.departureTime}</span>
            </div>
            <div className="detail-row">
              <label>다음 정류장:</label>
              <span>{selectedBus.nextStation}</span>
            </div>
            <div className="detail-row">
              <label>예상 도착:</label>
              <span>{selectedBus.estimatedArrival}</span>
            </div>
          </div>
          
          <div className="detail-section">
            <h4>버스 기사 정보</h4>
            <div className="driver-detail">
              <div className="driver-photo">
                <img src={selectedBus.driver.photo} alt={selectedBus.driver.name} />
              </div>
              <div className="driver-info">
                <div className="detail-row">
                  <label>이름:</label>
                  <span>{selectedBus.driver.name}</span>
                </div>
                <div className="detail-row">
                  <label>기사 번호:</label>
                  <span>{selectedBus.driver.driverNumber}</span>
                </div>
                <div className="detail-row">
                  <label>연락처:</label>
                  <span>{selectedBus.driver.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="map-section">
          <h4>실시간 위치</h4>
          <div className="map-container">
            {/* 여기에는 실제 지도가 들어갈 것입니다. 현재는 플레이스홀더로 대체합니다. */}
            <div className="map-placeholder">
              <p>지도 영역 - 위도: {selectedBus.location.lat}, 경도: {selectedBus.location.lng}</p>
              <p>버스 {selectedBus.number}번의 현재 위치</p>
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
              <span>{selectedBus.number}</span>
            </div>
            <div className="detail-row">
              <label>노선:</label>
              <span>{selectedBus.route}</span>
            </div>
            <div className="detail-row">
              <label>방면:</label>
              <span>{selectedBus.direction}</span>
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
                <span>{selectedBus.weekOf} 시작</span>
              </div>
            )}
            {filterType === 'monthly' && (
              <div className="detail-row">
                <label>월:</label>
                <span>{selectedBus.month}</span>
              </div>
            )}
            {filterType === 'yearly' && (
              <div className="detail-row">
                <label>연도:</label>
                <span>{selectedBus.year}</span>
              </div>
            )}
          </div>
          
          <div className="detail-section">
            <h4>버스 기사 정보</h4>
            <div className="driver-info">
              <div className="detail-row">
                <label>이름:</label>
                <span>{selectedBus.driver.name}</span>
              </div>
              <div className="detail-row">
                <label>기사 번호:</label>
                <span>{selectedBus.driver.driverNumber}</span>
              </div>
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
            <option value="yearly">연도별</option>
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
        
        {filterType === 'yearly' && (
          <div className="filter-group">
            <label>연도:</label>
            <select 
              value={operationYear}
              onChange={(e) => setOperationYear(e.target.value)}
            >
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
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
  </div>
);
}

export default BusOperationInfo;