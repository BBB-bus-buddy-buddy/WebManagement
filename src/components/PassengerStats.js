// components/PassengerStats.js
import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import ApiService from '../services/api';

function PassengerStats() {
  // 상태
  const [statsPeriod, setStatsPeriod] = useState('daily');
  const [routeFilter, setRouteFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('2025-03');
  const [dateRange, setDateRange] = useState({
    start: '2025-03-01',
    end: '2025-03-07'
  });
  
  // API에서 가져올 실제 데이터
  const [routes, setRoutes] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 더미 데이터를 위한 상태
  const [passengerData, setPassengerData] = useState({
    daily: [],
    weekly: [],
    monthly: [],
    routeRatio: [],
    stationStats: []
  });

  // 초기 주차 설정
  useEffect(() => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const weekNum = getWeekNumber(currentDate);
    setSelectedWeek(`${year}-W${weekNum.toString().padStart(2, '0')}`);
  }, []);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchInitialData();
  }, []);

  // 조회 기간 변경 시 데이터 재생성
  useEffect(() => {
    if (routes.length > 0 && stations.length > 0) {
      generateDummyPassengerData(routes.slice(1), stations.slice(0, 5));
    }
  }, [dateRange, selectedWeek, selectedMonth, statsPeriod]);

  // 주차 번호 계산 함수
  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
  };

  // 주차의 날짜 범위 계산
  const getWeekDateRange = (weekString) => {
    if (!weekString) return { start: null, end: null };
    
    const [year, week] = weekString.split('-W');
    const firstDayOfYear = new Date(parseInt(year), 0, 1);
    const daysToMonday = (8 - firstDayOfYear.getDay()) % 7;
    const firstMonday = new Date(firstDayOfYear);
    firstMonday.setDate(firstDayOfYear.getDate() + daysToMonday);
    
    const startDate = new Date(firstMonday);
    startDate.setDate(firstMonday.getDate() + (parseInt(week) - 1) * 7);
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  };

  // 실제 노선과 정류장 데이터 가져오기
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 노선 데이터 가져오기
      const routeResponse = await ApiService.getAllRoutes();
      const routeData = routeResponse?.data || [];
      
      // 정류장 데이터 가져오기
      const stationResponse = await ApiService.getAllStations();
      const stationData = stationResponse?.data || [];
      
      // 노선 데이터 설정
      const formattedRoutes = [
        { id: 'all', name: '전체 노선' },
        ...routeData.slice(0, 10).map(route => ({
          id: route.id,
          name: route.routeName || route.name || `노선 ${route.id}`
        }))
      ];
      setRoutes(formattedRoutes);
      
      // 정류장 데이터 설정
      setStations(stationData.slice(0, 10));
      
      // 실제 데이터를 기반으로 더미 탑승객 데이터 생성
      generateDummyPassengerData(formattedRoutes.slice(1), stationData.slice(0, 5));
      
    } catch (err) {
      console.error('데이터 로드 실패:', err);
      setError('데이터를 불러오는데 실패했습니다.');
      
      // 오류 시 기본 더미 데이터 사용
      setDefaultDummyData();
    } finally {
      setLoading(false);
    }
  };

  // 더미 탑승객 데이터 생성
  const generateDummyPassengerData = (routeList, stationList) => {
    if (statsPeriod === 'daily') {
      // 일별 데이터 생성 (선택된 날짜 범위)
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      const dailyData = [];
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dayData = {
          date: `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`,
          total: 0
        };
        
        routeList.forEach(route => {
          // 주말/평일에 따라 다른 패턴
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
          const basePassengers = isWeekend ? 300 : 800;
          const passengers = Math.floor(Math.random() * 700) + basePassengers;
          dayData[route.id] = passengers;
          dayData.total += passengers;
        });
        
        dailyData.push(dayData);
      }
      
      setPassengerData(prev => ({ ...prev, daily: dailyData }));
      
    } else if (statsPeriod === 'weekly') {
      // 주별 데이터 생성 (선택된 주차 기준 4주)
      const weeklyData = [];
      const [year, weekNum] = selectedWeek.split('-W');
      
      for (let i = 0; i < 4; i++) {
        const currentWeek = parseInt(weekNum) - 3 + i;
        const weekData = {
          week: `${currentWeek}주차`,
          total: 0
        };
        
        routeList.forEach(route => {
          const passengers = Math.floor(Math.random() * 7000) + 3500 + (i * 500);
          weekData[route.id] = passengers;
          weekData.total += passengers;
        });
        
        weeklyData.push(weekData);
      }
      
      setPassengerData(prev => ({ ...prev, weekly: weeklyData }));
      
    } else if (statsPeriod === 'monthly') {
      // 월별 데이터 생성 (선택된 월 기준 최근 6개월)
      const monthlyData = [];
      const [year, month] = selectedMonth.split('-');
      const baseDate = new Date(parseInt(year), parseInt(month) - 1);
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(baseDate);
        monthDate.setMonth(monthDate.getMonth() - i);
        const monthData = {
          month: `${monthDate.getMonth() + 1}월`,
          total: 0
        };
        
        routeList.forEach(route => {
          // 계절별 패턴 적용
          const seasonFactor = [0.8, 0.9, 1.0, 1.1, 1.2, 1.1, 1.0, 0.9, 0.8, 0.7, 0.8, 0.9];
          const monthIndex = monthDate.getMonth();
          const basePassengers = 25000 * seasonFactor[monthIndex];
          const passengers = Math.floor(Math.random() * 10000) + basePassengers;
          monthData[route.id] = Math.floor(passengers);
          monthData.total += Math.floor(passengers);
        });
        
        monthlyData.push(monthData);
      }
      
      setPassengerData(prev => ({ ...prev, monthly: monthlyData }));
    }
    
    // 노선별 탑승객 비율 데이터 (파이차트용)
    const colors = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#ffc658', '#ff7300', '#ff0000', '#00ff00', '#0000ff'];
    const routeRatioData = routeList.map((route, index) => ({
      name: route.name,
      value: Math.floor(Math.random() * 30000) + 15000,
      color: colors[index % colors.length]
    }));
    
    // 정류장별 승하차 데이터
    const stationStatsData = stationList.map(station => ({
      station: station.name || `정류장 ${station.id}`,
      boarding: Math.floor(Math.random() * 2000) + 1000,
      alighting: Math.floor(Math.random() * 2000) + 1000
    }));
    
    setPassengerData(prev => ({
      ...prev,
      routeRatio: routeRatioData,
      stationStats: stationStatsData
    }));
  };

  // 기본 더미 데이터 설정 (API 실패 시)
  const setDefaultDummyData = () => {
    const defaultRoutes = [
      { id: 'route1', name: '노선 1' },
      { id: 'route2', name: '노선 2' },
      { id: 'route3', name: '노선 3' },
      { id: 'route4', name: '노선 4' },
      { id: 'route5', name: '노선 5' }
    ];
    
    const defaultStations = [
      { id: 'station1', name: '정류장 1' },
      { id: 'station2', name: '정류장 2' },
      { id: 'station3', name: '정류장 3' },
      { id: 'station4', name: '정류장 4' },
      { id: 'station5', name: '정류장 5' }
    ];
    
    setRoutes([{ id: 'all', name: '전체 노선' }, ...defaultRoutes]);
    generateDummyPassengerData(defaultRoutes, defaultStations);
  };

  // 활성 데이터 가져오기
  const getActiveData = () => {
    switch(statsPeriod) {
      case 'daily':
        return passengerData.daily;
      case 'weekly':
        return passengerData.weekly;
      case 'monthly':
        return passengerData.monthly;
      default:
        return passengerData.daily;
    }
  };
  
  // 차트 데이터 가져오기
  const getChartData = () => {
    const data = getActiveData();
    
    if (routeFilter === 'all') {
      return data;
    }
    
    // 특정 노선만 보기 위한 데이터 필터링
    return data.map(item => {
      const xAxisKey = getXAxisKey();
      const filteredItem = {
        [xAxisKey]: item[xAxisKey]
      };
      if (item[routeFilter] !== undefined) {
        filteredItem[routeFilter] = item[routeFilter];
      }
      return filteredItem;
    });
  };
  
  // X축 키 가져오기
  const getXAxisKey = () => {
    switch(statsPeriod) {
      case 'daily':
        return 'date';
      case 'weekly':
        return 'week';
      case 'monthly':
        return 'month';
      default:
        return 'date';
    }
  };
  
  // 이벤트 핸들러
  const handlePeriodChange = (e) => {
    const newPeriod = e.target.value;
    setStatsPeriod(newPeriod);
    
    // 기간 변경 시 날짜 범위 자동 조정
    if (newPeriod === 'daily') {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 6);
      setDateRange({
        start: weekAgo.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      });
    }
  };
  
  const handleRouteFilterChange = (e) => {
    setRouteFilter(e.target.value);
  };
  
  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleWeekChange = (e) => {
    setSelectedWeek(e.target.value);
  };

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };
  
  // 차트에 표시할 라인 생성
  const renderChartLines = () => {
    if (routeFilter === 'all') {
      // 전체 노선 표시
      const lines = [];
      const colors = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#ffc658', '#ff7300', '#ff0000', '#00ff00', '#0000ff'];
      
      routes.slice(1).forEach((route, index) => {
        lines.push(
          <Line
            key={route.id}
            type="monotone"
            dataKey={route.id}
            stroke={colors[index % colors.length]}
            name={route.name}
            activeDot={index === 0 ? { r: 8 } : false}
          />
        );
      });
      
      // 전체 합계 라인
      lines.push(
        <Line
          key="total"
          type="monotone"
          dataKey="total"
          stroke="#ff7300"
          strokeWidth={2}
          name="전체"
        />
      );
      
      return lines;
    } else {
      // 선택된 노선만 표시
      const selectedRoute = routes.find(r => r.id === routeFilter);
      return (
        <Line
          type="monotone"
          dataKey={routeFilter}
          stroke="#8884d8"
          activeDot={{ r: 8 }}
          name={selectedRoute?.name || routeFilter}
        />
      );
    }
  };
  
  // 로딩 상태
  if (loading) {
    return (
      <div className="passenger-stats">
        <h1>노선별 탑승객 통계</h1>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }
  
  // 에러 상태
  if (error) {
    return (
      <div className="passenger-stats">
        <h1>노선별 탑승객 통계</h1>
        <div style={{ textAlign: 'center', padding: '50px', color: '#f44336' }}>
          <p>{error}</p>
          <button onClick={fetchInitialData}>다시 시도</button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="passenger-stats">
      <h1>노선별 탑승객 통계</h1>
      
      <div className="stats-controls">
        <div className="filter-group">
          <label style={{ display: 'block', marginBottom: '5px',fontWeight: '500', whiteSpace: 'nowrap' }}>기간 선택:</label>
          <select value={statsPeriod} onChange={handlePeriodChange} style={{ minWidth: '100px', marginRight: '100px'}}>
            <option value="daily">일별</option>
            <option value="weekly">주별</option>
            <option value="monthly">월별</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', whiteSpace: 'nowrap' }}>노선 선택:</label>
          <select value={routeFilter} onChange={handleRouteFilterChange} style={{ minWidth: '150px', marginRight: '100px'}}>
            {routes.map(route => (
              <option key={route.id} value={route.id}>{route.name}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group date-range" style={{ flex: '2' }}>
          <label style={{ display: 'block', marginBottom: '13px', fontWeight: '500', whiteSpace: 'nowrap' }}>조회 기간:</label>
          {statsPeriod === 'daily' && (
            <div className="date-inputs" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input 
                type="date" 
                name="start" 
                value={dateRange.start} 
                onChange={handleDateRangeChange}
                style={{ padding: '8px', border: '1px solid #e0e0e0', borderRadius: '4px' }}
              />
              <span style={{ whiteSpace: 'nowrap' }}>~</span>
              <input 
                type="date" 
                name="end" 
                value={dateRange.end} 
                onChange={handleDateRangeChange}
                min={dateRange.start}
                style={{ padding: '8px', border: '1px solid #e0e0e0', borderRadius: '4px' }}
              />
            </div>
          )}
          {statsPeriod === 'weekly' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input 
                type="week" 
                value={selectedWeek} 
                onChange={handleWeekChange}
                style={{ padding: '8px', border: '1px solid #e0e0e0', borderRadius: '4px' }}
              />
              <span style={{ fontSize: '14px', color: '#666' }}>
                (최근 4주 데이터 표시)
              </span>
            </div>
          )}
          {statsPeriod === 'monthly' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input 
                type="month" 
                value={selectedMonth} 
                onChange={handleMonthChange}
                style={{ padding: '8px', border: '1px solid #e0e0e0', borderRadius: '4px' }}
              />
              <span style={{ fontSize: '14px', color: '#666' }}>
                (최근 6개월 데이터 표시)
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div className="stats-charts">
        <div className="chart-container large">
          <h2 style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {statsPeriod === 'daily' ? '일별' : statsPeriod === 'weekly' ? '주별' : '월별'} 
            {routeFilter === 'all' ? ' 전체 노선' : ` ${routes.find(r => r.id === routeFilter)?.name || ''}`} 탑승객 추이
          </h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getChartData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={getXAxisKey()} />
                <YAxis />
                <Tooltip />
                <Legend />
                {renderChartLines()}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="chart-row">
          <div className="chart-container">
            <h2 style={{ whiteSpace: 'nowrap' }}>노선별 탑승객 비율</h2>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={passengerData.routeRatio}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({name, percent}) => `${name} (${(percent * 100).toFixed(1)}%)`}
                  >
                    {passengerData.routeRatio.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="chart-container">
            <h2 style={{ whiteSpace: 'nowrap' }}>정류장별 승하차 인원</h2>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={passengerData.stationStats}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="station" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="boarding" name="승차" fill="#8884d8" />
                  <Bar dataKey="alighting" name="하차" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      
      <div className="stats-data-table">
        <h2>
          {statsPeriod === 'daily' ? '일별' : statsPeriod === 'weekly' ? '주별' : '월별'} 
          탑승객 상세 데이터
        </h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ whiteSpace: 'nowrap' }}>{statsPeriod === 'daily' ? '날짜' : statsPeriod === 'weekly' ? '주' : '월'}</th>
                {routes.slice(1, 6).map(route => (
                  <th key={route.id} style={{ whiteSpace: 'nowrap' }}>{route.name}</th>
                ))}
                <th style={{ whiteSpace: 'nowrap' }}>전체</th>
              </tr>
            </thead>
            <tbody>
              {getActiveData().map((item, index) => (
                <tr key={index}>
                  <td style={{ whiteSpace: 'nowrap' }}>{item[getXAxisKey()]}</td>
                  {routes.slice(1, 6).map(route => (
                    <td key={route.id} style={{ whiteSpace: 'nowrap' }}>
                      {item[route.id] ? item[route.id].toLocaleString() : '0'}명
                    </td>
                  ))}
                  <td className="total-column" style={{ whiteSpace: 'nowrap' }}>{item.total?.toLocaleString() || '0'}명</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="stats-summary">
        <h2 style={{ whiteSpace: 'nowrap' }}>요약 통계</h2>
        <div className="summary-cards">
          <div className="summary-card">
            <h3 style={{ whiteSpace: 'nowrap' }}>총 탑승객</h3>
            <p className="large-number">
              {getActiveData().reduce((sum, item) => sum + (item.total || 0), 0).toLocaleString()}
              <span>명</span>
            </p>
            <p className="comparison positive">
              전{statsPeriod === 'daily' ? '주' : statsPeriod === 'weekly' ? '달' : '년'} 대비 
              +{(Math.random() * 20 + 1).toFixed(1)}%
            </p>
          </div>
          
          <div className="summary-card">
            <h3 style={{ whiteSpace: 'nowrap' }}>가장 많이 이용하는 노선</h3>
            <p className="highlighted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {passengerData.routeRatio.length > 0 ? 
                passengerData.routeRatio.reduce((max, route) => 
                  route.value > max.value ? route : max
                ).name : '데이터 없음'}
            </p>
            <p style={{ whiteSpace: 'nowrap' }}>
              {passengerData.routeRatio.length > 0 ? 
                `총 ${passengerData.routeRatio.reduce((max, route) => 
                  route.value > max.value ? route : max
                ).value.toLocaleString()}명` : ''}
            </p>
          </div>
          
          <div className="summary-card">
            <h3 style={{ whiteSpace: 'nowrap' }}>가장 혼잡한 정류장</h3>
            <p className="highlighted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {passengerData.stationStats.length > 0 ?
                passengerData.stationStats.reduce((max, station) => 
                  (station.boarding + station.alighting) > (max.boarding + max.alighting) ? station : max
                ).station : '데이터 없음'}
            </p>
            {passengerData.stationStats.length > 0 && (() => {
              const busiest = passengerData.stationStats.reduce((max, station) => 
                (station.boarding + station.alighting) > (max.boarding + max.alighting) ? station : max
              );
              return <p style={{ whiteSpace: 'nowrap' }}>승차: {busiest.boarding.toLocaleString()}명, 하차: {busiest.alighting.toLocaleString()}명</p>;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PassengerStats;