import React, { useState } from 'react';
import styled from 'styled-components';

// Custom Icon Components
const IconHome = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

const IconUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const IconBus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 6v6"></path>
    <path d="M15 6v6"></path>
    <path d="M2 12h19.6"></path>
    <path d="M18 18h3a1 1 0 0 0 1-1v-7a8 8 0 0 0-16 0v7a1 1 0 0 0 1 1h3"></path>
    <circle cx="7" cy="18" r="2"></circle>
    <circle cx="17" cy="18" r="2"></circle>
  </svg>
);

const IconMapPin = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const IconClock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const IconLogOut = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

const IconPieChart = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
    <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
  </svg>
);

const IconMap = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
    <line x1="8" y1="2" x2="8" y2="18"></line>
    <line x1="16" y1="6" x2="16" y2="22"></line>
  </svg>
);

const IconActivity = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
  </svg>
);

// Styled Components
const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  background-color: #f7f7f7;
`;

const Sidebar = styled.div`
  width: 16rem;
  background-color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const SidebarHeader = styled.div`
  padding: 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  text-align: center;
`;

const BrandTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: bold;
  color: #2563eb;
`;

const NavContainer = styled.nav`
  padding: 1rem;
`;

const BottomNavContainer = styled.div`
  position: absolute;
  bottom: 0;
  width: 14rem;
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
`;

const LogoutButton = styled.button`
  width: 85%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ef4444;
  color: white;
  padding: 0.5rem;
  border-radius: 0.25rem;
  cursor: pointer;
  border: none;
  
  &:hover {
    background-color: #dc2626;
  }
`;

const MenuContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const MenuItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-radius: 0.25rem;
  background-color: ${props => props.active ? '#dbeafe' : 'transparent'};
  color: ${props => props.active ? '#2563eb' : 'inherit'};
  cursor: pointer;
  border: none;
  
  &:hover {
    background-color: ${props => props.active ? '#dbeafe' : '#f3f4f6'};
  }
`;

const MenuItemLabel = styled.span`
  margin-left: 0.75rem;
`;

const MainContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.875rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
`;

const Card = styled.div`
  background-color: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const CardTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
`;

const IconWrapper = styled.span`
  margin-right: 0.5rem;
  color: ${props => props.color || 'inherit'};
`;

const StatCardContainer = styled.div`
  background-color: ${props => props.bgColor || '#dbeafe'};
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
`;

const StatCardContent = styled.div`
  margin-left: 1rem;
`;

const StatCardTitle = styled.p`
  color: #4b5563;
`;

const StatCardValue = styled.p`
  font-size: 1.5rem;
  font-weight: bold;
`;

const StatsFlexGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  text-align: center;
`;

const StatItem = styled.div``;

const StatLabel = styled.p`
  color: #6b7280;
`;

const StatValue = styled.p`
  font-size: 1.5rem;
  font-weight: bold;
  color: ${props => props.color || 'inherit'};
`;

const RouteInfoContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const RouteInfoContent = styled.div`
  flex: 1;
`;

const RouteInfoLabel = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  background-color: #e5e7eb;
  border-radius: 9999px;
  height: 0.625rem;
  margin-top: 0.25rem;
`;

const ProgressBar = styled.div`
  height: 0.625rem;
  border-radius: 9999px;
  background-color: ${props => props.color || '#2563eb'};
  width: ${props => props.width || '0%'};
`;

const RouteInfoStats = styled.div`
  margin-left: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
`;

const UserInfo = styled.div`
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 1rem;
`;

const UserEmail = styled.p`
  font-size: 0.875rem;
  color: #4b5563;
  text-align: center;
  margin-bottom: 0.5rem;
