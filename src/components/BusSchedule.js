// components/BusSchedule.js - 완전한 버전 (MongoDB 구조 처리 포함)
import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import koLocale from '@fullcalendar/core/locales/ko';
import ApiService from '../services/api';
import '../styles/BusSchedule.css';

/**
 * 버스 기사 배치표 컴포넌트 - MongoDB 구조 처리 포함
 * MongoDB ObjectId와 DBRef를 올바르게 처리하여 버스 기사, 버스, 노선 정보를 관리하고 스케줄 CRUD 기능 제공
 */
function BusSchedule() {
  // FullCalendar 참조
  const calendarRef = useRef(null);
  
  // 상태 관리
  const [schedules, setSchedules] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // 모달 상태
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [currentEditingEvent, setCurrentEditingEvent] = useState(null);
  
  // 폼 데이터
  const [formData, setFormData] = useState({
    id: '',
    driverId: '',
    busId: '',
    routeId: '',
    operationDate: '',
    startTime: '08:00',
    endTime: '17:00',
    isRecurring: false, // isRepeating에서 변경
    recurringWeeks: 4   // repeatWeeks에서 변경
  });

  // 폼 데이터 리셋 함수 수정
  const resetFormData = () => {
    setFormData({
      id: '',
      driverId: '',
      busId: '',
      routeId: '',
      operationDate: '',
      startTime: '08:00',
      endTime: '17:00',
      isRecurring: false, // isRepeating에서 변경
      recurringWeeks: 4   // repeatWeeks에서 변경
    });
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadInitialData();
  }, []);

  // 캘린더 날짜 변경 시 해당 월의 데이터 로드
  useEffect(() => {
    fetchSchedulesForMonth(currentDate);
  }, [currentDate]);

    // 버스 선택 시 노선 자동 선택 - MongoDB 구조 처리
  useEffect(() => {
    if (modalMode === 'add' && formData.busId) {
      console.log('🔄 === 버스 선택 시 노선 자동 선택 시작 ===');
      console.log('🔄 선택된 버스 ID:', formData.busId, '(타입:', typeof formData.busId, ')');
      
      // 버스 찾기
      const selectedBus = buses.find(bus => {
        const match = String(bus.id) === String(formData.busId);
        if (match) {
          console.log('🔄 ✅ 매칭된 버스 찾음:', bus);
        }
        return match;
      });
      
      if (selectedBus) {
        console.log('🔄 선택된 버스 정보:');
        console.log('   - ID:', selectedBus.id);
        console.log('   - 번호:', selectedBus.busNumber);
        console.log('   - 노선명:', selectedBus.routeName);
        
        // 버스의 노선명으로 노선 데이터에서 해당 노선 찾기
        if (selectedBus.routeName) {
          const matchingRoute = routes.find(route => 
            route.routeName === selectedBus.routeName
          );
          
          if (matchingRoute) {
            console.log('🔄 ✅ 매칭된 노선 찾음:', matchingRoute);
            console.log('🔄 ✅ 노선 ID 자동 선택:', matchingRoute.id);
            setFormData(prev => ({
              ...prev,
              routeId: String(matchingRoute.id)
            }));
          } else {
            console.log('🔄 ⚠️ 노선명과 일치하는 노선 데이터를 찾을 수 없음');
            console.log('🔄 버스 노선명:', selectedBus.routeName);
            console.log('🔄 사용 가능한 노선들:', routes.map(r => r.routeName));
            setFormData(prev => ({
              ...prev,
              routeId: ''
            }));
          }
        } else {
          console.log('🔄 ⚠️ 선택된 버스에 노선명 정보 없음');
          setFormData(prev => ({
            ...prev,
            routeId: ''
          }));
        }
      } else {
        console.log('🔄 ❌ 선택된 버스를 찾을 수 없음');
        console.log('🔄 전체 버스 ID 목록:', buses.map(b => b.id));
      }
      
      console.log('🔄 === 노선 자동 선택 완료 ===');
    }
  }, [formData.busId, buses, modalMode, routes]);

  // 초기 데이터 로드 - 에러 처리 개선
  const loadInitialData = async () => {
    setLoading(true);
    setError(null); // 에러 상태 초기화
    
    try {
      console.log('=== 초기 데이터 로드 시작 ===');
      
      const results = await Promise.allSettled([
        fetchSchedulesForMonth(currentDate),
        fetchDrivers(),
        fetchBuses(),
        fetchRoutes()
      ]);
      
      // 각 API 호출 결과 확인
      results.forEach((result, index) => {
        const apiNames = ['스케줄', '기사', '버스', '노선'];
        if (result.status === 'rejected') {
          console.error(`${apiNames[index]} 로드 실패:`, result.reason);
        } else {
          console.log(`${apiNames[index]} 로드 성공`);
        }
      });
      
      console.log('=== 초기 데이터 로드 완료 ===');
    } catch (error) {
      console.error('초기 데이터 로드 실패:', error);
      setError('데이터를 불러오는데 실패했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 월별 스케줄 데이터 가져오기
  const fetchSchedulesForMonth = async (date) => {
    try {
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      console.log('월별 스케줄 조회 요청:', yearMonth);
      
      const response = await ApiService.getMonthlyOperationPlans(yearMonth);
      console.log('월별 스케줄 API 응답:', response);
      
      if (response && response.data) {
        // API 응답에서 스케줄 데이터 추출
        const scheduleData = Array.isArray(response.data) ? response.data : [];
        setSchedules(scheduleData);
      } else {
        setSchedules([]);
      }
    } catch (error) {
      console.error('월별 스케줄 조회 실패:', error);
      setSchedules([]);
      // 에러가 발생해도 다른 데이터는 계속 로드
    }
  };

  // 오늘 스케줄 데이터 가져오기
  const fetchTodaySchedules = async () => {
    try {
      console.log('오늘 스케줄 조회 요청');
      const response = await ApiService.getTodayOperationPlans();
      console.log('오늘 스케줄 API 응답:', response);
      
      if (response && response.data) {
        const scheduleData = Array.isArray(response.data) ? response.data : [];
        setSchedules(scheduleData);
      }
    } catch (error) {
      console.error('오늘 스케줄 조회 실패:', error);
      throw error;
    }
  };

  // 주별 스케줄 데이터 가져오기
  const fetchWeeklySchedules = async (startDate = null) => {
    try {
      console.log('주별 스케줄 조회 요청:', startDate);
      const response = await ApiService.getWeeklyOperationPlans(startDate);
      console.log('주별 스케줄 API 응답:', response);
      
      if (response && response.data) {
        const scheduleData = Array.isArray(response.data) ? response.data : [];
        setSchedules(scheduleData);
      }
    } catch (error) {
      console.error('주별 스케줄 조회 실패:', error);
      throw error;
    }
  };

  // 특정 날짜 스케줄 데이터 가져오기
  const fetchSchedulesByDate = async (date) => {
    try {
      const dateStr = typeof date === 'string' ? date : ApiService.formatDate(date);
      console.log('일별 스케줄 조회 요청:', dateStr);
      
      const response = await ApiService.getOperationPlansByDate(dateStr);
      console.log('일별 스케줄 API 응답:', response);
      
      if (response && response.data) {
        const scheduleData = Array.isArray(response.data) ? response.data : [];
        setSchedules(scheduleData);
      }
    } catch (error) {
      console.error('일별 스케줄 조회 실패:', error);
      throw error;
    }
  };

  // 버스 기사 데이터 가져오기
  const fetchDrivers = async () => {
    try {
      const response = await ApiService.getOrganizationDrivers();
      console.log('기사 API 응답:', response);
      
      if (response && response.data) {
        setDrivers(response.data);
      } else {
        setDrivers([]);
      }
    } catch (error) {
      console.error('버스 기사 조회 실패:', error);
      setDrivers([]);
    }
  };

  // 버스 데이터 가져오기 - MongoDB 구조 처리
  const fetchBuses = async () => {
    try {
      console.log('🚌 === 버스 데이터 로드 시작 ===');
      
      const response = await ApiService.getAllBuses();
      console.log('🚌 버스 API 최종 응답:', response);
      
      if (response && response.data && Array.isArray(response.data)) {
        console.log(`🚌 ${response.data.length}개의 버스 데이터 수신`);
        
        // 각 버스의 핵심 정보 확인
        response.data.forEach((bus, index) => {
          console.log(`🚌 버스 ${index + 1}:`, {
            id: bus.id,
            busNumber: bus.busNumber,
            routeId: bus.routeId,
            hasValidId: !!bus.id,
            hasValidBusNumber: !!bus.busNumber,
            hasValidRouteId: !!bus.routeId
          });
        });
        
        setBuses(response.data);
        console.log('🚌 ✅ 버스 데이터 설정 완료');
      } else {
        console.warn('🚌 ⚠️ 버스 API 응답 구조가 예상과 다름:', response);
        setBuses([]);
      }
      
      console.log('🚌 === 버스 데이터 로드 완료 ===');
    } catch (error) {
      console.error('🚌 ❌ 버스 조회 실패:', error);
      setBuses([]);
    }
  };

  // 노선 데이터 가져오기 - MongoDB 구조 처리
  const fetchRoutes = async () => {
    try {
      console.log('🛣️ === 노선 데이터 로드 시작 ===');
      
      const response = await ApiService.getAllRoutes();
      console.log('🛣️ 노선 API 최종 응답:', response);
      
      if (response && response.data && Array.isArray(response.data)) {
        console.log(`🛣️ ${response.data.length}개의 노선 데이터 수신`);
        
        // 각 노선의 핵심 정보 확인
        response.data.forEach((route, index) => {
          console.log(`🛣️ 노선 ${index + 1}:`, {
            id: route.id,
            routeName: route.routeName,
            hasValidId: !!route.id,
            hasValidRouteName: !!route.routeName
          });
        });
        
        setRoutes(response.data);
        console.log('🛣️ ✅ 노선 데이터 설정 완료');
      } else {
        console.warn('🛣️ ⚠️ 노선 API 응답 구조가 예상과 다름:', response);
        setRoutes([]);
      }
      
      console.log('🛣️ === 노선 데이터 로드 완료 ===');
    } catch (error) {
      console.error('🛣️ ❌ 노선 조회 실패:', error);
      setRoutes([]);
    }
  };

  // 스케줄을 FullCalendar 이벤트로 변환하는 함수 수정
  const getCalendarEvents = () => {
    return schedules.map(schedule => {
      const driver = drivers.find(d => String(d.id) === String(schedule.driverId));
      const bus = buses.find(b => String(b.id) === String(schedule.busId));
      const route = routes.find(r => String(r.id) === String(schedule.routeId));
      
      // 백엔드 DTO 형식에 맞게 날짜/시간 처리
      let operationDate = schedule.operationDate;
      let startTime = schedule.startTime || '08:00';
      let endTime = schedule.endTime || '17:00';
      
      // 날짜와 시간 결합
      const startDateTime = `${operationDate}T${startTime}`;
      const endDateTime = `${operationDate}T${endTime}`;
      
      return {
        id: schedule.id,
        title: `${driver?.name || '미지정'} - ${bus?.busNumber || '미지정'}번`,
        start: startDateTime,
        end: endDateTime,
        backgroundColor: getDriverColor(driver?.name),
        borderColor: getDriverColor(driver?.name),
        extendedProps: {
          id: schedule.id,
          driverId: schedule.driverId,
          driverName: driver?.name || '미지정',
          busId: schedule.busId,
          busNumber: bus?.busNumber || '미지정',
          routeId: schedule.routeId,
          routeName: route?.routeName || '미지정',
          operationDate: operationDate,
          startTime: startTime,
          endTime: endTime,
          originalSchedule: schedule
        }
      };
    });
  };

  // 기사별 색상 지정
  const getDriverColor = (driverName) => {
    const colors = {
      '김철수': '#3498db',
      '박영희': '#e74c3c',
      '이민수': '#27ae60',
      '최지영': '#9b59b6',
      '정현우': '#f39c12'
    };
    return colors[driverName] || '#95a5a6';
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (info) => {
    setModalMode('add');
    setFormData({
      id: '',
      driverId: '',
      busId: '',
      routeId: '',
      operationDate: info.dateStr,
      startTime: '08:00',
      endTime: '17:00',
      isRepeating: false,
      repeatWeeks: 4
    });
    setShowModal(true);
  };

  // 이벤트 클릭 핸들러
  const handleEventClick = (info) => {
    const event = info.event;
    setSelectedSchedule(event.extendedProps);
    setCurrentEditingEvent(event);
    setShowDetailModal(true);
  };

  // 캘린더 날짜 변경 핸들러
  const handleDatesSet = (dateInfo) => {
    const newDate = new Date(dateInfo.start);
    setCurrentDate(newDate);
  };

  // 폼 입력 핸들러
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // 스케줄 추가/수정 제출 함수 - MongoDB 구조 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('📝 === 폼 제출 시작 ===');
      console.log('📝 현재 formData:', formData);
      
      // 선택된 버스 찾기
      const selectedBus = buses.find(bus => String(bus.id) === String(formData.busId));
      
      if (!selectedBus) {
        console.error('📝 ❌ 선택된 버스를 찾을 수 없음');
        console.log('📝 찾으려는 busId:', formData.busId);
        console.log('📝 사용 가능한 버스들:', buses.map(b => ({id: b.id, busNumber: b.busNumber})));
        alert('선택된 버스 정보를 찾을 수 없습니다.');
        return;
      }
      
      console.log('📝 ✅ 선택된 버스 확인:', selectedBus);
      
      // 필수 검증
      if (!formData.driverId) {
        alert('기사를 선택해주세요.');
        return;
      }
      
      // 최종 요청 데이터 구성
      const finalRouteId = selectedBus.routeId || formData.routeId;
      
      const baseRequestData = {
        busId: String(selectedBus.id), // MongoDB ObjectId에서 추출한 실제 ID
        busNumber: selectedBus.busNumber, // 사용자에게 보이는 버스 번호
        driverId: String(formData.driverId), // 기사 ID
        routeId: finalRouteId ? String(finalRouteId) : '', // DBRef에서 추출한 노선 ID
        operationDate: formData.operationDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        isRecurring: Boolean(formData.isRecurring)
      };
      
      console.log('📝 === 최종 요청 데이터 검증 ===');
      console.log('📝 busId:', baseRequestData.busId, '✅ (ObjectId에서 추출)');
      console.log('📝 busNumber:', baseRequestData.busNumber, '✅ (표시용 번호)');
      console.log('📝 driverId:', baseRequestData.driverId, '✅');
      console.log('📝 routeId:', baseRequestData.routeId, finalRouteId ? '✅ (DBRef에서 추출)' : '⚠️ (비어있음)');
      console.log('📝 전체 요청 데이터:', baseRequestData);
      
      if (modalMode === 'add') {
        if (formData.isRecurring && formData.recurringWeeks > 0) {
          // 반복 스케줄
          const requestData = {
            ...baseRequestData,
            recurringWeeks: formData.recurringWeeks
          };
          
          console.log('📝 🔄 반복 운행 일정 요청:', requestData);
          await ApiService.addOperationPlan(requestData);
          alert(`${formData.recurringWeeks}주 동안의 반복 스케줄이 추가되었습니다!`);
        } else {
          // 단일 스케줄
          console.log('📝 ➕ 단일 운행 일정 요청:', baseRequestData);
          await ApiService.addOperationPlan(baseRequestData);
          alert('운행 배치가 추가되었습니다!');
        }
      } else {
        // 수정 모드
        const requestData = {
          id: String(formData.id),
          ...baseRequestData
        };
        
        console.log('📝 ✏️ 운행 일정 수정 요청:', requestData);
        await ApiService.updateOperationPlan(requestData);
        alert('운행 배치가 수정되었습니다!');
      }
      
      // 성공 후 처리
      await fetchSchedulesForMonth(currentDate);
      setShowModal(false);
      resetFormData();
      
      console.log('📝 ✅ 폼 제출 완료');
    } catch (error) {
      console.error('📝 ❌ 폼 제출 실패:', error);
      alert('스케줄 저장에 실패했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 스케줄 삭제
  const handleDelete = async () => {
    if (window.confirm('이 운행 배치를 삭제하시겠습니까?')) {
      setLoading(true);
      try {
        const scheduleId = selectedSchedule.id;
        console.log('삭제할 스케줄 ID:', scheduleId);
        
        await ApiService.deleteOperationPlan(scheduleId);
        await fetchSchedulesForMonth(currentDate);
        setShowDetailModal(false);
        alert('운행 배치가 삭제되었습니다.');
      } catch (error) {
        console.error('스케줄 삭제 실패:', error);
        alert('스케줄 삭제에 실패했습니다: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // 수정 모드로 전환
  const handleEdit = () => {
    setModalMode('edit');
    setFormData({
      id: selectedSchedule.id,
      driverId: selectedSchedule.driverId,
      busId: selectedSchedule.busId,
      routeId: selectedSchedule.routeId,
      operationDate: selectedSchedule.operationDate,
      startTime: selectedSchedule.startTime,
      endTime: selectedSchedule.endTime,
      isRepeating: false,
      repeatWeeks: 4
    });
    setShowDetailModal(false);
    setShowModal(true);
  };

  // 오늘 스케줄 보기
  const handleViewToday = async () => {
    setLoading(true);
    try {
      await fetchTodaySchedules();
      alert('오늘의 운행 일정을 불러왔습니다.');
    } catch (error) {
      console.error('오늘 스케줄 조회 실패:', error);
      alert('오늘 스케줄 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 이번 주 스케줄 보기
  const handleViewThisWeek = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
      const startDate = ApiService.formatDate(startOfWeek);
      
      await fetchWeeklySchedules(startDate);
      alert('이번 주 운행 일정을 불러왔습니다.');
    } catch (error) {
      console.error('이번 주 스케줄 조회 실패:', error);
      alert('이번 주 스케줄 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bus-schedule">
      <div className="header">
        <h1>🚌 버스 운행 배치표</h1>
      </div>
      
      <div className="controls">
        <div>
          <button 
            className="btn btn-success" 
            onClick={() => {
              setModalMode('add');
              resetFormData();
              setFormData(prev => ({
                ...prev,
                operationDate: new Date().toISOString().split('T')[0]
              }));
              setShowModal(true);
            }}
            disabled={loading}
          >
            + 운행 배치 추가
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleViewToday}
            disabled={loading}
          >
            📅 오늘 일정
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleViewThisWeek}
            disabled={loading}
          >
            📊 이번 주
          </button>
        </div>
        <div>
          <button 
            className="btn btn-primary"
            onClick={() => fetchSchedulesForMonth(currentDate)}
            disabled={loading}
          >
            🔄 새로고침
          </button>
        </div>
      </div>
      
      <div className="calendar-container">
        {loading && schedules.length === 0 ? (
          <div className="loading">데이터를 불러오는 중...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale={koLocale}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek'
            }}
            events={getCalendarEvents()}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            datesSet={handleDatesSet}
            height="700px"
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }}
          />
        )}
      </div>
      
      <div className="legend">
        {drivers.map(driver => (
          <div key={driver.id} className="legend-item">
            <div 
              className="legend-color" 
              style={{ backgroundColor: getDriverColor(driver.name) }}
            ></div>
            <span>{driver.name}</span>
          </div>
        ))}
      </div>
      
      {/* 추가/수정 모달 */}
      {showModal && (
        <div className="modal" style={{ display: 'block' }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>{modalMode === 'add' ? '운행 배치 추가' : '운행 배치 수정'}</h3>
              <span className="close" onClick={() => setShowModal(false)}>&times;</span>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="operationDate">운행 날짜:</label>
                <input 
                  type="date" 
                  id="operationDate"
                  name="operationDate"
                  value={formData.operationDate}
                  onChange={handleInputChange}
                  disabled={modalMode === 'edit'} // 수정 모드에서는 날짜 변경 불가
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="driverId">버스 기사:</label>
                  <select 
                    id="driverId"
                    name="driverId"
                    value={formData.driverId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">기사를 선택하세요</option>
                    {drivers.map(driver => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name} ({driver.licenseNumber || driver.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="busId">버스:</label>
                <select 
                  id="busId"
                  name="busId"
                  value={formData.busId}
                  onChange={handleInputChange}
                  disabled={modalMode === 'edit' || loading}
                  required
                >
                  <option value="">
                    {loading ? '로딩 중...' : buses.length === 0 ? '버스 정보 없음' : '버스를 선택하세요'}
                  </option>
                  {buses.map(bus => (
                    <option key={bus.id} value={bus.id}>
                      {bus.busNumber}번 ({bus.totalSeats || 0}석)
                      {bus.routeName && bus.routeName !== '노선 정보 조회 필요' ? ` - ${bus.routeName}` : ''}
                    </option>
                  ))}
                </select>
                
                {/* 실시간 선택 정보 */}
                {formData.busId && (
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#666', 
                    marginTop: '8px',
                    padding: '8px',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}>
                    <div><strong>✅ 선택된 버스 정보:</strong></div>
                    <div>🆔 버스 ID: <code>{formData.busId}</code></div>
                    <div>🚌 버스 번호: <code>{buses.find(b => String(b.id) === String(formData.busId))?.busNumber}</code></div>
                    <div>🛣️ 노선 ID: <code>{buses.find(b => String(b.id) === String(formData.busId))?.routeId || '없음'}</code></div>
                    {buses.find(b => String(b.id) === String(formData.busId))?.routeName && (
                      <div>📍 노선명: <code>{buses.find(b => String(b.id) === String(formData.busId))?.routeName}</code></div>
                    )}
                  </div>
                )}
                
                {/* 개발 모드에서 전체 버스 목록 표시 */}
                {process.env.NODE_ENV === 'development' && buses.length > 0 && (
                  <details style={{ marginTop: '15px', fontSize: '12px' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                      🔍 전체 버스 목록 디버깅 정보 ({buses.length}개)
                    </summary>
                    <div style={{ 
                      marginTop: '10px', 
                      padding: '10px', 
                      backgroundColor: '#f8f9fa', 
                      border: '1px solid #dee2e6',
                      borderRadius: '4px',
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}>
                      {buses.map((bus, index) => (
                        <div key={bus.id} style={{ 
                          padding: '4px 0', 
                          borderBottom: index < buses.length - 1 ? '1px solid #eee' : 'none' 
                        }}>
                          <strong>버스 {index + 1}:</strong>
                          <br />
                          &nbsp;&nbsp;🆔 ID: <code>{bus.id}</code>
                          <br />
                          &nbsp;&nbsp;🚌 번호: <code>{bus.busNumber}</code>
                          <br />
                          &nbsp;&nbsp;🛣️ 노선ID: <code>{bus.routeId || '없음'}</code>
                          <br />
                          &nbsp;&nbsp;📍 노선명: <code>{bus.routeName || '없음'}</code>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
              
              {/* 추가 모드에서는 노선 선택칸 숨김, 수정 모드에서는 읽기 전용으로 표시 */}
              {modalMode === 'edit' && (
                <div className="form-group">
                  <label htmlFor="routeId">노선 (변경 불가):</label>
                  <select 
                    id="routeId"
                    name="routeId"
                    value={formData.routeId}
                    disabled={true}
                    style={{ backgroundColor: '#f5f5f5', color: '#666' }}
                  >
                    <option value="">노선을 선택하세요</option>
                    {routes.map(route => (
                      <option key={route.id} value={route.id}>
                        {route.routeName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startTime">운행 시작 시간:</label>
                  <input 
                    type="time" 
                    id="startTime"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="endTime">운행 종료 시간:</label>
                  <input 
                    type="time" 
                    id="endTime"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              {(modalMode === 'add' && formData.routeId) && (
                <div className="form-group">
                  <label htmlFor="routeId">자동 선택된 노선:</label>
                  <div style={{ 
                    padding: '8px 12px', 
                    backgroundColor: '#e8f5e9', 
                    border: '1px solid #4caf50', 
                    borderRadius: '4px',
                    color: '#2e7d32'
                  }}>
                    {routes.find(r => String(r.id) === String(formData.routeId))?.routeName || '노선 정보 없음'}
                  </div>
                </div>
              )}

              {modalMode === 'edit' && (
                <div className="form-group">
                  <label htmlFor="routeId">노선 (변경 불가):</label>
                  <select 
                    id="routeId"
                    name="routeId"
                    value={formData.routeId}
                    disabled={true}
                    style={{ backgroundColor: '#f5f5f5', color: '#666' }}
                  >
                    <option value="">노선을 선택하세요</option>
                    {routes.map(route => (
                      <option key={route.id} value={route.id}>
                        {route.routeName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="form-group">
                <button 
                  type="submit" 
                  className="btn btn-success" 
                  style={{ width: '100%', marginTop: '15px', padding: '12px' }}
                  disabled={loading}
                >
                  {loading ? '처리중...' : (modalMode === 'add' ? '운행 배치 추가' : '운행 배치 수정')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* 상세정보 모달 */}
      {showDetailModal && selectedSchedule && (
        <div className="modal" style={{ display: 'block' }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>운행 상세정보</h3>
              <span className="close" onClick={() => setShowDetailModal(false)}>&times;</span>
            </div>
            <div className="detail-content">
              <div className="detail-section">
                <h4>🚌 운행 정보</h4>
                <div className="detail-row">
                  <span className="detail-label">운행 날짜:</span>
                  <span className="detail-value">{selectedSchedule.operationDate}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">운행 시간:</span>
                  <span className="detail-value">{selectedSchedule.startTime} - {selectedSchedule.endTime}</span>
                </div>
              </div>
              
              <div className="detail-section">
                <h4>👨‍💼 기사 정보</h4>
                <div className="detail-row">
                  <span className="detail-label">기사명:</span>
                  <span className="detail-value">{selectedSchedule.driverName}</span>
                </div>
              </div>
              
              <div className="detail-section">
                <h4>🚐 버스 정보</h4>
                <div className="detail-row">
                  <span className="detail-label">버스 번호:</span>
                  <span className="detail-value">{selectedSchedule.busNumber}번</span>
                </div>
              </div>
              
              <div className="detail-section">
                <h4>🛣️ 노선 정보</h4>
                <div className="detail-row">
                  <span className="detail-label">노선명:</span>
                  <span className="detail-value">{selectedSchedule.routeName}</span>
                </div>
              </div>
            </div>
            <div className="button-group">
              <button className="btn btn-warning" onClick={handleEdit} disabled={loading}>
                수정
              </button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={loading}>
                {loading ? '처리중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BusSchedule;