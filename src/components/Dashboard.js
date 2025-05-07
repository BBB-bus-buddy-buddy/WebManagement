// components/Dashboard.js
import React from 'react';

function Dashboard() {
  // Dummy data for dashboard
  const stats = {
    activeBuses: 24,
    totalDrivers: 78,
    totalUsers: 1245,
    totalRoutes: 15,
    totalStops: 127,
    todayPassengers: 3752
  };

  return (
    <div className="dashboard">
      <h1>대시보드</h1>
      
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
          <p className="stat-value">{stats.totalStops}</p>
        </div>
        <div className="stat-card">
          <h3>오늘 탑승객 수</h3>
          <p className="stat-value">{stats.todayPassengers}</p>
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="chart-container">
          <h3>시간대별 탑승객 현황</h3>
          <div className="chart-placeholder">
            {/* Chart would be implemented with a library like Chart.js or Recharts */}
            차트 자리
          </div>
        </div>
        <div className="chart-container">
          <h3>노선별 탑승객 현황</h3>
          <div className="chart-placeholder">
            차트 자리
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;