// components/BusSchedule.js - 수정된 버전
import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import koLocale from '@fullcalendar/core/locales/ko';
import ApiService from '../services/api';
import '../styles/BusSchedule.css';

/**
 * 버스 기사 배치표 컴포넌트 - 개선된 버전
 * /api/operation-plan 엔드포인트 기반으로 스케줄 CRUD 기능 제공
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
    operationId: '',
    driverId: '',
    busId: '',
    busNumber: '',
    busRealNumber: '',
    routeId: '',
    routeName: '',
    operationDate: '',
    startTime: '08:00',
    endTime: '18:00',
    status: '스케줄 등록됨',
    isRecurring: false,
    recurringWeeks: 4
  });

  // 폼 데이터 리셋 함수
  const resetFormData = () => {
    setFormData({
      id: '',
      operationId: '',
      driverId: '',
      busId: '',
      busNumber: '',
      busRealNumber: '',
      routeId: '',
      routeName: '',
      operationDate: '',
      startTime: '08:00',
      endTime: '18:00',
      status: '스케줄 등록됨',
      isRecurring: false,
      recurringWeeks: 4
    });
  };

  // 시간 문자열을 시간 객체로 변환하는 함수
  const timeStringToObject = (timeStr) => {
    const [hour, minute] = timeStr.split(':').map(Number);
    return {
      hour: hour || 0,
      minute: minute || 0,
      second: 0,
      nano: 0
    };
  };

  // 시간 객체를 문자열로 변환하는 함수
  const timeObjectToString = (timeObj) => {
    if (typeof timeObj === 'string') return timeObj;
    if (!timeObj) return '00:00';
    
    const hour = String(timeObj.hour || 0).padStart(2, '0');
    const minute = String(timeObj.minute || 0).padStart(2, '0');
    return `${hour}:${minute}`;
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadInitialData();
  }, []);

  // 캘린더 날짜 변경 시 해당 월의 데이터 로드
  useEffect(() => {
    fetchSchedulesForMonth(currentDate);
  }, [currentDate]);

  // 버스 선택 시 노선 자동 선택 및 버스 번호 설정
  useEffect(() => {
    if (formData.busNumber) {
      console.log('🔄 === 버스 선택 시 자동 설정 시작 ===');
      console.log('🔄 선택된 버스 번호:', formData.busNumber);
      console.log('🔄 buses 배열:', buses);
      
      const selectedBus = buses.find(bus => String(bus.busNumber) === String(formData.busNumber));
      console.log('🔄 매칭 결과:', selectedBus);
      
      if (selectedBus) {
        console.log('🔄 선택된 버스 정보:', selectedBus);
        console.log('🔄 버스 ID(실제):', selectedBus.id);
        console.log('🔄 버스 번호:', selectedBus.busNumber);
        console.log('🔄 ID와 번호가 다름:', selectedBus.id !== selectedBus.busNumber);
        
        // 버스 관련 정보 자동 설정
        const newFormData = {
          busId: selectedBus.id || '', // 실제 버스 ID 설정 (MongoDB ObjectId)
          busRealNumber: selectedBus.busRealNumber || selectedBus.busNumber || ''
        };
        
        // 버스에 routeName이 있으면 사용 (routeId가 undefined여도)
        if (selectedBus.routeName) {
          console.log('🔄 버스의 routeName:', selectedBus.routeName);
          newFormData.routeName = selectedBus.routeName;
          
          // routeId가 있으면 사용, 없으면 routeName으로 routes에서 찾기
          if (selectedBus.routeId && selectedBus.routeId !== 'undefined') {
            console.log('🔄 버스의 routeId:', selectedBus.routeId);
            newFormData.routeId = String(selectedBus.routeId);
          } else {
            // routeName으로 routes에서 매칭되는 route 찾기
            const matchingRoute = routes.find(route => 
              route.routeName === selectedBus.routeName
            );
            if (matchingRoute) {
              console.log('🔄 ✅ routeName으로 매칭된 노선 찾음:', matchingRoute);
              newFormData.routeId = String(matchingRoute.id);
            } else {
              console.log('🔄 ⚠️ routeName과 일치하는 노선을 찾을 수 없음');
              newFormData.routeId = '';
            }
          }
        } else if (selectedBus.routeId && selectedBus.routeId !== 'undefined') {
          // routeName은 없지만 routeId가 있는 경우
          console.log('🔄 버스의 routeId:', selectedBus.routeId);
          newFormData.routeId = String(selectedBus.routeId);
          
          const matchingRoute = routes.find(route => 
            String(route.id) === String(selectedBus.routeId)
          );
          if (matchingRoute) {
            console.log('🔄 ✅ routeId로 매칭된 노선 찾음:', matchingRoute);
            newFormData.routeName = matchingRoute.routeName || '';
          } else {
            newFormData.routeName = '';
          }
        } else {
          console.log('🔄 ⚠️ 선택된 버스에 노선 정보 없음');
          newFormData.routeId = '';
          newFormData.routeName = '';
        }
        
        setFormData(prev => {
          const updated = {
            ...prev,
            ...newFormData
          };
          console.log('🔄 formData 업데이트 전:', prev);
          console.log('🔄 formData 업데이트 후:', updated);
          return updated;
        });
        
        console.log('🔄 ✅ 자동 설정 완료:', {
          ...newFormData,
          busId: newFormData.busId || '빈 값'
        });
      } else {
        console.log('🔄 ❌ 선택된 버스를 찾을 수 없음');
        setFormData(prev => ({
          ...prev,
          busId: '',
          busRealNumber: '',
          routeId: '',
          routeName: ''
        }));
      }
      
      console.log('🔄 === 자동 설정 완료 ===');
    }
  }, [formData.busNumber, buses, routes]);

  // 초기 데이터 로드
  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('=== 초기 데이터 로드 시작 ===');
      
      const results = await Promise.allSettled([
        fetchSchedulesForMonth(currentDate),
        fetchDrivers(),
        fetchBuses(),
        fetchRoutes()
      ]);
      
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
      
      if (response && response.data && Array.isArray(response.data)) {
        // 시간 데이터 정규화 및 버스 정보 보완
        const normalizedSchedules = response.data.map(schedule => {
          // 버스 정보 보완 - buses 배열에서 추가 정보 가져오기
          let enrichedBusInfo = {};
          
          if (schedule.busNumber) {
            const matchingBus = buses.find(bus => String(bus.busNumber) === String(schedule.busNumber));
            if (matchingBus) {
              enrichedBusInfo = {
                busId: matchingBus.id, // MongoDB ObjectId
                busRealNumber: matchingBus.busRealNumber || matchingBus.busNumber,
                routeName: schedule.routeName || matchingBus.routeName,
                routeId: schedule.routeId || matchingBus.routeId
              };
              console.log(`버스 ${schedule.busNumber}번 정보 보완:`, enrichedBusInfo);
            }
          }
          
          return {
            ...schedule,
            ...enrichedBusInfo,
            startTime: timeObjectToString(schedule.startTime),
            endTime: timeObjectToString(schedule.endTime)
          };
        });
        setSchedules(normalizedSchedules);
      } else {
        setSchedules([]);
      }
    } catch (error) {
      console.error('월별 스케줄 조회 실패:', error);
      setSchedules([]);
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

  // 버스 데이터 가져오기
  const fetchBuses = async () => {
    try {
      console.log('🚌 === 버스 데이터 로드 시작 ===');
      
      const response = await ApiService.getAllBuses();
      console.log('🚌 버스 API 최종 응답:', response);
      
      if (response && response.data && Array.isArray(response.data)) {
        console.log(`🚌 ${response.data.length}개의 버스 데이터 수신`);
        
        // api.js에서 이미 정규화된 데이터가 오므로 그대로 사용
        console.log('🚌 버스 데이터 전체 구조 확인:');
        if (response.data.length > 0) {
          console.log('🚌 첫 번째 버스 전체 데이터:', response.data[0]);
          console.log('🚌 첫 번째 버스 id 타입:', typeof response.data[0].id);
          console.log('🚌 첫 번째 버스 busNumber 타입:', typeof response.data[0].busNumber);
        }
        
        response.data.forEach((bus, index) => {
          console.log(`🚌 버스[${index}]:`, {
            id: bus.id,
            busNumber: bus.busNumber,
            'id === busNumber': bus.id === bus.busNumber,
            routeId: bus.routeId,
            routeName: bus.routeName,
            'routeId type': typeof bus.routeId,
            'routeId is undefined': bus.routeId === undefined,
            'routeId is "undefined"': bus.routeId === 'undefined'
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

  // 노선 데이터 가져오기
  const fetchRoutes = async () => {
    try {
      console.log('🛣️ === 노선 데이터 로드 시작 ===');
      
      const response = await ApiService.getAllRoutes();
      console.log('🛣️ 노선 API 최종 응답:', response);
      
      if (response && response.data && Array.isArray(response.data)) {
        console.log(`🛣️ ${response.data.length}개의 노선 데이터 수신`);
        
        // api.js에서 이미 정규화된 데이터가 오므로 그대로 사용
        response.data.forEach(route => {
          console.log(`🛣️ 노선 ${route.routeName}: id=${route.id}`);
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

  // 스케줄을 FullCalendar 이벤트로 변환하는 함수 - 개선된 버전
  const getCalendarEvents = () => {
    return schedules.map(schedule => {
      // 기본값 설정
      const driverName = schedule.driverName || '미지정';
      const busNumber = schedule.busNumber || schedule.busRealNumber || '미지정';
      
      // 노선명 처리 - 우선순위: schedule.routeName > routes 배열에서 찾기 > 버스의 routeName
      let routeName = schedule.routeName;
      if (!routeName && schedule.routeId) {
        const route = routes.find(r => String(r.id) === String(schedule.routeId));
        routeName = route?.routeName;
      }
      if (!routeName && schedule.busNumber) {
        const bus = buses.find(b => String(b.busNumber) === String(schedule.busNumber));
        routeName = bus?.routeName;
      }
      routeName = routeName || '미지정';
      
      // 시간 처리 - 문자열로 정규화
      const startTime = typeof schedule.startTime === 'string' 
        ? schedule.startTime 
        : timeObjectToString(schedule.startTime);
      const endTime = typeof schedule.endTime === 'string' 
        ? schedule.endTime 
        : timeObjectToString(schedule.endTime);
      
      // 날짜와 시간 결합
      const startDateTime = `${schedule.operationDate}T${startTime}`;
      const endDateTime = `${schedule.operationDate}T${endTime}`;
      
      // 색상 설정 - 기본 파란색 사용
      const backgroundColor = '#3498db';
      
      return {
        id: schedule.operationId || schedule.id,
        title: `🚌 ${busNumber}\n👤 ${driverName}\n🛣️ ${routeName}`,
        start: startDateTime,
        end: endDateTime,
        backgroundColor: backgroundColor,
        borderColor: backgroundColor,
        textColor: '#ffffff',
        display: 'block',
        extendedProps: {
          ...schedule,
          driverName,
          busNumber,
          routeName,
          startTime,
          endTime
        }
      };
    });
  };

  // 기사별 색상 지정
  const getDriverColor = (driverName) => {
    const colors = [
      '#3498db', '#e74c3c', '#27ae60', '#9b59b6', '#f39c12',
      '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#2ecc71'
    ];
    
    // 기사 이름을 기반으로 일관된 색상 할당
    let hash = 0;
    for (let i = 0; i < driverName.length; i++) {
      hash = driverName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (info) => {
    setModalMode('add');
    setFormData({
      id: '',
      operationId: '',
      driverId: '',
      busId: '',
      busNumber: '',
      busRealNumber: '',
      routeId: '',
      routeName: '',
      operationDate: info.dateStr,
      startTime: '08:00',
      endTime: '18:00',
      status: '스케줄 등록됨',
      isRecurring: false,
      recurringWeeks: 4
    });
    setShowModal(true);
  };

  // 이벤트 클릭 핸들러
  const handleEventClick = (info) => {
    const event = info.event;
    const extendedProps = event.extendedProps;
    
    // 드라이버와 버스 정보 보완
    const driver = drivers.find(d => String(d.id) === String(extendedProps.driverId));
    const bus = buses.find(b => String(b.busNumber) === String(extendedProps.busNumber));
    
    // 노선 정보 - 버스의 routeId 활용
    let route = null;
    let routeName = extendedProps.routeName;
    
    if (extendedProps.routeId) {
      route = routes.find(r => String(r.id) === String(extendedProps.routeId));
      if (route) {
        routeName = route.routeName;
      }
    } else if (bus && bus.routeId) {
      // 버스에서 routeId 가져오기
      route = routes.find(r => String(r.id) === String(bus.routeId));
      if (route) {
        routeName = route.routeName;
      } else if (bus.routeName) {
        routeName = bus.routeName;
      }
    }
    
    setSelectedSchedule({
      ...extendedProps,
      driverName: extendedProps.driverName || driver?.name || '미지정',
      busNumber: extendedProps.busNumber || bus?.busNumber || '미지정',
      busRealNumber: extendedProps.busRealNumber || bus?.busRealNumber || '',
      routeName: routeName || '미지정',
      routeId: extendedProps.routeId || bus?.routeId || ''
    });
    
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

  // 스케줄 추가/수정 제출 함수 - API 형식에 맞게 수정
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('📝 === 폼 제출 시작 ===');
      console.log('📝 현재 formData:', formData);
      console.log('📝 formData.busId:', formData.busId || '빈 값');
      console.log('📝 formData.busNumber:', formData.busNumber);
      console.log('📝 formData.routeId:', formData.routeId);
      console.log('📝 formData.routeName:', formData.routeName);
      
      // 필수 검증
      if (!formData.driverId) {
        alert('기사를 선택해주세요.');
        setLoading(false);
        return;
      }
      
      if (!formData.busNumber) {
        alert('버스를 선택해주세요.');
        setLoading(false);
        return;
      }

      // 선택된 정보로 추가 데이터 보완
      const selectedBus = buses.find(b => String(b.busNumber) === String(formData.busNumber));
      const selectedDriver = drivers.find(d => String(d.id) === String(formData.driverId));
      const selectedRoute = routes.find(r => String(r.id) === String(formData.routeId));
      
      // 기본 요청 데이터 구성 - API 명세에 맞게 수정
      const baseRequestData = {
        busId: formData.busId || '', // 실제 버스 ID (MongoDB ObjectId)
        busNumber: formData.busNumber || '',
        busRealNumber: formData.busRealNumber || selectedBus?.busRealNumber || selectedBus?.busNumber || '',
        driverId: String(formData.driverId),
        driverName: selectedDriver?.name || '',
        routeId: formData.routeId || '', // formData에서 가져옴
        routeName: formData.routeName || selectedBus?.routeName || '', // formData 우선, 없으면 버스의 routeName
        startTime: formData.startTime, // 문자열 형식 유지
        endTime: formData.endTime,     // 문자열 형식 유지
        status: formData.status || '스케줄 등록됨',
        recurring: false,
        recurringWeeks: 0,
        organizationId: selectedDriver?.organizationId || ''
      };

      if (modalMode === 'add') {
        console.log('📝 ➕ 운행 일정 추가 요청');
        
        if (formData.isRecurring && formData.recurringWeeks > 0) {
          // 반복 일정
          console.log('📝 🔄 반복 일정 생성 시작');
          const baseDate = new Date(formData.operationDate);
          const successCount = [];
          const failedCount = [];
          
          for (let week = 0; week < formData.recurringWeeks; week++) {
            try {
              const currentDate = new Date(baseDate);
              currentDate.setDate(baseDate.getDate() + (week * 7));
              
              const weeklyRequestData = {
                ...baseRequestData,
                operationDate: currentDate.toISOString().split('T')[0],
                recurring: true,
                recurringWeeks: formData.recurringWeeks,
                startTime: formData.startTime, // 문자열 형식 유지
                endTime: formData.endTime      // 문자열 형식 유지
              };
              
              console.log(`📝 🔄 ${week + 1}주차 요청:`, weeklyRequestData);
              const response = await ApiService.addOperationPlan(weeklyRequestData);
              console.log(`📝 ✅ ${week + 1}주차 성공:`, response);
              successCount.push(week + 1);
              
              if (week < formData.recurringWeeks - 1) {
                await new Promise(resolve => setTimeout(resolve, 200));
              }
            } catch (error) {
              console.error(`📝 ❌ ${week + 1}주차 실패:`, error);
              failedCount.push(week + 1);
            }
          }
          
          if (successCount.length === formData.recurringWeeks) {
            alert(`${formData.recurringWeeks}주 동안의 반복 스케줄이 모두 추가되었습니다!`);
          } else if (successCount.length > 0) {
            alert(`총 ${formData.recurringWeeks}주 중 ${successCount.length}주 스케줄이 추가되었습니다.\n실패: ${failedCount.join(', ')}주차`);
          } else {
            alert('반복 스케줄 추가에 실패했습니다.');
          }
        } else {
          // 단일 스케줄
          const requestData = {
            ...baseRequestData,
            operationDate: formData.operationDate,
            startTime: formData.startTime, // 문자열 형식 유지
            endTime: formData.endTime      // 문자열 형식 유지
          };
          
          console.log('📝 ➕ 단일 운행 일정 요청:', requestData);
          console.log('📝 ➕ busId 확인:', requestData.busId || '빈 값');
          console.log('📝 ➕ busNumber 확인:', requestData.busNumber);
          console.log('📝 ➕ routeId 확인:', requestData.routeId);
          const response = await ApiService.addOperationPlan(requestData);
          console.log('📝 ✅ 추가 응답:', response);
          alert(response?.message || '운행 배치가 추가되었습니다!');
        }
      } else {
        // 수정 모드 - API 명세에 맞게 수정
        const scheduleId = formData.id || selectedSchedule?.id;
        
        console.log('📝 ✏️ 수정 모드 ID 확인:', {
          scheduleId,
          formData,
          selectedSchedule
        });
        
        if (!scheduleId) {
          alert('수정할 운행 일정의 ID를 찾을 수 없습니다.');
          setLoading(false);
          return;
        }
        
        // 수정 요청 데이터 구성 - api.js의 updateOperationPlan 형식에 맞춤
        const requestData = {
          id: scheduleId,
          busId: formData.busId || '', // 실제 버스 ID (MongoDB ObjectId)
          busNumber: formData.busNumber || '',
          driverId: String(formData.driverId),
          routeId: formData.routeId || '', // formData에서 가져옴
          operationDate: formData.operationDate,
          startTime: formData.startTime, // 문자열 형식
          endTime: formData.endTime,     // 문자열 형식
          status: formData.status || '스케줄 등록됨'
        };
        
        console.log('📝 ✏️ 운행 일정 수정 요청:', requestData);
        
        try {
          // API 호출 - api.js의 updateOperationPlan 사용
          const response = await ApiService.updateOperationPlan(requestData);
          console.log('📝 ✅ 수정 응답:', response);
          alert(response?.message || '운행 배치가 수정되었습니다!');
        } catch (updateError) {
          console.error('📝 ❌ 수정 API 호출 에러:', updateError);
          console.error('📝 ❌ 에러 상세:', {
            message: updateError.message,
            stack: updateError.stack,
            response: updateError.response
          });
          throw updateError;
        }
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

  // 스케줄 삭제 - 개선된 버전
  const handleDelete = async () => {
    if (window.confirm('이 운행 배치를 삭제하시겠습니까?')) {
      setLoading(true);
      try {
        // ID 우선순위: id > operationId
        const scheduleId = selectedSchedule.id || selectedSchedule.operationId;
        console.log('삭제할 스케줄 ID:', scheduleId);
        console.log('선택된 스케줄 전체 정보:', selectedSchedule);
        
        if (!scheduleId) {
          alert('삭제할 스케줄의 ID를 찾을 수 없습니다.');
          setLoading(false);
          return;
        }
        
        const response = await ApiService.deleteOperationPlan(scheduleId);
        console.log('삭제 응답:', response);
        
        await fetchSchedulesForMonth(currentDate);
        setShowDetailModal(false);
        alert(response?.message || '운행 배치가 삭제되었습니다.');
      } catch (error) {
        console.error('스케줄 삭제 실패:', error);
        
        if (error.message.includes('404')) {
          alert('해당 운행 일정을 찾을 수 없습니다. 이미 삭제되었거나 존재하지 않는 일정입니다.');
        } else {
          alert('스케줄 삭제에 실패했습니다: ' + error.message);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  // 수정 모드로 전환 - 개선된 버전
  const handleEdit = () => {
    setModalMode('edit');
    
    // 시간 처리
    const startTime = typeof selectedSchedule.startTime === 'string' 
      ? selectedSchedule.startTime 
      : timeObjectToString(selectedSchedule.startTime);
    const endTime = typeof selectedSchedule.endTime === 'string' 
      ? selectedSchedule.endTime 
      : timeObjectToString(selectedSchedule.endTime);
    
    const editFormData = {
      id: selectedSchedule.id,
      operationId: selectedSchedule.operationId,
      driverId: selectedSchedule.driverId,
      busId: selectedSchedule.busId || '', // busId 포함
      busNumber: selectedSchedule.busNumber || '',
      busRealNumber: selectedSchedule.busRealNumber || '',
      routeId: selectedSchedule.routeId || '',
      routeName: selectedSchedule.routeName || '',
      operationDate: selectedSchedule.operationDate,
      startTime: startTime,
      endTime: endTime,
      status: selectedSchedule.status || '스케줄 등록됨',
      isRecurring: false,
      recurringWeeks: 4
    };
    
    console.log('🔧 수정 모드 전환 완료:', {
      selectedSchedule,
      editFormData
    });
    
    setFormData(editFormData);
    setShowDetailModal(false);
    setShowModal(true);
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
                operationDate: new Date().toISOString().split('T')[0],
                status: '스케줄 등록됨'
              }));
              setShowModal(true);
            }}
            disabled={loading}
          >
            + 운행 배치 추가
          </button>
          <button 
            className="btn btn-info"
            onClick={() => fetchSchedulesForMonth(currentDate)}
            disabled={loading}
          >
            🔄 새로고침
          </button>
        </div>
        <div className="schedule-stats">
          <span className="stat-item">
            📅 총 {schedules.length}개 일정
          </span>
          <span className="stat-item">
            🚌 {buses.length}대 버스
          </span>
          <span className="stat-item">
            👤 {drivers.length}명 기사
          </span>
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
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
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
            dayMaxEvents={3}
            eventDisplay="block"
            eventTextColor="#ffffff"
            eventContent={(eventInfo) => {
              const props = eventInfo.event.extendedProps;
              return {
                html: `
                  <div style="padding: 4px; font-size: 11px; overflow: hidden;">
                    <div style="font-weight: bold;">${props.busNumber || '미지정'}번</div>
                    <div>${props.driverName || '미지정'}</div>
                    <div style="font-size: 10px;">${eventInfo.timeText}</div>
                  </div>
                `
              };
            }}
          />
        )}
      </div>
      
      <div className="legend">
        <h4>📋 운행 배치 정보</h4>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#3498db' }}></div>
            <span>운행 일정</span>
          </div>
        </div>
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
              </div>
              
              <div className="form-group">
                <label htmlFor="busNumber">버스:</label>
                <select 
                  id="busNumber"
                  name="busNumber"
                  value={formData.busNumber}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                >
                  <option value="">
                    {loading ? '로딩 중...' : buses.length === 0 ? '버스 정보 없음' : '버스를 선택하세요'}
                  </option>
                  {buses.map(bus => (
                    <option key={bus.id} value={bus.busNumber}>
                      {bus.busNumber}번 ({bus.totalSeats || 0}석)
                      {bus.routeName ? ` - ${bus.routeName}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {modalMode === 'add' && (
                <div className="form-group">
                  <label htmlFor="routeId">노선:</label>
                  <select 
                    id="routeId"
                    name="routeId"
                    value={formData.routeId}
                    onChange={handleInputChange}
                    disabled={formData.routeId ? true : false}
                  >
                    <option value="">노선을 선택하세요 (선택사항)</option>
                    {routes.map(route => (
                      <option key={route.id} value={route.id}>
                        {route.routeName}
                      </option>
                    ))}
                  </select>
                  {formData.routeId && formData.routeName && (
                    <small style={{ color: '#6c757d', fontSize: '12px' }}>
                      * 선택한 버스에 노선이 지정되어 있습니다: {formData.routeName}
                    </small>
                  )}
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

              {modalMode === 'add' && (
                <div className="form-group">
                  <label>
                    <input 
                      type="checkbox"
                      name="isRecurring"
                      checked={formData.isRecurring}
                      onChange={handleInputChange}
                    />
                    &nbsp;반복 운행 일정 생성
                  </label>
                  
                  {formData.isRecurring && (
                    <div style={{ 
                      marginTop: '10px', 
                      padding: '10px', 
                      backgroundColor: '#f8f9fa', 
                      border: '1px solid #dee2e6',
                      borderRadius: '4px'
                    }}>
                      <label htmlFor="recurringWeeks">반복 주수:</label>
                      <input 
                        type="number" 
                        id="recurringWeeks"
                        name="recurringWeeks"
                        min="1"
                        max="52"
                        value={formData.recurringWeeks}
                        onChange={handleInputChange}
                        style={{ marginLeft: '10px', width: '80px' }}
                      />
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#666', 
                        marginTop: '5px' 
                      }}>
                        매주 같은 요일에 {formData.recurringWeeks}주 동안 일정이 생성됩니다.
                      </div>
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
      
      {/* 상세정보 모달 - 초기 UI 스타일 */}
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
                  <span className="detail-value">{selectedSchedule.driverName || '미지정'}</span>
                </div>
                {selectedSchedule.driverId && (
                  <div className="detail-row">
                    <span className="detail-label">기사 ID:</span>
                    <span className="detail-value" style={{ fontSize: '12px', color: '#666' }}>
                      {selectedSchedule.driverId}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="detail-section">
                <h4>🚐 버스 정보</h4>
                <div className="detail-row">
                  <span className="detail-label">버스 번호:</span>
                  <span className="detail-value">
                    {selectedSchedule.busNumber && selectedSchedule.busNumber !== '미지정' 
                      ? `${selectedSchedule.busNumber}번` 
                      : '미지정'}
                  </span>
                </div>
                {selectedSchedule.busRealNumber && (
                  <div className="detail-row">
                    <span className="detail-label">실제 번호:</span>
                    <span className="detail-value">{selectedSchedule.busRealNumber}</span>
                  </div>
                )}
                {selectedSchedule.busId && (
                  <div className="detail-row">
                    <span className="detail-label">버스 번호:</span>
                    <span className="detail-value" style={{ fontSize: '12px', color: '#666' }}>
                      {selectedSchedule.busId}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="detail-section">
                <h4>🛣️ 노선 정보</h4>
                <div className="detail-row">
                  <span className="detail-label">노선명:</span>
                  <span className="detail-value">{selectedSchedule.routeName || '미지정'}</span>
                </div>
                {selectedSchedule.routeId && (
                  <div className="detail-row">
                    <span className="detail-label">노선 ID:</span>
                    <span className="detail-value" style={{ fontSize: '12px', color: '#666' }}>
                      {selectedSchedule.routeId}
                    </span>
                  </div>
                )}
              </div>

              {/* 디버깅 정보 (개발 모드에서만 표시) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="detail-section">
                  <h4>🔍 디버깅 정보</h4>
                  <div className="detail-row">
                    <span className="detail-label">Schedule ID:</span>
                    <span className="detail-value" style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                      {selectedSchedule.id || '없음'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Operation ID:</span>
                    <span className="detail-value" style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                      {selectedSchedule.operationId || '없음'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Selected Bus:</span>
                    <span className="detail-value" style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                      busNumber: {selectedSchedule.busNumber}, busId: {selectedSchedule.busId}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Route Info:</span>
                    <span className="detail-value" style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                      routeId: {selectedSchedule.routeId || 'null'}, routeName: {selectedSchedule.routeName || 'null'}
                    </span>
                  </div>
                  <details style={{ marginTop: '10px' }}>
                    <summary style={{ cursor: 'pointer', fontSize: '12px' }}>전체 데이터 보기</summary>
                    <pre style={{ 
                      fontSize: '10px', 
                      backgroundColor: '#f8f9fa', 
                      padding: '10px', 
                      marginTop: '5px',
                      maxHeight: '200px',
                      overflow: 'auto'
                    }}>
                      {JSON.stringify(selectedSchedule, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
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
      
      <style jsx>{`
        .schedule-stats {
          display: flex;
          gap: 20px;
          align-items: center;
        }
        
        .stat-item {
          padding: 8px 16px;
          background-color: #f8f9fa;
          border-radius: 20px;
          font-size: 14px;
          color: #495057;
          border: 1px solid #dee2e6;
        }
        
        .detail-content {
          padding: 20px 0;
        }
        
        .detail-section {
          margin-bottom: 20px;
        }
        
        .detail-section h4 {
          margin-top: 0;
          margin-bottom: 15px;
          color: #495057;
          font-size: 16px;
        }
        
        .detail-row {
          margin-bottom: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .detail-label {
          color: #6c757d;
          font-size: 14px;
        }
        
        .detail-value {
          font-weight: 500;
          color: #212529;
          font-size: 14px;
        }
        
        .button-group {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }
        
        .button-group button {
          flex: 1;
        }
        
        .legend {
          margin-top: 20px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #dee2e6;
        }
        
        .legend h4 {
          margin-top: 0;
          margin-bottom: 10px;
          color: #495057;
        }
        
        .legend-items {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .legend-color {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          border: 1px solid rgba(0,0,0,0.1);
        }
        
        .fc-event {
          cursor: pointer;
          border: none !important;
          padding: 2px !important;
        }
        
        .fc-event:hover {
          opacity: 0.9;
        }
        
        .fc-daygrid-event {
          white-space: normal !important;
          align-items: normal !important;
        }
        
        .fc-daygrid-event-dot {
          display: none;
        }
        
        .fc-event-time {
          font-size: 10px;
          display: block;
        }
      `}</style>
    </div>
  );
}

export default BusSchedule;