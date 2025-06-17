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
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedMonthOnly, setSelectedMonthOnly] = useState('06');
  const [selectedMonth, setSelectedMonth] = useState('2025-06');
  const [monthRange, setMonthRange] = useState(() => {
    const today = new Date();
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
    return {
      start: `${sixMonthsAgo.getFullYear()}-${(sixMonthsAgo.getMonth() + 1).toString().padStart(2, '0')}`,
      end: `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`
    };
  });
  const [weekSelection, setWeekSelection] = useState('all'); // 'all', 'single', 'range'
  const [selectedWeek, setSelectedWeek] = useState('1');
  const [weekRange, setWeekRange] = useState({ start: '1', end: '2' });
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(today.getDate() - 13); // 2주 전부터
    return {
      start: twoWeeksAgo.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    };
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

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchInitialData();
  }, []);

  // 조회 기간 변경 시 데이터 재생성
  useEffect(() => {
    if (routes.length > 0 && stations.length > 0) {
      generateDummyPassengerData(routes.slice(1), stations.slice(0, 5));
    }
  }, [dateRange, monthRange, selectedYear, selectedMonthOnly, selectedWeek, weekRange, weekSelection, statsPeriod]);

  // 월의 주차 계산 함수
  const getWeekOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    // 해당 월의 1일
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0=일요일, 1=월요일...
    
    // 1일이 속한 주차 계산 (1일이 목요일 이후면 다음 주로 간주)
    const firstWeekDays = firstDayOfWeek <= 4 ? (8 - firstDayOfWeek) : (15 - firstDayOfWeek);
    
    if (day <= firstWeekDays) {
      return 1;
    }
    
    // 첫 주 이후의 주차 계산
    return Math.ceil((day - firstWeekDays) / 7) + 1;
  };

  // 해당 월의 총 주차 수 계산
  const getMaxWeekOfMonth = (year, month) => {
    const lastDay = new Date(year, month + 1, 0).getDate();
    const lastDate = new Date(year, month, lastDay);
    return getWeekOfMonth(lastDate);
  };

  // 주차 옵션 생성
  const getWeekOptions = () => {
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonthOnly) - 1;
    const maxWeeks = getMaxWeekOfMonth(year, month);
    const options = [];
    
    for (let i = 1; i <= maxWeeks; i++) {
      options.push({ value: i.toString(), label: `${i}주차` });
    }
    
    return options;
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
          date: `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
        };
        
        routeList.forEach((route, index) => {
          // 주말/평일에 따라 다른 패턴
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
          const isRushHour = d.getDay() >= 1 && d.getDay() <= 5; // 평일
          
          // 노선별 기본 승객 수 (노선마다 다른 인기도)
          const routePopularity = [1.5, 1.2, 0.8, 1.0, 0.9, 1.3, 0.7, 1.1, 0.6, 0.8][index % 10];
          const basePassengers = isWeekend ? 80 * routePopularity : 180 * routePopularity;
          
          // 시간대별 변동 (랜덤 + 패턴)
          const timeVariation = Math.sin((d.getDate() / 30) * Math.PI) * 0.3 + 1;
          const randomVariation = 0.7 + Math.random() * 0.6; // 0.7 ~ 1.3
          
          const passengers = Math.floor(basePassengers * timeVariation * randomVariation);
          dayData[route.id] = passengers;
        });
        
        dailyData.push(dayData);
      }
      
      setPassengerData(prev => ({ ...prev, daily: dailyData }));
      
    } else if (statsPeriod === 'weekly') {
      // 주별 데이터 생성
      const year = parseInt(selectedYear);
      const month = parseInt(selectedMonthOnly) - 1;
      const maxWeeks = getMaxWeekOfMonth(year, month);
      const weeklyData = [];
      
      // 표시할 주차 결정
      let weeksToShow = [];
      if (weekSelection === 'all') {
        // 모든 주차
        for (let i = 1; i <= maxWeeks; i++) {
          weeksToShow.push(i);
        }
      } else if (weekSelection === 'single') {
        // 선택된 단일 주차 - 최소 3주는 보여주기
        const selectedWeekNum = parseInt(selectedWeek);
        const startWeek = Math.max(1, selectedWeekNum - 1);
        const endWeek = Math.min(maxWeeks, selectedWeekNum + 1);
        for (let i = startWeek; i <= endWeek; i++) {
          weeksToShow.push(i);
        }
      } else if (weekSelection === 'range') {
        // 선택된 주차 범위
        const start = parseInt(weekRange.start);
        const end = parseInt(weekRange.end);
        for (let i = start; i <= end; i++) {
          weeksToShow.push(i);
        }
      }
      
      weeksToShow.forEach(weekNum => {
        const weekData = {
          week: `${parseInt(selectedMonthOnly)}월 ${weekNum}주차`
        };
        
        routeList.forEach((route, index) => {
          // 노선별 다른 승객 패턴
          const routePopularity = [1.5, 1.2, 0.8, 1.0, 0.9, 1.3, 0.7, 1.1, 0.6, 0.8][index % 10];
          
          // 주차별 트렌드 (월 초/중/말에 따른 변화)
          const weekTrend = weekNum === 1 ? 0.9 : weekNum === maxWeeks ? 0.8 : 1.0;
          
          // 기본 주간 승객 수
          const basePassengers = 1200 * routePopularity * weekTrend;
          const randomVariation = 0.8 + Math.random() * 0.4; // 0.8 ~ 1.2
          
          const passengers = Math.floor(basePassengers * randomVariation);
          weekData[route.id] = passengers;
        });
        
        weeklyData.push(weekData);
      });
      
      setPassengerData(prev => ({ ...prev, weekly: weeklyData }));
      
    } else if (statsPeriod === 'monthly') {
      // 월별 데이터 생성 (선택된 월 범위)
      const [startYear, startMonth] = monthRange.start.split('-').map(Number);
      const [endYear, endMonth] = monthRange.end.split('-').map(Number);
      const monthlyData = [];
      
      // 시작월부터 끝월까지 순회
      let currentYear = startYear;
      let currentMonth = startMonth;
      
      while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
        const monthData = {
          month: `${currentYear}년 ${currentMonth}월`
        };
        
        routeList.forEach((route, index) => {
          // 계절별 패턴 적용
          const seasonFactor = [0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.2, 1.0, 0.9, 0.8, 0.7];
          const monthIndex = currentMonth - 1;
          
          // 노선별 다른 승객 패턴
          const routePopularity = [1.5, 1.2, 0.8, 1.0, 0.9, 1.3, 0.7, 1.1, 0.6, 0.8][index % 10];
          
          const basePassengers = 8500 * seasonFactor[monthIndex] * routePopularity;
          const randomVariation = 0.85 + Math.random() * 0.3; // 0.85 ~ 1.15
          
          const passengers = Math.floor(basePassengers * randomVariation);
          monthData[route.id] = passengers;
        });
        
        monthlyData.push(monthData);
        
        // 다음 월로 이동
        currentMonth++;
        if (currentMonth > 12) {
          currentMonth = 1;
          currentYear++;
        }
      }
      
      setPassengerData(prev => ({ ...prev, monthly: monthlyData }));
    }
    
    // 노선별 탑승객 비율 데이터 (파이차트용) - 더 현실적이고 다양한 데이터
    const colors = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#ffc658', '#ff7300', '#e74c3c', '#9b59b6', '#3498db'];
    const routeRatioData = routeList.map((route, index) => {
      // 노선별 다른 인기도 패턴
      const popularity = [1.8, 1.5, 1.2, 1.0, 0.9, 1.3, 0.8, 1.1, 0.7, 0.6][index % 10];
      const baseValue = 1200;
      const seasonalFactor = statsPeriod === 'monthly' ? 
        [0.8, 0.9, 1.0, 1.1, 1.2, 1.1, 1.0, 0.9, 0.8, 0.7, 0.8, 0.9][new Date().getMonth()] : 1.0;
      
      return {
        name: route.name,
        value: Math.floor(baseValue * popularity * seasonalFactor * (0.8 + Math.random() * 0.4)),
        color: colors[index % colors.length]
      };
    });
    
    // 정류장별 승하차 데이터 - 더 현실적인 패턴
    const stationTypes = ['터미널', '대학교', '병원', '쇼핑몰', '주거지역', '공단', '관공서', '학교', '시장', '역사'];
    const stationStatsData = stationList.map((station, index) => {
      const stationType = stationTypes[index % stationTypes.length];
      
      // 정류장 유형별 승하차 패턴
      let boardingMultiplier = 1.0;
      let alightingMultiplier = 1.0;
      
      switch(stationType) {
        case '터미널':
          boardingMultiplier = 2.0;
          alightingMultiplier = 1.8;
          break;
        case '대학교':
          boardingMultiplier = 1.5;
          alightingMultiplier = 1.4;
          break;
        case '병원':
          boardingMultiplier = 1.2;
          alightingMultiplier = 1.3;
          break;
        case '쇼핑몰':
          boardingMultiplier = 1.3;
          alightingMultiplier = 1.7;
          break;
        case '주거지역':
          boardingMultiplier = 1.6;
          alightingMultiplier = 0.8;
          break;
        case '공단':
          boardingMultiplier = 0.7;
          alightingMultiplier = 1.5;
          break;
        default:
          boardingMultiplier = 1.0;
          alightingMultiplier = 1.0;
      }
      
      const baseBoarding = 150;
      const baseAlighting = 140;
      
      return {
        station: `${station.name || `정류장 ${station.id}`} (${stationType})`,
        boarding: Math.floor(baseBoarding * boardingMultiplier * (0.7 + Math.random() * 0.6)),
        alighting: Math.floor(baseAlighting * alightingMultiplier * (0.7 + Math.random() * 0.6))
      };
    });
    
    setPassengerData(prev => ({
      ...prev,
      routeRatio: routeRatioData,
      stationStats: stationStatsData
    }));
  };

  // 기본 더미 데이터 설정 (API 실패 시)
  const setDefaultDummyData = () => {
    const defaultRoutes = [
      { id: 'route1', name: '1번 (시청↔터미널)' },
      { id: 'route2', name: '2번 (대학교↔공단)' },
      { id: 'route3', name: '3번 (병원↔신도시)' },
      { id: 'route4', name: '4번 (역↔쇼핑몰)' },
      { id: 'route5', name: '5번 (주거지↔시장)' },
      { id: 'route6', name: '6번 (학교↔공원)' },
      { id: 'route7', name: '7번 (문화센터↔체육관)' },
      { id: 'route8', name: '8번 (고속터미널↔신시가지)' }
    ];
    
    const defaultStations = [
      { id: 'station1', name: '중앙터미널' },
      { id: 'station2', name: '시청앞' },
      { id: 'station3', name: '대학교정문' },
      { id: 'station4', name: '종합병원' },
      { id: 'station5', name: '쇼핑센터' },
      { id: 'station6', name: '공단입구' },
      { id: 'station7', name: '신도시중앙' },
      { id: 'station8', name: '기차역광장' },
      { id: 'station9', name: '전통시장' },
      { id: 'station10', name: '문화회관' }
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
  
  // 툴팁 포맷터 함수
  const formatTooltip = (value, name, props) => {
    if (name === 'total') return null; // total은 표시하지 않음
    
    const routeName = routes.find(r => r.id === name)?.name || name;
    return [`${value.toLocaleString()}명`, routeName];
  };

  // 툴팁 라벨 포맷터
  const formatTooltipLabel = (label) => {
    switch(statsPeriod) {
      case 'daily':
        return `${label} (일별)`;
      case 'weekly':
        return `${label}`;
      case 'monthly':
        return `${label}`;
      default:
        return label;
    }
  };

  // Y축 숫자 포맷 함수
  const formatYAxisTick = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };
  
  // BarChart용 Y축 범위 계산 함수
  const getBarChartYAxisDomain = () => {
    const data = passengerData.stationStats;
    if (!data || data.length === 0) return [0, 'auto'];
    
    let maxValue = 0;
    data.forEach(item => {
      maxValue = Math.max(maxValue, item.boarding, item.alighting);
    });
    
    return [0, Math.ceil(maxValue * 1.1)];
  };
  
  // Y축 범위 계산 함수
  const getYAxisDomain = () => {
    const data = getChartData();
    if (!data || data.length === 0) return [0, 'auto'];
    
    let maxValue = 0;
    let minValue = Infinity;
    
    data.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key !== getXAxisKey() && key !== 'total' && typeof item[key] === 'number') {
          maxValue = Math.max(maxValue, item[key]);
          minValue = Math.min(minValue, item[key]);
        }
      });
    });
    
    // 최소값은 0 또는 실제 최소값의 90%
    const yMin = Math.max(0, Math.floor(minValue * 0.9));
    // 최대값은 실제 최대값의 110%로 여백 확보
    const yMax = Math.ceil(maxValue * 1.1);
    
    return [yMin, yMax];
  };
  
  // 총 탑승객 수 계산 함수
  const getTotalPassengers = () => {
    const data = getActiveData();
    if (!data || data.length === 0) return 0;
    
    let total = 0;
    data.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key !== getXAxisKey() && typeof item[key] === 'number') {
          total += item[key];
        }
      });
    });
    
    return total;
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
      const twoWeeksAgo = new Date(today);
      twoWeeksAgo.setDate(today.getDate() - 13); // 2주간의 데이터
      setDateRange({
        start: twoWeeksAgo.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      });
    } else if (newPeriod === 'weekly') {
      // 주별 선택 시 기본값을 전체 주차로 설정
      setWeekSelection('all');
    } else if (newPeriod === 'monthly') {
      // 월별 선택 시 기본값을 최근 6개월로 설정
      const today = new Date();
      const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
      setMonthRange({
        start: `${sixMonthsAgo.getFullYear()}-${(sixMonthsAgo.getMonth() + 1).toString().padStart(2, '0')}`,
        end: `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`
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

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  const handleMonthRangeChange = (e) => {
    const { name, value } = e.target;
    setMonthRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleWeekSelectionChange = (e) => {
    setWeekSelection(e.target.value);
  };

  const handleSelectedWeekChange = (e) => {
    setSelectedWeek(e.target.value);
  };

  const handleWeekRangeChange = (e) => {
    const { name, value } = e.target;
    setWeekRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 빠른 날짜 선택 옵션
  const setQuickDateRange = (days) => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - days + 1);
    
    setDateRange({
      start: startDate.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    });
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
      
      <div className="stats-controls" style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '20px', 
        padding: '20px', 
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <div className="filter-group">
          <label style={{ 
            display: 'block', 
            marginBottom: '8px',
            fontWeight: 'bold', 
            fontSize: '14px',
            color: '#333'
          }}>기간 선택</label>
          <select 
            value={statsPeriod} 
            onChange={handlePeriodChange} 
            style={{ 
              padding: '8px 12px',
              border: '2px solid #e0e0e0',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
              minWidth: '100px'
            }}
          >
            <option value="daily">일별</option>
            <option value="weekly">주별</option>
            <option value="monthly">월별</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: 'bold', 
            fontSize: '14px',
            color: '#333'
          }}>노선 선택</label>
          <select 
            value={routeFilter} 
            onChange={handleRouteFilterChange} 
            style={{ 
              padding: '8px 12px',
              border: '2px solid #e0e0e0',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
              minWidth: '150px'
            }}
          >
            {routes.map(route => (
              <option key={route.id} value={route.id}>{route.name}</option>
            ))}
          </select>
        </div>
        
        <div className="date-selection-group" style={{ flex: 1, minWidth: '300px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: 'bold', 
            fontSize: '14px',
            color: '#333'
          }}>조회 기간</label>
          
          {statsPeriod === 'daily' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input 
                  type="date" 
                  name="start" 
                  value={dateRange.start} 
                  onChange={handleDateRangeChange}
                  style={{ 
                    padding: '8px 12px', 
                    border: '2px solid #e0e0e0', 
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                />
                <span style={{ color: '#666', fontWeight: 'bold' }}>~</span>
                <input 
                  type="date" 
                  name="end" 
                  value={dateRange.end} 
                  onChange={handleDateRangeChange}
                  min={dateRange.start}
                  style={{ 
                    padding: '8px 12px', 
                    border: '2px solid #e0e0e0', 
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setQuickDateRange(7)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #007bff',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    color: '#007bff',
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#007bff';
                    e.target.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.color = '#007bff';
                  }}
                >
                  최근 7일
                </button>
                <button 
                  onClick={() => setQuickDateRange(14)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #007bff',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    color: '#007bff',
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#007bff';
                    e.target.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.color = '#007bff';
                  }}
                >
                  최근 14일
                </button>
                <button 
                  onClick={() => setQuickDateRange(30)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #007bff',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    color: '#007bff',
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#007bff';
                    e.target.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.color = '#007bff';
                  }}
                >
                  최근 30일
                </button>
              </div>
            </div>
          )}
          
          {statsPeriod === 'weekly' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* 년도와 월 선택 */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input 
                  type="number" 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(e.target.value)}
                  min="2000"
                  max="2030"
                  placeholder="년도"
                  style={{ 
                    padding: '8px 12px', 
                    border: '2px solid #e0e0e0', 
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    width: '80px'
                  }}
                />
                <span style={{ color: '#666', fontSize: '14px' }}>년</span>
                <select 
                  value={selectedMonthOnly} 
                  onChange={(e) => setSelectedMonthOnly(e.target.value)}
                  style={{ 
                    padding: '8px 12px', 
                    border: '2px solid #e0e0e0', 
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="01">1월</option>
                  <option value="02">2월</option>
                  <option value="03">3월</option>
                  <option value="04">4월</option>
                  <option value="05">5월</option>
                  <option value="06">6월</option>
                  <option value="07">7월</option>
                  <option value="08">8월</option>
                  <option value="09">9월</option>
                  <option value="10">10월</option>
                  <option value="11">11월</option>
                  <option value="12">12월</option>
                </select>
              </div>
              
              {/* 주차 선택 옵션 */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="radio" 
                    id="week-all" 
                    name="weekSelection" 
                    value="all" 
                    checked={weekSelection === 'all'} 
                    onChange={handleWeekSelectionChange}
                  />
                  <label htmlFor="week-all" style={{ fontSize: '14px', cursor: 'pointer' }}>
                    전체 주차
                  </label>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="radio" 
                    id="week-single" 
                    name="weekSelection" 
                    value="single" 
                    checked={weekSelection === 'single'} 
                    onChange={handleWeekSelectionChange}
                  />
                  <label htmlFor="week-single" style={{ fontSize: '14px', cursor: 'pointer' }}>
                    특정 주차
                  </label>
                  {weekSelection === 'single' && (
                    <select 
                      value={selectedWeek} 
                      onChange={handleSelectedWeekChange}
                      style={{ 
                        padding: '6px 10px', 
                        border: '2px solid #e0e0e0', 
                        borderRadius: '4px',
                        fontSize: '13px',
                        backgroundColor: 'white'
                      }}
                    >
                      {getWeekOptions().map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="radio" 
                    id="week-range" 
                    name="weekSelection" 
                    value="range" 
                    checked={weekSelection === 'range'} 
                    onChange={handleWeekSelectionChange}
                  />
                  <label htmlFor="week-range" style={{ fontSize: '14px', cursor: 'pointer' }}>
                    주차 범위
                  </label>
                  {weekSelection === 'range' && (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <select 
                        name="start"
                        value={weekRange.start} 
                        onChange={handleWeekRangeChange}
                        style={{ 
                          padding: '6px 10px', 
                          border: '2px solid #e0e0e0', 
                          borderRadius: '4px',
                          fontSize: '13px',
                          backgroundColor: 'white'
                        }}
                      >
                        {getWeekOptions().map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <span style={{ fontSize: '13px', color: '#666' }}>~</span>
                      <select 
                        name="end"
                        value={weekRange.end} 
                        onChange={handleWeekRangeChange}
                        style={{ 
                          padding: '6px 10px', 
                          border: '2px solid #e0e0e0', 
                          borderRadius: '4px',
                          fontSize: '13px',
                          backgroundColor: 'white'
                        }}
                      >
                        {getWeekOptions().map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {statsPeriod === 'monthly' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input 
                  type="month" 
                  name="start"
                  value={monthRange.start} 
                  onChange={handleMonthRangeChange}
                  style={{ 
                    padding: '8px 12px', 
                    border: '2px solid #e0e0e0', 
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                />
                <span style={{ color: '#666', fontWeight: 'bold', margin: '0 8px' }}>~</span>
                <input 
                  type="month" 
                  name="end"
                  value={monthRange.end} 
                  onChange={handleMonthRangeChange}
                  min={monthRange.start}
                  style={{ 
                    padding: '8px 12px', 
                    border: '2px solid #e0e0e0', 
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => {
                    const today = new Date();
                    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
                    setMonthRange({
                      start: `${sixMonthsAgo.getFullYear()}-${(sixMonthsAgo.getMonth() + 1).toString().padStart(2, '0')}`,
                      end: `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`
                    });
                  }}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #007bff',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    color: '#007bff',
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#007bff';
                    e.target.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.color = '#007bff';
                  }}
                >
                  최근 6개월
                </button>
                <button 
                  onClick={() => {
                    const today = new Date();
                    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), 1);
                    setMonthRange({
                      start: `${oneYearAgo.getFullYear()}-${(oneYearAgo.getMonth() + 1).toString().padStart(2, '0')}`,
                      end: `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`
                    });
                  }}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #007bff',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    color: '#007bff',
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#007bff';
                    e.target.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.color = '#007bff';
                  }}
                >
                  최근 1년
                </button>
                <button 
                  onClick={() => {
                    const today = new Date();
                    const currentYear = today.getFullYear();
                    setMonthRange({
                      start: `${currentYear}-01`,
                      end: `${currentYear}-12`
                    });
                  }}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #007bff',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    color: '#007bff',
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#007bff';
                    e.target.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.color = '#007bff';
                  }}
                >
                  올해 전체
                </button>
              </div>
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
                <YAxis 
                  domain={getYAxisDomain()} 
                  tickFormatter={formatYAxisTick}
                />
                <Tooltip 
                  formatter={formatTooltip}
                  labelFormatter={formatTooltipLabel}
                />
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
                  <Tooltip formatter={(value) => [value.toLocaleString() + '명', '탑승객 수']} />
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
                  <YAxis 
                    domain={getBarChartYAxisDomain()} 
                    tickFormatter={formatYAxisTick}
                  />
                  <Tooltip formatter={(value) => [value.toLocaleString() + '명', '']} />
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
              {getTotalPassengers().toLocaleString()}
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