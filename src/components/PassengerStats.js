// components/PassengerStats.js
import React, { useState } from 'react';
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

function PassengerStats() {
  // 상태
  const [statsPeriod, setStatsPeriod] = useState('daily');
  const [routeFilter, setRouteFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: '2025-03-01',
    end: '2025-03-31'
  });
  
  // 노선 목록 (버스 번호 대신 실제 노선으로 변경)
  const routes = [
    { id: 'all', name: '전체 노선' },
    { id: 'gangnam-songpa', name: '강남-송파' },
    { id: 'seocho-gangnam', name: '서초-강남' },
    { id: 'songpa-gangdong', name: '송파-강동' },
    { id: 'gangbuk-dobong', name: '강북-도봉' },
    { id: 'jongno-junggu', name: '종로-중구' }
  ];
  
  // 일별 탑승객 통계 (버스 번호 대신 노선 ID로 키 변경)
  const dailyStats = [
    { date: '03-01', 'gangnam-songpa': 1250, 'seocho-gangnam': 980, 'songpa-gangdong': 870, 'gangbuk-dobong': 760, 'jongno-junggu': 690, total: 4550 },
    { date: '03-02', 'gangnam-songpa': 950, 'seocho-gangnam': 870, 'songpa-gangdong': 790, 'gangbuk-dobong': 680, 'jongno-junggu': 620, total: 3910 },
    { date: '03-03', 'gangnam-songpa': 1340, 'seocho-gangnam': 1120, 'songpa-gangdong': 920, 'gangbuk-dobong': 850, 'jongno-junggu': 780, total: 5010 },
    { date: '03-04', 'gangnam-songpa': 1290, 'seocho-gangnam': 1080, 'songpa-gangdong': 950, 'gangbuk-dobong': 820, 'jongno-junggu': 750, total: 4890 },
    { date: '03-05', 'gangnam-songpa': 1320, 'seocho-gangnam': 1150, 'songpa-gangdong': 980, 'gangbuk-dobong': 840, 'jongno-junggu': 790, total: 5080 },
    { date: '03-06', 'gangnam-songpa': 1380, 'seocho-gangnam': 1190, 'songpa-gangdong': 1020, 'gangbuk-dobong': 880, 'jongno-junggu': 810, total: 5280 },
    { date: '03-07', 'gangnam-songpa': 1450, 'seocho-gangnam': 1230, 'songpa-gangdong': 1060, 'gangbuk-dobong': 920, 'jongno-junggu': 850, total: 5510 }
  ];
  
  // 주별 탑승객 통계 (버스 번호 대신 노선 ID로 키 변경)
  const weeklyStats = [
    { week: '1주차', 'gangnam-songpa': 8250, 'seocho-gangnam': 6950, 'songpa-gangdong': 5980, 'gangbuk-dobong': 5120, 'jongno-junggu': 4690, total: 30990 },
    { week: '2주차', 'gangnam-songpa': 8690, 'seocho-gangnam': 7320, 'songpa-gangdong': 6240, 'gangbuk-dobong': 5340, 'jongno-junggu': 4930, total: 32520 },
    { week: '3주차', 'gangnam-songpa': 8840, 'seocho-gangnam': 7450, 'songpa-gangdong': 6390, 'gangbuk-dobong': 5490, 'jongno-junggu': 5080, total: 33250 },
    { week: '4주차', 'gangnam-songpa': 9120, 'seocho-gangnam': 7690, 'songpa-gangdong': 6580, 'gangbuk-dobong': 5650, 'jongno-junggu': 5220, total: 34260 }
  ];
  
  // 월별 탑승객 통계 (버스 번호 대신 노선 ID로 키 변경)
  const monthlyStats = [
    { month: '1월', 'gangnam-songpa': 35200, 'seocho-gangnam': 29800, 'songpa-gangdong': 25600, 'gangbuk-dobong': 22100, 'jongno-junggu': 20400, total: 133100 },
    { month: '2월', 'gangnam-songpa': 32400, 'seocho-gangnam': 27300, 'songpa-gangdong': 23500, 'gangbuk-dobong': 20300, 'jongno-junggu': 18800, total: 122300 },
    { month: '3월', 'gangnam-songpa': 34900, 'seocho-gangnam': 29400, 'songpa-gangdong': 25200, 'gangbuk-dobong': 21600, 'jongno-junggu': 19900, total: 131000 }
  ];
  
  // 노선별 탑승객 비율 (버스 번호 대신 노선 이름으로 표시)
  const routeRatioStats = [
    { name: '강남-송파', value: 34900, color: '#8884d8' },
    { name: '서초-강남', value: 29400, color: '#83a6ed' },
    { name: '송파-강동', value: 25200, color: '#8dd1e1' },
    { name: '강북-도봉', value: 21600, color: '#82ca9d' },
    { name: '종로-중구', value: 19900, color: '#a4de6c' }
  ];
  
  // 정류장별 승하차 인원
  const stationStats = [
    { station: '강남역', boarding: 2840, alighting: 2650 },
    { station: '삼성역', boarding: 1920, alighting: 1860 },
    { station: '잠실역', boarding: 2180, alighting: 2240 },
    { station: '서초역', boarding: 1740, alighting: 1690 },
    { station: '송파역', boarding: 1590, alighting: 1640 }
  ];
  
  // 노선 ID와 표시 이름 매핑
  const routeDisplayNames = {
    'gangnam-songpa': '강남-송파',
    'seocho-gangnam': '서초-강남',
    'songpa-gangdong': '송파-강동',
    'gangbuk-dobong': '강북-도봉',
    'jongno-junggu': '종로-중구'
  };
  
  const getActiveData = () => {
    switch(statsPeriod) {
      case 'daily':
        return dailyStats;
      case 'weekly':
        return weeklyStats;
      case 'monthly':
        return monthlyStats;
      default:
        return dailyStats;
    }
  };
  
  const getChartData = () => {
    const data = getActiveData();
    
    if (routeFilter === 'all') {
      return data;
    }
    
    // 특정 노선만 보기 위한 데이터 필터링
    return data.map(item => {
      const filteredItem = {
        [statsPeriod === 'daily' ? 'date' : statsPeriod === 'weekly' ? 'week' : 'month']: item[statsPeriod === 'daily' ? 'date' : statsPeriod === 'weekly' ? 'week' : 'month']
      };
      filteredItem[routeFilter] = item[routeFilter];
      return filteredItem;
    });
  };
  
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
  
  const handlePeriodChange = (e) => {
    setStatsPeriod(e.target.value);
  };
  
  const handleRouteFilterChange = (e) => {
    setRouteFilter(e.target.value);
  };
  
  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange({
      ...dateRange,
      [name]: value
    });
  };
  
  return (
    <div className="passenger-stats">
      <h1>노선별 탑승객 통계</h1>
      
      <div className="stats-controls">
        <div className="filter-group">
          <label>기간 선택:</label>
          <select value={statsPeriod} onChange={handlePeriodChange}>
            <option value="daily">일별</option>
            <option value="weekly">주별</option>
            <option value="monthly">월별</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>노선 선택:</label>
          <select value={routeFilter} onChange={handleRouteFilterChange}>
            {routes.map(route => (
              <option key={route.id} value={route.id}>{route.name}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group date-range">
          <label>조회 기간:</label>
          <div className="date-inputs">
            <input 
              type="date" 
              name="start" 
              value={dateRange.start} 
              onChange={handleDateRangeChange}
            />
            <span>~</span>
            <input 
              type="date" 
              name="end" 
              value={dateRange.end} 
              onChange={handleDateRangeChange}
            />
          </div>
        </div>
      </div>
      
      <div className="stats-charts">
        <div className="chart-container large">
          <h2>
            {statsPeriod === 'daily' ? '일별' : statsPeriod === 'weekly' ? '주별' : '월별'} 
            {routeFilter === 'all' ? ' 전체 노선' : ` ${routeDisplayNames[routeFilter]}`} 탑승객 추이
          </h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getChartData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={getXAxisKey()} />
                <YAxis />
                <Tooltip formatter={(value, name) => [value, routeDisplayNames[name] || name]} />
                <Legend formatter={(value) => routeDisplayNames[value] || value} />
                {routeFilter === 'all' ? (
                  <>
                    <Line type="monotone" dataKey="gangnam-songpa" stroke="#8884d8" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="seocho-gangnam" stroke="#83a6ed" />
                    <Line type="monotone" dataKey="songpa-gangdong" stroke="#8dd1e1" />
                    <Line type="monotone" dataKey="gangbuk-dobong" stroke="#82ca9d" />
                    <Line type="monotone" dataKey="jongno-junggu" stroke="#a4de6c" />
                    <Line type="monotone" dataKey="total" stroke="#ff7300" strokeWidth={2} />
                  </>
                ) : (
                  <Line type="monotone" dataKey={routeFilter} stroke="#8884d8" activeDot={{ r: 8 }} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="chart-row">
          <div className="chart-container">
            <h2>노선별 탑승객 비율</h2>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={routeRatioStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({name, percent}) => `${name} (${(percent * 100).toFixed(1)}%)`}
                  >
                    {routeRatioStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="chart-container">
            <h2>정류장별 승하차 인원</h2>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={stationStats}
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
                <th>{statsPeriod === 'daily' ? '날짜' : statsPeriod === 'weekly' ? '주' : '월'}</th>
                <th>강남-송파</th>
                <th>서초-강남</th>
                <th>송파-강동</th>
                <th>강북-도봉</th>
                <th>종로-중구</th>
                <th>전체</th>
              </tr>
            </thead>
            <tbody>
              {getActiveData().map((item, index) => (
                <tr key={index}>
                  <td>{item[getXAxisKey()]}</td>
                  <td>{item['gangnam-songpa'].toLocaleString()}명</td>
                  <td>{item['seocho-gangnam'].toLocaleString()}명</td>
                  <td>{item['songpa-gangdong'].toLocaleString()}명</td>
                  <td>{item['gangbuk-dobong'].toLocaleString()}명</td>
                  <td>{item['jongno-junggu'].toLocaleString()}명</td>
                  <td className="total-column">{item.total.toLocaleString()}명</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
            
      <div className="stats-summary">
        <h2>요약 통계</h2>
        <div className="summary-cards">
          <div className="summary-card">
            <h3>총 탑승객</h3>
            <p className="large-number">386,400<span>명</span></p>
            <p className="comparison positive">전월 대비 +8.2%</p>
          </div>
          
          <div className="summary-card">
            <h3>가장 많이 이용하는 노선</h3>
            <p className="highlighted">강남-송파</p>
            <p>총 34,900명 (26.6%)</p>
          </div>
          
          <div className="summary-card">
            <h3>가장 혼잡한 정류장</h3>
            <p className="highlighted">강남역</p>
            <p>승차: 2,840명, 하차: 2,650명</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PassengerStats;