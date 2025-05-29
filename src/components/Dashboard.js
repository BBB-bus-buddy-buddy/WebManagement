// components/Dashboard.js
import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import ApiService from '../services/api'; // 경로 확인 필요

function Dashboard() {
  // 대시보드 통계 상태
  const [stats, setStats] = useState({
    activeBuses: 0,
    totalDrivers: 0, // 실제 API에서 가져올 예정
    totalUsers: 0,
    totalRoutes: 0,
    totalStations: 0,
    todayPassengers: 0
  });
  
  // 로딩 상태 추가
  const [isLoading, setIsLoading] = useState(true);
  
  // 노선별 탑승객 데이터 상태
  const [routePassengerData, setRoutePassengerData] = useState([]);

  // 시간대별 탑승객 데이터 (실제 서비스처럼 보이는 더미데이터)
  const hourlyPassengerData = [
    { time: '06:00', passengers: 125 },
    { time: '07:00', passengers: 380 },
    { time: '08:00', passengers: 542 },
    { time: '09:00', passengers: 420 },
    { time: '10:00', passengers: 230 },
    { time: '11:00', passengers: 180 },
    { time: '12:00', passengers: 320 },
    { time: '13:00', passengers: 280 },
    { time: '14:00', passengers: 190 },
    { time: '15:00', passengers: 240 },
    { time: '16:00', passengers: 350 },
    { time: '17:00', passengers: 485 },
    { time: '18:00', passengers: 520 },
    { time: '19:00', passengers: 380 },
    { time: '20:00', passengers: 220 },
    { time: '21:00', passengers: 150 },
    { time: '22:00', passengers: 80 }
  ];

  // 차트 색상 배열
  const chartColors = [
    '#8884d8', '#82ca9d', '#ffc658', '#83a6ed', 
    '#8dd1e1', '#d084d0', '#ffb347', '#ff8042',
    '#a4de6c', '#d0743c', '#ff6b6b', '#4ecdc4',
    '#45b7d1', '#96ceb4', '#dda0dd', '#98d8c8'
  ];

  // 컴포넌트 마운트 시 데이터 가져오기
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // 각 API 호출을 try-catch로 개별 처리하여 하나가 실패해도 다른 것은 계속 처리
        // 1. 이용자 데이터 가져오기
        let totalUsers = 0;
        try {
          const usersResponse = await ApiService.getAllUsers();
          console.log('이용자 API 응답:', usersResponse);
          
          if (usersResponse?.data && Array.isArray(usersResponse.data)) {
            totalUsers = usersResponse.data.length;
          } else if (usersResponse?.user && Array.isArray(usersResponse.user)) {
            totalUsers = usersResponse.user.length;
          } else if (Array.isArray(usersResponse)) {
            totalUsers = usersResponse.length;
          }
        } catch (error) {
          console.error('이용자 데이터 가져오기 실패:', error);
        }
        
        // 2. 노선 데이터 가져오기
        let totalRoutes = 0;
        let routeData = [];
        try {
          const routesResponse = await ApiService.getAllRoutes();
          console.log('노선 API 응답:', routesResponse);
          
          if (routesResponse?.data && Array.isArray(routesResponse.data)) {
            totalRoutes = routesResponse.data.length;
            routeData = routesResponse.data;
          } else if (Array.isArray(routesResponse)) {
            totalRoutes = routesResponse.length;
            routeData = routesResponse;
          }
          
          // 노선별 탑승객 데이터 생성 (실제 서비스처럼 보이는 더미데이터)
          const routePassengers = routeData.map((route, index) => {
            // 각 노선에 대해 현실적인 탑승객 수 생성 (200~900명 사이)
            const basePassengers = Math.floor(Math.random() * 500) + 300;
            const variation = Math.floor(Math.random() * 200) - 100;
            
            return {
              route: route.routeName || route.name || `노선 ${index + 1}`,
              passengers: basePassengers + variation,
              color: chartColors[index % chartColors.length]
            };
          }).sort((a, b) => b.passengers - a.passengers); // 탑승객 수로 내림차순 정렬
          
          setRoutePassengerData(routePassengers);
          
        } catch (error) {
          console.error('노선 데이터 가져오기 실패:', error);
          // API 실패 시 기본 더미데이터 사용
          setRoutePassengerData([
            { route: '메인 노선', passengers: 856, color: '#8884d8' },
            { route: '순환 노선', passengers: 742, color: '#82ca9d' },
            { route: '지선 노선', passengers: 658, color: '#ffc658' }
          ]);
        }
        
        // 3. 정류장 데이터 가져오기
        let totalStations = 0;
        try {
          const stationsResponse = await ApiService.getAllStations();
          console.log('정류장 API 응답:', stationsResponse);
          
          if (stationsResponse?.data && Array.isArray(stationsResponse.data)) {
            totalStations = stationsResponse.data.length;
          } else if (Array.isArray(stationsResponse)) {
            totalStations = stationsResponse.length;
          }
        } catch (error) {
          console.error('정류장 데이터 가져오기 실패:', error);
        }
        
        // 4. 버스 기사 데이터 가져오기 (실제 API 사용)
        let totalDrivers = 0;
        try {
          const driversResponse = await ApiService.getOrganizationDrivers();
          console.log('버스 기사 API 응답:', driversResponse);
          
          if (driversResponse?.data && Array.isArray(driversResponse.data)) {
            totalDrivers = driversResponse.data.length;
          } else if (Array.isArray(driversResponse)) {
            totalDrivers = driversResponse.length;
          }
        } catch (error) {
          console.error('버스 기사 데이터 가져오기 실패:', error);
          totalDrivers = 5; // API 실패 시 기본값
        }
        
        // 오늘 탑승객 수 계산 (더미데이터에서)
        const todayPassengers = hourlyPassengerData.reduce((sum, item) => sum + item.passengers, 0);
        
        // 모든 데이터 상태 업데이트
        setStats({
          activeBuses: Math.floor(totalDrivers * 0.7), // 기사 수의 70%가 운행 중이라고 가정
          totalDrivers: totalDrivers,
          totalUsers: totalUsers || 120, // API 실패 시 기본값 사용
          totalRoutes: totalRoutes || 7, // API 실패 시 기본값 사용
          totalStations: totalStations || 50, // API 실패 시 기본값 사용
          todayPassengers: todayPassengers
        });
      } catch (error) {
        console.error('대시보드 데이터 가져오기 오류:', error);
        // 오류 발생 시 기본값으로 설정
        setStats({
          activeBuses: 3,
          totalDrivers: 5,
          totalUsers: 120,
          totalRoutes: 7,
          totalStations: 50,
          todayPassengers: 5472
        });
        // 오류 시 기본 노선 데이터
        setRoutePassengerData([
          { route: '메인 노선', passengers: 856, color: '#8884d8' },
          { route: '순환 노선', passengers: 742, color: '#82ca9d' },
          { route: '지선 노선', passengers: 658, color: '#ffc658' }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="dashboard">
      <h1>대시보드</h1>
      
      {isLoading ? (
        <div className="loading">데이터를 불러오는 중...</div>
      ) : (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>현재 운행 중인 버스</h3>
            <p className="stat-value">{stats.activeBuses}</p>
          </div>
          <div className="stat-card">
            <h3>총 버스 기사 수</h3>
            <p className="stat-value">{stats.totalDrivers}</p>
          </div>
          <div className="stat-card">
            <h3>등록된 이용자 수</h3>
            <p className="stat-value">{stats.totalUsers}</p>
          </div>
          <div className="stat-card">
            <h3>총 노선 수</h3>
            <p className="stat-value">{stats.totalRoutes}</p>
          </div>
          <div className="stat-card">
            <h3>총 정류장 수</h3>
            <p className="stat-value">{stats.totalStations}</p>
          </div>
          <div className="stat-card">
            <h3>오늘 탑승객 수</h3>
            <p className="stat-value">{stats.todayPassengers.toLocaleString()}</p>
          </div>
        </div>
      )}

      <div className="dashboard-charts">
        <div className="chart-container">
          <h3>시간대별 탑승객 현황</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyPassengerData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="passengers" 
                  stroke="#1976d2" 
                  strokeWidth={2}
                  name="탑승객 수"
                  dot={{ fill: '#1976d2', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="chart-container">
          <h3>노선별 탑승객 현황</h3>
          <div className="chart-wrapper">
            {routePassengerData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={routePassengerData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="route" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="passengers" 
                    name="탑승객 수"
                    fill="#8884d8"
                  >
                    {routePassengerData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ 
                height: '300px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#757575'
              }}>
                노선 데이터를 불러오는 중...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;