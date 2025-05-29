// components/BusSchedule.js - 새로운 API 적용 버전
import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import koLocale from '@fullcalendar/core/locales/ko';
import ApiService from '../services/api';
import '../styles/BusSchedule.css';

/**
 * 버스 기사 배치표 컴포넌트 - 새로운 API 적용
 * 새로운 operation-plan API를 사용하여 버스 기사, 버스, 노선 정보를 관리하고 스케줄 CRUD 기능 제공
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
    isRepeating: false,
    repeatWeeks: 4
  });

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadInitialData();
  }, []);

  // 캘린더 날짜 변경 시 해당 월의 데이터 로드
  useEffect(() => {
    fetchSchedulesForMonth(currentDate);
  }, [currentDate]);

  // 초기 데이터 로드
  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSchedulesForMonth(currentDate),
        fetchDrivers(),
        fetchBuses(),
        fetchRoutes()
      ]);
    } catch (error) {
      console.error('초기 데이터 로드 실패:', error);
      setError('데이터를 불러오는데 실패했습니다.');
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
      }
    } catch (error) {
      console.error('버스 기사 조회 실패:', error);
      // 에러 시 더미 데이터 사용
      setDrivers([
        { id: '1', name: '김철수', licenseNumber: 'D-1001' },
        { id: '2', name: '박영희', licenseNumber: 'D-1002' },
        { id: '3', name: '이민수', licenseNumber: 'D-2001' },
        { id: '4', name: '최지영', licenseNumber: 'D-2002' },
        { id: '5', name: '정현우', licenseNumber: 'D-3001' }
      ]);
    }
  };

  // 버스 데이터 가져오기
  const fetchBuses = async () => {
    try {
      const response = await ApiService.getAllBuses();
      console.log('버스 API 응답:', response);
      
      if (response && response.data) {
        setBuses(response.data);
      }
    } catch (error) {
      console.error('버스 조회 실패:', error);
      // 에러 시 더미 데이터 사용
      setBuses([
        { id: '1', busNumber: '108', totalSeats: 45 },
        { id: '2', busNumber: '302', totalSeats: 40 },
        { id: '3', busNumber: '401', totalSeats: 50 },
        { id: '4', busNumber: '152', totalSeats: 45 },
        { id: '5', busNumber: '273', totalSeats: 42 }
      ]);
    }
  };

  // 노선 데이터 가져오기
  const fetchRoutes = async () => {
    try {
      const response = await ApiService.getAllRoutes();
      console.log('노선 API 응답:', response);
      
      if (response && response.data) {
        setRoutes(response.data);
      }
    } catch (error) {
      console.error('노선 조회 실패:', error);
      // 에러 시 더미 데이터 사용
      setRoutes([
        { id: '1', routeName: '강남-송파', stations: [] },
        { id: '2', routeName: '서초-강남', stations: [] },
        { id: '3', routeName: '송파-강동', stations: [] },
        { id: '4', routeName: '강북-도봉', stations: [] },
        { id: '5', routeName: '종로-중구', stations: [] }
      ]);
    }
  };

  // 스케줄을 FullCalendar 이벤트로 변환
  const getCalendarEvents = () => {
    return schedules.map(schedule => {
      const driver = drivers.find(d => d.id === schedule.driverId);
      const bus = buses.find(b => b.id === schedule.busId);
      const route = routes.find(r => r.id === schedule.routeId);
      
      // 운행 날짜 및 시간 처리
      let operationDate = schedule.operationDate || schedule.date;
      let startTime = '08:00';
      let endTime = '17:00';
      
      // 시간 정보 추출
      if (schedule.operationStart && schedule.operationEnd) {
        // ISO 날짜 문자열에서 시간 추출
        const startDate = new Date(schedule.operationStart);
        const endDate = new Date(schedule.operationEnd);
        
        operationDate = ApiService.formatDate(startDate);
        startTime = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
        endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
      } else if (schedule.startTime && schedule.endTime) {
        // 별도의 시간 필드가 있는 경우
        startTime = schedule.startTime;
        endTime = schedule.endTime;
      } else if (schedule.operationTime) {
        // 기존 형식: "08:00-17:00"
        const [start, end] = schedule.operationTime.split('-');
        startTime = start || '08:00';
        endTime = end || '17:00';
      }
      
      // 날짜와 시간 결합
      const startDateTime = `${operationDate}T${startTime}`;
      const endDateTime = `${operationDate}T${endTime}`;
      
      return {
        id: schedule.id || schedule.operationPlanID || schedule._id,
        title: `${driver?.name || '미지정'} - ${bus?.busNumber || '미지정'}번`,
        start: startDateTime,
        end: endDateTime,
        backgroundColor: getDriverColor(driver?.name),
        borderColor: getDriverColor(driver?.name),
        extendedProps: {
          id: schedule.id || schedule.operationPlanID || schedule._id,
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

  // 스케줄 추가/수정 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // OperationPlanDTO 형식에 맞게 데이터 준비
      const operationStartDate = new Date(`${formData.operationDate}T${formData.startTime}`);
      const operationEndDate = new Date(`${formData.operationDate}T${formData.endTime}`);
      
      const requestData = {
        driverId: formData.driverId,
        busId: formData.busId,
        routeId: formData.routeId,
        operationStart: operationStartDate.toISOString(),
        operationEnd: operationEndDate.toISOString()
      };
      
      // 수정 모드인 경우 ID 추가
      if (modalMode === 'edit' && formData.id) {
        requestData.id = formData.id;
      }
      
      console.log('운행 일정 요청 데이터:', requestData);
      
      if (modalMode === 'add') {
        // 추가 모드
        if (formData.isRepeating && formData.repeatWeeks > 0) {
          // 반복 스케줄 생성
          const promises = [];
          for (let i = 0; i < formData.repeatWeeks; i++) {
            const repeatDate = new Date(formData.operationDate);
            repeatDate.setDate(repeatDate.getDate() + (i * 7));
            
            const repeatStartDate = new Date(`${ApiService.formatDate(repeatDate)}T${formData.startTime}`);
            const repeatEndDate = new Date(`${ApiService.formatDate(repeatDate)}T${formData.endTime}`);
            
            const repeatData = {
              ...requestData,
              operationStart: repeatStartDate.toISOString(),
              operationEnd: repeatEndDate.toISOString()
            };
            
            promises.push(ApiService.addOperationPlan(repeatData));
          }
          
          await Promise.all(promises);
          alert(`${formData.repeatWeeks}개의 반복 스케줄이 추가되었습니다!`);
        } else {
          // 단일 스케줄 추가
          await ApiService.addOperationPlan(requestData);
          alert('운행 배치가 추가되었습니다!');
        }
      } else {
        // 수정 모드
        await ApiService.updateOperationPlan(requestData);
        alert('운행 배치가 수정되었습니다!');
      }
      
      // 데이터 새로고침
      await fetchSchedulesForMonth(currentDate);
      
      // 모달 닫기
      setShowModal(false);
      resetFormData();
    } catch (error) {
      console.error('스케줄 저장 실패:', error);
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

  // 폼 데이터 리셋
  const resetFormData = () => {
    setFormData({
      id: '',
      driverId: '',
      busId: '',
      routeId: '',
      operationDate: '',
      startTime: '08:00',
      endTime: '17:00',
      isRepeating: false,
      repeatWeeks: 4
    });
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
                
                <div className="form-group">
                  <label htmlFor="busId">버스:</label>
                  <select 
                    id="busId"
                    name="busId"
                    value={formData.busId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">버스를 선택하세요</option>
                    {buses.map(bus => (
                      <option key={bus.id || bus.busNumber} value={bus.id || bus.busNumber}>
                        {bus.busNumber}번 ({bus.totalSeats}석)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="routeId">노선:</label>
                <select 
                  id="routeId"
                  name="routeId"
                  value={formData.routeId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">노선을 선택하세요</option>
                  {routes.map(route => (
                    <option key={route.id} value={route.id}>
                      {route.routeName}
                    </option>
                  ))}
                </select>
              </div>
              
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
              
              {modalMode === 'add' && (
                <div className="form-group">
                  <label>일정 반복:</label>
                  <div className="checkbox-group">
                    <input 
                      type="checkbox" 
                      id="isRepeating"
                      name="isRepeating"
                      checked={formData.isRepeating}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="isRepeating">매주 반복 (같은 요일에 반복)</label>
                  </div>
                  {formData.isRepeating && (
                    <div className="checkbox-group" style={{ marginTop: '5px' }}>
                      <label htmlFor="repeatWeeks">반복 주수:</label>
                      <input 
                        type="number" 
                        id="repeatWeeks"
                        name="repeatWeeks"
                        min="1" 
                        max="52" 
                        value={formData.repeatWeeks}
                        onChange={handleInputChange}
                        style={{ width: '80px', marginLeft: '10px' }}
                      />
                      <span style={{ marginLeft: '5px' }}>주</span>
                    </div>
                  )}
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