`;

// Main Component
const AdminDashboard = ({ userData, onLogout }) => {
  const [activeMenu, setActiveMenu] = useState('dashboard');

  const handleLogout = () => {
    // 로그아웃 처리
    if (onLogout) {
      onLogout();
    }
  };

  const renderContent = () => {
    switch(activeMenu) {
      case 'dashboard': return <MainDashboard />;
      case 'members': return <MemberManagement />;
      case 'buses': return <BusManagement />;
      case 'routes': return <RouteManagement />;
      case 'stations': return <StationManagement />;
      default: return <MainDashboard />;
    }
  };

  return (
    <AppContainer>
      {/* Sidebar */}
      <Sidebar>
        <SidebarHeader>
          <BrandTitle>버스 관리 시스템</BrandTitle>
        </SidebarHeader>
        
        {/* 사용자 정보 표시 */}
        {userData && (
          <UserInfo>
            <UserEmail>{userData.email}</UserEmail>
          </UserInfo>
        )}
        
        <NavContainer>
          <SidebarMenu 
            items={[
              { 
                icon: <IconHome />, 
                label: '대시보드', 
                key: 'dashboard' 
              },
              { 
                icon: <IconUsers />, 
                label: '회원 관리', 
                key: 'members' 
              },
              { 
                icon: <IconBus />, 
                label: '버스 관리', 
                key: 'buses' 
              },
              { 
                icon: <IconClock />, 
                label: '운행 정보', 
                key: 'routes' 
              },
              { 
                icon: <IconMapPin />, 
                label: '정류장 관리', 
                key: 'stations' 
              }
            ]}
            activeMenu={activeMenu}
            onMenuChange={setActiveMenu}
          />
        </NavContainer>
        <BottomNavContainer>
          <LogoutButton onClick={handleLogout}>
            <IconLogOut style={{ marginRight: '0.5rem' }} /> 로그아웃
          </LogoutButton>
        </BottomNavContainer>
      </Sidebar>

      {/* Main Content */}
      <MainContent>
        {renderContent()}
      </MainContent>
    </AppContainer>
  );
};

// Sidebar Menu Component
const SidebarMenu = ({ items, activeMenu, onMenuChange }) => {
  return (
    <MenuContainer>
      {items.map(item => (
        <MenuItem
          key={item.key}
          active={activeMenu === item.key}
          onClick={() => onMenuChange(item.key)}
        >
          {item.icon}
          <MenuItemLabel>{item.label}</MenuItemLabel>
        </MenuItem>
      ))}
    </MenuContainer>
  );
};

// Main Dashboard Component
const MainDashboard = () => {
  return (
    <div>
      <SectionTitle>대시보드</SectionTitle>
      
      {/* Key Statistics */}
      <StatsGrid>
        <StatCard 
          title="총 버스" 
          value="42" 
          icon={<IconBus />} 
          bgColor="#dbeafe"
          iconColor="#2563eb"
        />
        <StatCard 
          title="총 버스 기사" 
          value="58" 
          icon={<IconUsers />} 
          bgColor="#dcfce7"
          iconColor="#16a34a"
        />
        <StatCard 
          title="오늘 운행 노선" 
          value="12" 
          icon={<IconMapPin />} 
          bgColor="#f3e8ff"
          iconColor="#9333ea"
        />
        <StatCard 
          title="총 이용자" 
          value="5,420" 
          icon={<IconActivity />} 
          bgColor="#fee2e2"
          iconColor="#dc2626"
        />
      </StatsGrid>

      {/* Realtime Stats */}
      <ContentGrid>
        <Card>
          <CardTitle>
            <IconWrapper color="#2563eb"><IconPieChart /></IconWrapper> 
            실시간 버스 운행 현황
          </CardTitle>
          <StatsFlexGroup>
            <StatItem>
              <StatLabel>총 버스</StatLabel>
              <StatValue color="#2563eb">42</StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>운행 중</StatLabel>
              <StatValue color="#16a34a">28</StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>대기 중</StatLabel>
              <StatValue color="#dc2626">14</StatValue>
            </StatItem>
          </StatsFlexGroup>
        </Card>

        <Card>
          <CardTitle>
            <IconWrapper color="#16a34a"><IconMap /></IconWrapper> 
            주요 운행 노선 현황
          </CardTitle>
          <div>
            <RouteInfo 
              name="노선 1" 
              busCount={8} 
              percentage={38} 
              color="#2563eb" 
            />
            <RouteInfo 
              name="노선 2" 
              busCount={6} 
              percentage={28} 
              color="#16a34a" 
            />
            <RouteInfo 
              name="노선 3" 
              busCount={14} 
              percentage={34} 
              color="#9333ea" 
            />
          </div>
        </Card>
      </ContentGrid>
    </div>
  );
};

// Member Management Component
const MemberManagement = () => {
  return (
    <div>
      <SectionTitle>회원 관리</SectionTitle>
      <ContentGrid>
        <Card>
          <CardTitle>버스 기사 관리</CardTitle>
          <div>
            <p>버스 기사 목록이 여기에 표시됩니다.</p>
          </div>
        </Card>
        <Card>
          <CardTitle>이용자 관리</CardTitle>
          <div>
            <p>이용자 목록이 여기에 표시됩니다.</p>
          </div>
        </Card>
      </ContentGrid>
    </div>
  );
};

// Bus Management Component
const BusManagement = () => {
  return (
    <div>
      <SectionTitle>버스 관리</SectionTitle>
      <ContentGrid>
        <Card>
          <CardTitle>버스 목록</CardTitle>
          <div>
            <p>버스 목록이 여기에 표시됩니다.</p>
          </div>
        </Card>
        <Card>
          <CardTitle>버스 등록</CardTitle>
          <div>
            <p>버스 등록 폼이 여기에 표시됩니다.</p>
          </div>
        </Card>
      </ContentGrid>
    </div>
  );
};

// Route Management Component
const RouteManagement = () => {
  return (
    <div>
      <SectionTitle>운행 정보</SectionTitle>
      <ContentGrid>
        <Card>
          <CardTitle>현재 운행 버스</CardTitle>
          <div>
            <p>현재 운행 중인 버스 목록이 여기에 표시됩니다.</p>
          </div>
        </Card>
        <Card>
          <CardTitle>운행 통계</CardTitle>
          <div>
            <p>운행 통계가 여기에 표시됩니다.</p>
          </div>
        </Card>
      </ContentGrid>
    </div>
  );
};

// Station Management Component
const StationManagement = () => {
  return (
    <div>
      <SectionTitle>정류장 관리</SectionTitle>
      <ContentGrid>
        <Card>
          <CardTitle>정류장 목록</CardTitle>
          <div>
            <p>정류장 목록이 여기에 표시됩니다.</p>
          </div>
        </Card>
        <Card>
          <CardTitle>정류장 등록</CardTitle>
          <div>
            <p>정류장 등록 폼이 여기에 표시됩니다.</p>
          </div>
        </Card>
      </ContentGrid>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon, bgColor, iconColor }) => {
  return (
    <StatCardContainer bgColor={bgColor}>
      <IconWrapper color={iconColor}>{icon}</IconWrapper>
      <StatCardContent>
        <StatCardTitle>{title}</StatCardTitle>
        <StatCardValue>{value}</StatCardValue>
      </StatCardContent>
    </StatCardContainer>
  );
};

// Route Info Component
const RouteInfo = ({ name, busCount, percentage, color }) => {
  return (
    <RouteInfoContainer>
      <RouteInfoContent>
        <RouteInfoLabel>{name}</RouteInfoLabel>
        <ProgressBarContainer>
          <ProgressBar color={color} width={`${percentage}%`} />
        </ProgressBarContainer>
      </RouteInfoContent>
      <RouteInfoStats>
        {busCount}대 ({percentage}%)
      </RouteInfoStats>
    </RouteInfoContainer>
  );
};

export default AdminDashboard;