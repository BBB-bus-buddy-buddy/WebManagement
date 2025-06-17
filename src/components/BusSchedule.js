// components/BusSchedule.js - 상세 모달 및 기사 중복 체크 수정 버전
import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import koLocale from '@fullcalendar/core/locales/ko';
import ApiService from '../services/api';
import '../styles/BusSchedule.css';

/**
 * 버스 기사 배치표 컴포넌트 - 상세 모달 및 기사 중복 체크 수정 버전
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
  const [currentViewMonth, setCurrentViewMonth] = useState(new Date().getMonth());
  const [currentViewYear, setCurrentViewYear] = useState(new Date().getFullYear());
  
  // 모달 상태
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
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

  // ✅ 시간 겹침 체크 함수
  const isTimeOverlap = (start1, end1, start2, end2) => {
    const startTime1 = new Date(`2000-01-01T${start1}`);
    const endTime1 = new Date(`2000-01-01T${end1}`);
    const startTime2 = new Date(`2000-01-01T${start2}`);
    const endTime2 = new Date(`2000-01-01T${end2}`);
    
    return startTime1 < endTime2 && endTime1 > startTime2;
  };

  // ✅ 기사 중복 시간 체크 함수
  const checkDriverConflict = (driverId, operationDate, startTime, endTime, excludeId = null) => {
    const conflicts = schedules.filter(schedule => {
      // 수정 중인 스케줄은 제외
      if (excludeId && (schedule.id === excludeId || schedule.operationId === excludeId)) {
        return false;
      }
      
      // 같은 기사, 같은 날짜인지 확인
      if (String(schedule.driverId) !== String(driverId) || schedule.operationDate !== operationDate) {
        return false;
      }
      
      // 시간 겹침 체크
      const scheduleStartTime = timeObjectToString(schedule.startTime);
      const scheduleEndTime = timeObjectToString(schedule.endTime);
      
      return isTimeOverlap(startTime, endTime, scheduleStartTime, scheduleEndTime);
    });
    
    return conflicts;
  };

  // ✅ 버스 중복 시간 체크 함수
  const checkBusConflict = (busNumber, operationDate, startTime, endTime, excludeId = null) => {
    const conflicts = schedules.filter(schedule => {
      // 수정 중인 스케줄은 제외
      if (excludeId && (schedule.id === excludeId || schedule.operationId === excludeId)) {
        return false;
      }
      
      // 같은 버스, 같은 날짜인지 확인
      if (String(schedule.busNumber) !== String(busNumber) || schedule.operationDate !== operationDate) {
        return false;
      }
      
      // 시간 겹침 체크
      const scheduleStartTime = timeObjectToString(schedule.startTime);
      const scheduleEndTime = timeObjectToString(schedule.endTime);
      
      return isTimeOverlap(startTime, endTime, scheduleStartTime, scheduleEndTime);
    });
    
    return conflicts;
  };

  // ✅ 스케줄 데이터 유효성 검증 함수
  const isValidSchedule = (schedule) => {
    // 필수 필드 검증
    if (!schedule) {
      console.log('❌ 빈 스케줄 데이터');
      return false;
    }

    // 운행 날짜 검증
    if (!schedule.operationDate || typeof schedule.operationDate !== 'string') {
      console.log('❌ 유효하지 않은 운행 날짜:', schedule.operationDate);
      return false;
    }

    // 날짜 형식 검증 (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(schedule.operationDate)) {
      console.log('❌ 잘못된 날짜 형식:', schedule.operationDate);
      return false;
    }

    // 실제 날짜인지 검증
    const date = new Date(schedule.operationDate);
    if (isNaN(date.getTime())) {
      console.log('❌ 유효하지 않은 날짜:', schedule.operationDate);
      return false;
    }

    // ID 검증 (operationId 또는 id 중 하나는 있어야 함)
    if (!schedule.operationId && !schedule.id) {
      console.log('❌ ID 없음:', schedule);
      return false;
    }

    // 기사 정보 검증 (driverId 또는 driverName 중 하나는 있어야 함)
    if (!schedule.driverId && !schedule.driverName) {
      console.log('❌ 기사 정보 없음:', schedule);
      return false;
    }

    // 버스 정보 검증 (busId, busNumber, busRealNumber 중 하나는 있어야 함)
    if (!schedule.busId && !schedule.busNumber && !schedule.busRealNumber) {
      console.log('❌ 버스 정보 없음:', schedule);
      return false;
    }

    console.log('✅ 유효한 스케줄:', {
      id: schedule.operationId || schedule.id,
      date: schedule.operationDate,
      driver: schedule.driverName || schedule.driverId,
      bus: schedule.busNumber || schedule.busRealNumber || schedule.busId
    });

    return true;
  };

  // ✅ 현재 월인지 확인하는 함수
  const isCurrentMonthDate = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return date.getFullYear() === currentViewYear && date.getMonth() === currentViewMonth;
  };

  // ✅ 개선된 캘린더 뷰 범위의 모든 월 데이터를 로드하는 함수
  const fetchSchedulesForCurrentView = async (calendarApi) => {
    try {
      console.log('📅 === 개선된 캘린더 뷰 데이터 로드 시작 ===');
      
      if (!calendarApi) {
        calendarApi = calendarRef.current?.getApi();
      }
      
      if (!calendarApi) {
        console.log('📅 ⚠️ 캘린더 API 없음, 기본 월 조회로 폴백');
        await fetchSchedulesForMonth(currentDate);
        return;
      }
      
      const view = calendarApi.view;
      const start = new Date(view.activeStart);
      const end = new Date(view.activeEnd);
      
      console.log('📅 📍 캘린더 뷰 정보:', {
        viewType: view.type,
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
        currentDate: calendarApi.getDate()
      });
      
      // 뷰에 포함된 모든 월 계산
      const monthsInView = [];
      const current = new Date(start.getFullYear(), start.getMonth(), 1);
      const lastMonth = new Date(end.getFullYear(), end.getMonth(), 1);
      
      while (current <= lastMonth) {
        monthsInView.push(new Date(current));
        current.setMonth(current.getMonth() + 1);
      }
      
      console.log('📅 📋 로드할 월들:', monthsInView.map(date => 
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      ));
      
      // 모든 월의 데이터 조회
      const allSchedules = [];
      
      for (const monthDate of monthsInView) {
        try {
          const yearMonth = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
          console.log(`📅 🔍 ${yearMonth} 조회 중...`);
          
          const response = await ApiService.getCachedMonthlyOperationPlans(yearMonth);
          
          if (response && response.data && Array.isArray(response.data)) {
            // ✅ 유효한 스케줄만 필터링
            const validSchedules = response.data.filter(schedule => {
              const isValid = isValidSchedule(schedule);
              if (!isValid) {
                console.log('❌ 무효한 스케줄 제외:', schedule);
              }
              return isValid;
            });

            const monthSchedules = validSchedules.map(schedule => {
              const normalized = {
                ...schedule,
                startTime: timeObjectToString(schedule.startTime),
                endTime: timeObjectToString(schedule.endTime)
              };
              
              return normalized;
            });
            
            allSchedules.push(...monthSchedules);
            console.log(`📅 ✅ ${yearMonth}: ${monthSchedules.length}개 유효한 일정 추가 (전체 ${response.data.length}개 중)`);
          } else {
            console.log(`📅 ❌ ${yearMonth}: 데이터 없음 또는 빈 응답`);
          }
          
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`📅 ❌ ${monthDate.getFullYear()}-${monthDate.getMonth() + 1} 로드 실패:`, error);
          
          try {
            console.log(`📅 🔄 ${monthDate.getFullYear()}-${monthDate.getMonth() + 1} 대안 방식 시도`);
            const yearMonth = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
            const fallbackResponse = await fetchSchedulesForMonthFallback(yearMonth);
            if (fallbackResponse && fallbackResponse.length > 0) {
              allSchedules.push(...fallbackResponse);
              console.log(`📅 ✅ ${yearMonth} 대안 방식 성공: ${fallbackResponse.length}개`);
            }
          } catch (fallbackError) {
            console.error(`📅 ❌ ${monthDate.getFullYear()}-${monthDate.getMonth() + 1} 대안 방식도 실패:`, fallbackError);
          }
        }
      }
      
      // 중복 제거 및 재검증
      const uniqueSchedules = allSchedules.filter((schedule, index, self) => {
        const id = schedule.id || schedule.operationId;
        const isDuplicate = index !== self.findIndex(s => (s.id || s.operationId) === id);
        
        if (isDuplicate) {
          console.log('🔄 중복 스케줄 제거:', id);
          return false;
        }
        
        // 재검증
        return isValidSchedule(schedule);
      });
      
      console.log(`📅 📊 최종 결과: ${uniqueSchedules.length}개 유효한 일정`);
      
      setSchedules(uniqueSchedules);
      
      console.log('📅 ✅ 개선된 캘린더 뷰 전체 일정 로드 완료');
    } catch (error) {
      console.error('📅 ❌ 캘린더 뷰 데이터 로드 실패:', error);
      await fetchSchedulesForMonth(currentDate);
    }
  };

  // 월별 데이터 조회 폴백 함수
  const fetchSchedulesForMonthFallback = async (yearMonth) => {
    try {
      console.log(`📅 🔄 ${yearMonth} 폴백 방식 시도`);
      
      const [year, month] = yearMonth.split('-').map(Number);
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
      
      try {
        const rangeResponse = await ApiService.getOperationPlansByDateRange(startDate, endDate);
        if (rangeResponse && rangeResponse.data && rangeResponse.data.length > 0) {
          // ✅ 유효한 스케줄만 필터링
          const validSchedules = rangeResponse.data.filter(isValidSchedule);
          
          console.log(`📅 ✅ ${yearMonth} 날짜 범위 조회 성공: ${validSchedules.length}개 유효한 일정 (전체 ${rangeResponse.data.length}개 중)`);
          return validSchedules.map(schedule => ({
            ...schedule,
            startTime: timeObjectToString(schedule.startTime),
            endTime: timeObjectToString(schedule.endTime)
          }));
        }
      } catch (rangeError) {
        console.log(`📅 ❌ ${yearMonth} 날짜 범위 조회 실패:`, rangeError.message);
      }
      
      try {
        console.log(`📅 🔄 ${yearMonth} 전체 조회 후 필터링 시도`);
        const allResponse = await ApiService.getAllOperationPlans();
        if (allResponse && allResponse.data && Array.isArray(allResponse.data)) {
          const filteredData = allResponse.data.filter(plan => {
            if (plan.operationDate) {
              const planYearMonth = plan.operationDate.substring(0, 7);
              return planYearMonth === yearMonth && isValidSchedule(plan);
            }
            return false;
          });
          
          if (filteredData.length > 0) {
            console.log(`📅 ✅ ${yearMonth} 전체 조회 필터링 성공: ${filteredData.length}개`);
            return filteredData.map(schedule => ({
              ...schedule,
              startTime: timeObjectToString(schedule.startTime),
              endTime: timeObjectToString(schedule.endTime)
            }));
          }
        }
      } catch (allError) {
        console.log(`📅 ❌ ${yearMonth} 전체 조회 실패:`, allError.message);
      }
      
      console.log(`📅 ❌ ${yearMonth} 모든 폴백 방식 실패`);
      return [];
    } catch (error) {
      console.error(`📅 ❌ ${yearMonth} 폴백 함수 오류:`, error);
      return [];
    }
  };

  // 영향받는 모든 월의 데이터를 새로고침하는 함수
  const refreshAffectedMonths = async (startDate, endDate) => {
    try {
      console.log('📅 === 영향받는 월 데이터 새로고침 시작 ===');
      
      ApiService.clearOperationPlanCache();
      console.log('📅 🧹 캐시 초기화 완료');
      
      console.log('📅 ⏳ DB 반영 대기 중... (2초)');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const calendarApi = calendarRef.current?.getApi();
      await fetchSchedulesForCurrentView(calendarApi);
      
      console.log('📅 ✅ 모든 영향받는 월 새로고침 완료');
    } catch (error) {
      console.error('📅 ❌ 영향받는 월 새로고침 실패:', error);
      await fetchSchedulesForCurrentView();
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadInitialData();
  }, []);

  // 버스 선택 시 노선 자동 선택 및 버스 번호 설정
  useEffect(() => {
    if (formData.busNumber) {
      const selectedBus = buses.find(bus => String(bus.busNumber) === String(formData.busNumber));
      
      if (selectedBus) {
        const newFormData = {
          busId: selectedBus.id || '',
          busRealNumber: selectedBus.busRealNumber || selectedBus.busNumber || ''
        };
        
        if (selectedBus.routeName) {
          newFormData.routeName = selectedBus.routeName;
          
          if (selectedBus.routeId && selectedBus.routeId !== 'undefined') {
            newFormData.routeId = String(selectedBus.routeId);
          } else {
            const matchingRoute = routes.find(route => 
              route.routeName === selectedBus.routeName
            );
            if (matchingRoute) {
              newFormData.routeId = String(matchingRoute.id);
            } else {
              newFormData.routeId = '';
            }
          }
        } else if (selectedBus.routeId && selectedBus.routeId !== 'undefined') {
          newFormData.routeId = String(selectedBus.routeId);
          
          const matchingRoute = routes.find(route => 
            String(route.id) === String(selectedBus.routeId)
          );
          if (matchingRoute) {
            newFormData.routeName = matchingRoute.routeName || '';
          } else {
            newFormData.routeName = '';
          }
        } else {
          newFormData.routeId = '';
          newFormData.routeName = '';
        }
        
        setFormData(prev => ({
          ...prev,
          ...newFormData
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          busId: '',
          busRealNumber: '',
          routeId: '',
          routeName: ''
        }));
      }
    }
  }, [formData.busNumber, buses, routes]);

  // 초기 데이터 로드
  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('=== 초기 데이터 로드 시작 ===');
      
      const results = await Promise.allSettled([
        fetchDrivers(),
        fetchBuses(),
        fetchRoutes()
      ]);
      
      results.forEach((result, index) => {
        const apiNames = ['기사', '버스', '노선'];
        if (result.status === 'rejected') {
          console.error(`${apiNames[index]} 로드 실패:`, result.reason);
        } else {
          console.log(`${apiNames[index]} 로드 성공`);
        }
      });
      
      setTimeout(() => {
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) {
          const view = calendarApi.view;
          if (view) {
            const viewStart = new Date(view.activeStart);
            const viewEnd = new Date(view.activeEnd);
            
            if (view.type === 'dayGridMonth') {
              const middleTime = (viewStart.getTime() + viewEnd.getTime()) / 2;
              const middleDate = new Date(middleTime);
              const viewMonth = middleDate.getMonth();
              const viewYear = middleDate.getFullYear();
              const currentViewDate = new Date(viewYear, viewMonth, 15);
              setCurrentDate(currentViewDate);
              setCurrentViewMonth(viewMonth);
              setCurrentViewYear(viewYear);
            } else {
              setCurrentDate(viewStart);
              setCurrentViewMonth(viewStart.getMonth());
              setCurrentViewYear(viewStart.getFullYear());
            }
          }
          
          fetchSchedulesForCurrentView(calendarApi);
        } else {
          const today = new Date();
          setCurrentDate(today);
          setCurrentViewMonth(today.getMonth());
          setCurrentViewYear(today.getFullYear());
          fetchSchedulesForMonth(today);
        }
      }, 300);
      
      console.log('=== 초기 데이터 로드 완료 ===');
    } catch (error) {
      console.error('초기 데이터 로드 실패:', error);
      setError('데이터를 불러오는데 실패했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 월별 스케줄 데이터 가져오기 (단일 월용)
  const fetchSchedulesForMonth = async (date) => {
    try {
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      console.log('월별 스케줄 조회 요청:', yearMonth);
      
      const response = await ApiService.getCachedMonthlyOperationPlans(yearMonth);
      console.log('월별 스케줄 API 응답:', response);
      
      if (response && response.data && Array.isArray(response.data)) {
        // ✅ 유효한 스케줄만 필터링
        const validSchedules = response.data.filter(isValidSchedule);
        
        const normalizedSchedules = validSchedules.map(schedule => {
          let enrichedBusInfo = {};
          
          if (schedule.busNumber) {
            const matchingBus = buses.find(bus => String(bus.busNumber) === String(schedule.busNumber));
            if (matchingBus) {
              enrichedBusInfo = {
                busId: matchingBus.id,
                busRealNumber: matchingBus.busRealNumber || matchingBus.busNumber,
                routeName: schedule.routeName || matchingBus.routeName,
                routeId: schedule.routeId || matchingBus.routeId
              };
            }
          }
          
          return {
            ...schedule,
            ...enrichedBusInfo,
            startTime: timeObjectToString(schedule.startTime),
            endTime: timeObjectToString(schedule.endTime)
          };
        });
        
        console.log(`월별 스케줄 결과: ${normalizedSchedules.length}개 유효한 일정 (전체 ${response.data.length}개 중)`);
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
      const response = await ApiService.getAllBuses();
      
      if (response && response.data && Array.isArray(response.data)) {
        setBuses(response.data);
      } else {
        setBuses([]);
      }
    } catch (error) {
      console.error('버스 조회 실패:', error);
      setBuses([]);
    }
  };

  // 노선 데이터 가져오기
  const fetchRoutes = async () => {
    try {
      const response = await ApiService.getAllRoutes();
      
      if (response && response.data && Array.isArray(response.data)) {
        setRoutes(response.data);
      } else {
        setRoutes([]);
      }
    } catch (error) {
      console.error('노선 조회 실패:', error);
      setRoutes([]);
    }
  };

  // ✅ 개선된 스케줄을 FullCalendar 이벤트로 변환하는 함수 - 빈 박스 방지
  const getCalendarEvents = () => {
    console.log('🎨 === 개선된 캘린더 이벤트 생성 시작 (빈 박스 방지) ===');
    console.log('🎨 📊 전체 스케줄 수:', schedules.length);
    console.log('🎨 📍 현재 보고 있는 월:', `${currentViewYear}-${String(currentViewMonth + 1).padStart(2, '0')}`);
    
    if (schedules.length === 0) {
      console.log('🎨 ⚠️ 스케줄 데이터가 없음');
      return [];
    }
    
    const events = schedules
      .filter(schedule => {
        // ✅ 다시 한번 유효성 검증
        const isValid = isValidSchedule(schedule);
        if (!isValid) {
          console.log('🎨 ❌ 이벤트 생성 시 무효한 스케줄 제외:', schedule);
        }
        return isValid;
      })
      .map((schedule, index) => {
        // ✅ 안전한 데이터 추출
        const driverName = schedule.driverName || 
                          (schedule.driverId && drivers.find(d => String(d.id) === String(schedule.driverId))?.name) || 
                          '미지정';
        
        const busNumber = schedule.busNumber || schedule.busRealNumber || '미지정';
        
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
        
        const startTime = typeof schedule.startTime === 'string' 
          ? schedule.startTime 
          : timeObjectToString(schedule.startTime);
        const endTime = typeof schedule.endTime === 'string' 
          ? schedule.endTime 
          : timeObjectToString(schedule.endTime);
        
        // ✅ 시간 검증
        if (!startTime || !endTime || startTime === '00:00' || endTime === '00:00') {
          console.log('🎨 ⚠️ 유효하지 않은 시간 정보:', { startTime, endTime, schedule });
        }
        
        const startDateTime = `${schedule.operationDate}T${startTime}`;
        const endDateTime = `${schedule.operationDate}T${endTime}`;
        
        // ✅ 현재 월 여부에 따라 색상과 투명도 조정
        const isCurrentMonth = isCurrentMonthDate(schedule.operationDate);
        const backgroundColor = isCurrentMonth ? '#3498db' : '#bdc3c7';
        const borderColor = isCurrentMonth ? '#2980b9' : '#95a5a6';
        const textColor = isCurrentMonth ? '#ffffff' : '#7f8c8d';
        
        // ✅ 제목 검증 - 빈 제목 방지
        const title = `🚌 ${busNumber}\n👤 ${driverName}\n🛣️ ${routeName}`;
        
        if (!title || title.trim() === '🚌 \n👤 \n🛣️ ') {
          console.log('🎨 ❌ 빈 제목 생성됨, 스케줄 제외:', schedule);
          return null; // 빈 이벤트 방지
        }
        
        const event = {
          id: schedule.operationId || schedule.id,
          title: title,
          start: startDateTime,
          end: endDateTime,
          backgroundColor: backgroundColor,
          borderColor: borderColor,
          textColor: textColor,
          display: 'block',
          classNames: isCurrentMonth ? ['current-month-event'] : ['other-month-event'],
          extendedProps: {
            ...schedule,
            driverName,
            busNumber,
            routeName,
            startTime,
            endTime,
            isCurrentMonth
          }
        };
        
        console.log(`🎨 📝 이벤트[${index}]:`, {
          id: event.id,
          title: event.title.replace(/\n/g, ' | '),
          start: event.start,
          date: schedule.operationDate,
          isCurrentMonth: isCurrentMonth,
          backgroundColor: backgroundColor
        });
        
        return event;
      })
      .filter(event => event !== null); // ✅ null 이벤트 제거
    
    console.log('🎨 ✅ 개선된 캘린더 이벤트 생성 완료:', events.length, '개');
    
    // 현재 월과 다른 월 이벤트 개수 출력
    const currentMonthEvents = events.filter(e => e.extendedProps.isCurrentMonth);
    const otherMonthEvents = events.filter(e => !e.extendedProps.isCurrentMonth);
    console.log(`🎨 📊 현재 월 이벤트: ${currentMonthEvents.length}개, 다른 월 이벤트: ${otherMonthEvents.length}개`);
    
    return events;
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (info) => {
    const clickedDate = new Date(info.date);
    const clickedMonth = new Date(clickedDate.getFullYear(), clickedDate.getMonth(), 15);
    setCurrentDate(clickedMonth);
    
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

  // ✅ 개선된 이벤트 클릭 핸들러 - 상세 정보 표시
  const handleEventClick = (info) => {
    const event = info.event;
    const extendedProps = event.extendedProps;
    
    console.log('📋 이벤트 클릭됨:', extendedProps);
    
    const driver = drivers.find(d => String(d.id) === String(extendedProps.driverId));
    const bus = buses.find(b => String(b.busNumber) === String(extendedProps.busNumber));
    
    let route = null;
    let routeName = extendedProps.routeName;
    
    if (extendedProps.routeId) {
      route = routes.find(r => String(r.id) === String(extendedProps.routeId));
      if (route) {
        routeName = route.routeName;
      }
    } else if (bus && bus.routeId) {
      route = routes.find(r => String(r.id) === String(bus.routeId));
      if (route) {
        routeName = route.routeName;
      } else if (bus.routeName) {
        routeName = bus.routeName;
      }
    }
    
    const scheduleDetail = {
      ...extendedProps,
      driverName: extendedProps.driverName || driver?.name || '미지정',
      busNumber: extendedProps.busNumber || bus?.busNumber || '미지정',
      busRealNumber: extendedProps.busRealNumber || bus?.busRealNumber || '',
      routeName: routeName || '미지정',
      routeId: extendedProps.routeId || bus?.routeId || ''
    };
    
    console.log('📋 상세 정보 설정:', scheduleDetail);
    
    setSelectedSchedule(scheduleDetail);
    setCurrentEditingEvent(event);
    setShowDetailModal(true);
  };

  // ✅ 개선된 캘린더 날짜 변경 핸들러 - 현재 월 추적
  const handleDatesSet = (dateInfo) => {
    console.log('📅 🔥 handleDatesSet 호출됨 (빈 박스 방지 버전):', {
      start: dateInfo.start,
      end: dateInfo.end,
      view: dateInfo.view.type,
      viewTitle: dateInfo.view.title
    });
    
    const viewStart = new Date(dateInfo.start);
    const viewEnd = new Date(dateInfo.end);
    
    if (dateInfo.view.type === 'dayGridMonth') {
      const middleTime = (viewStart.getTime() + viewEnd.getTime()) / 2;
      const middleDate = new Date(middleTime);
      const viewMonth = middleDate.getMonth();
      const viewYear = middleDate.getFullYear();
      const currentViewDate = new Date(viewYear, viewMonth, 15);
      
      console.log('📅 현재 보고 있는 월 업데이트:', `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`);
      setCurrentDate(currentViewDate);
      setCurrentViewMonth(viewMonth);
      setCurrentViewYear(viewYear);
    } else {
      setCurrentDate(viewStart);
      setCurrentViewMonth(viewStart.getMonth());
      setCurrentViewYear(viewStart.getFullYear());
    }
    
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      setTimeout(() => {
        fetchSchedulesForCurrentView(calendarApi);
      }, 150);
    }
  };

  // 폼 입력 핸들러
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // ✅ 개선된 스케줄 추가/수정 제출 함수 - 중복 체크 강화
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('📝 === 폼 제출 시작 ===');
      
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

      // ✅ 기사 중복 시간 체크
      const excludeId = modalMode === 'edit' ? (formData.id || selectedSchedule?.id) : null;
      const driverConflicts = checkDriverConflict(
        formData.driverId, 
        formData.operationDate, 
        formData.startTime, 
        formData.endTime, 
        excludeId
      );

      if (driverConflicts.length > 0) {
        const conflictInfo = driverConflicts.map(conflict => {
          const driverName = conflict.driverName || drivers.find(d => String(d.id) === String(conflict.driverId))?.name || '미지정';
          return `${conflict.operationDate} ${timeObjectToString(conflict.startTime)}-${timeObjectToString(conflict.endTime)} (${driverName})`;
        }).join('\n');
        
        alert(`❌ 기사 중복 시간 충돌이 발견되었습니다!\n\n선택한 기사가 이미 다음 시간에 배정되어 있습니다:\n\n${conflictInfo}\n\n다른 시간이나 다른 기사를 선택해주세요.`);
        setLoading(false);
        return;
      }

      // ✅ 버스 중복 시간 체크
      const busConflicts = checkBusConflict(
        formData.busNumber, 
        formData.operationDate, 
        formData.startTime, 
        formData.endTime, 
        excludeId
      );

      if (busConflicts.length > 0) {
        const conflictInfo = busConflicts.map(conflict => {
          const driverName = conflict.driverName || drivers.find(d => String(d.id) === String(conflict.driverId))?.name || '미지정';
          return `${conflict.operationDate} ${timeObjectToString(conflict.startTime)}-${timeObjectToString(conflict.endTime)} (${driverName})`;
        }).join('\n');
        
        alert(`❌ 버스 중복 시간 충돌이 발견되었습니다!\n\n선택한 버스가 이미 다음 시간에 사용되고 있습니다:\n\n${conflictInfo}\n\n다른 시간이나 다른 버스를 선택해주세요.`);
        setLoading(false);
        return;
      }

      const selectedBus = buses.find(b => String(b.busNumber) === String(formData.busNumber));
      const selectedDriver = drivers.find(d => String(d.id) === String(formData.driverId));
      
      const baseRequestData = {
        busId: formData.busId || '',
        busNumber: formData.busNumber || '',
        busRealNumber: formData.busRealNumber || selectedBus?.busRealNumber || selectedBus?.busNumber || '',
        driverId: String(formData.driverId),
        driverName: selectedDriver?.name || '',
        routeId: formData.routeId || '',
        routeName: formData.routeName || selectedBus?.routeName || '',
        startTime: formData.startTime,
        endTime: formData.endTime,
        status: formData.status || '스케줄 등록됨',
        recurring: false,
        recurringWeeks: 0,
        organizationId: selectedDriver?.organizationId || ''
      };

      if (modalMode === 'add') {
        if (formData.isRecurring && formData.recurringWeeks > 0) {
          const baseDate = new Date(formData.operationDate);
          const successCount = [];
          
          let firstDate = null;
          let lastDate = null;
          
          for (let week = 0; week < formData.recurringWeeks; week++) {
            try {
              const currentDate = new Date(baseDate);
              currentDate.setTime(baseDate.getTime() + (week * 7 * 24 * 60 * 60 * 1000));
              
              if (firstDate === null) firstDate = new Date(currentDate);
              lastDate = new Date(currentDate);
              
              // ✅ 반복 스케줄도 중복 체크
              const currentDateStr = currentDate.toISOString().split('T')[0];
              const weeklyDriverConflicts = checkDriverConflict(
                formData.driverId, 
                currentDateStr, 
                formData.startTime, 
                formData.endTime
              );
              
              const weeklyBusConflicts = checkBusConflict(
                formData.busNumber, 
                currentDateStr, 
                formData.startTime, 
                formData.endTime
              );
              
              if (weeklyDriverConflicts.length > 0 || weeklyBusConflicts.length > 0) {
                console.log(`📝 ⚠️ ${week + 1}주차 (${currentDateStr}) 중복으로 건너뜀`);
                continue;
              }
              
              const weeklyRequestData = {
                ...baseRequestData,
                operationDate: currentDateStr,
                recurring: true,
                recurringWeeks: formData.recurringWeeks,
                startTime: formData.startTime,
                endTime: formData.endTime
              };
              
              const response = await ApiService.addOperationPlan(weeklyRequestData);
              successCount.push(week + 1);
              
              if (week < formData.recurringWeeks - 1) {
                await new Promise(resolve => setTimeout(resolve, 200));
              }
            } catch (error) {
              console.error(`📝 ❌ ${week + 1}주차 실패:`, error);
            }
          }
          
          if (successCount.length > 0 && firstDate && lastDate) {
            await refreshAffectedMonths(firstDate, lastDate);
          }
          
          if (successCount.length === formData.recurringWeeks) {
            alert(`✅ ${formData.recurringWeeks}주 동안의 반복 스케줄이 모두 추가되었습니다!`);
          } else if (successCount.length > 0) {
            alert(`⚠️ 총 ${formData.recurringWeeks}주 중 ${successCount.length}주 스케줄이 추가되었습니다.\n(중복 시간은 자동으로 건너뛰었습니다)`);
          } else {
            alert('❌ 반복 스케줄 추가에 실패했습니다.');
          }
        } else {
          const requestData = {
            ...baseRequestData,
            operationDate: formData.operationDate,
            startTime: formData.startTime,
            endTime: formData.endTime
          };
          
          const response = await ApiService.addOperationPlan(requestData);
          alert(response?.message || '✅ 운행 배치가 추가되었습니다!');
          
          const singleDate = new Date(formData.operationDate);
          await refreshAffectedMonths(singleDate, singleDate);
        }
      } else {
        const scheduleId = formData.id || selectedSchedule?.id;
        
        if (!scheduleId) {
          alert('수정할 운행 일정의 ID를 찾을 수 없습니다.');
          setLoading(false);
          return;
        }
        
        const requestData = {
          id: scheduleId,
          busId: formData.busId || '',
          busNumber: formData.busNumber || '',
          driverId: String(formData.driverId),
          routeId: formData.routeId || '',
          operationDate: formData.operationDate,
          startTime: formData.startTime,
          endTime: formData.endTime,
          status: formData.status || '스케줄 등록됨'
        };
        
        const response = await ApiService.updateOperationPlan(requestData);
        alert(response?.message || '✅ 운행 배치가 수정되었습니다!');
        
        const updateDate = new Date(formData.operationDate);
        await refreshAffectedMonths(updateDate, updateDate);
      }
      
      setShowModal(false);
      resetFormData();
      
      console.log('📝 ✅ 폼 제출 완료');
    } catch (error) {
      console.error('📝 ❌ 폼 제출 실패:', error);
      alert('❌ 스케줄 저장에 실패했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 스케줄 삭제
  const handleDelete = async () => {
    if (window.confirm('이 운행 배치를 삭제하시겠습니까?')) {
      setLoading(true);
      try {
        const scheduleId = selectedSchedule.id || selectedSchedule.operationId;
        
        if (!scheduleId) {
          alert('삭제할 스케줄의 ID를 찾을 수 없습니다.');
          setLoading(false);
          return;
        }
        
        const response = await ApiService.deleteOperationPlan(scheduleId);
        
        const deleteDate = new Date(selectedSchedule.operationDate);
        await refreshAffectedMonths(deleteDate, deleteDate);
        
        setShowDetailModal(false);
        alert(response?.message || '✅ 운행 배치가 삭제되었습니다.');
      } catch (error) {
        console.error('스케줄 삭제 실패:', error);
        
        if (error.message.includes('404')) {
          alert('해당 운행 일정을 찾을 수 없습니다.');
        } else {
          alert('❌ 스케줄 삭제에 실패했습니다: ' + error.message);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  // 수정 모드로 전환
  const handleEdit = () => {
    setModalMode('edit');
    
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
      busId: selectedSchedule.busId || '',
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
    
    setFormData(editFormData);
    setShowDetailModal(false);
    setShowModal(true);
  };

  // 현재 월의 일정 개수 계산
  const getCurrentMonthScheduleCount = () => {
    const currentMonthStr = `${currentViewYear}-${String(currentViewMonth + 1).padStart(2, '0')}`;
    return schedules.filter(schedule => 
      schedule.operationDate && schedule.operationDate.startsWith(currentMonthStr)
    ).length;
  };

  return (
    <div className="bus-schedule">
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
            onClick={async () => {
              setLoading(true);
              try {
                ApiService.clearOperationPlanCache();
                setSchedules([]);
                await new Promise(resolve => setTimeout(resolve, 500));
                const calendarApi = calendarRef.current?.getApi();
                await fetchSchedulesForCurrentView(calendarApi);
                alert('데이터를 새로고침했습니다!');
              } catch (error) {
                alert('새로고침에 실패했습니다: ' + error.message);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            🔄 새로고침
          </button>
        </div>
        <div className="schedule-stats">
          <span className="stat-item">
            📅 전체 {schedules.length}개 일정
          </span>
          <span className="stat-item current-month-stat">
            🎯 현재 월 {getCurrentMonthScheduleCount()}개
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
              right: 'dayGridMonth,dayGridWeek,timeGridDay'
            }}
            fixedWeekCount={false}
            showNonCurrentDates={true}
            dayMaxEvents={false}
            
            allDaySlot={false}
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            slotDuration="01:00:00"
            slotLabelInterval="02:00:00"
            
            views={{
              dayGridMonth: {
                dayMaxEvents: 3
              },
              dayGridWeek: {
                dayMaxEvents: false,
                eventDisplay: 'block'
              },
              timeGridDay: {
                dayMaxEvents: false,
                allDaySlot: false,
                slotMinTime: "06:00:00",
                slotMaxTime: "22:00:00"
              }
            }}
            
            events={getCalendarEvents()}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            datesSet={handleDatesSet}
            height="auto"
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }}
            eventDisplay="block"
            eventTextColor="#ffffff"
            
            dayCellClassNames={(dateInfo) => {
              const cellDate = new Date(dateInfo.date);
              const isCurrentMonthDate = cellDate.getMonth() === currentViewMonth && cellDate.getFullYear() === currentViewYear;
              return isCurrentMonthDate ? ['current-month-cell'] : ['other-month-cell'];
            }}
            
            // ✅ 개선된 eventContent - 빈 박스 방지
            eventContent={(eventInfo) => {
              const props = eventInfo.event.extendedProps;
              const isCurrentMonth = props.isCurrentMonth;
              const view = calendarRef.current?.getApi()?.view;
              const currentView = view?.type || 'dayGridMonth';
              
              // ✅ 빈 데이터 체크
              if (!props.busNumber || props.busNumber === '미지정' || 
                  !props.driverName || props.driverName === '미지정') {
                console.log('⚠️ 빈 이벤트 데이터 감지:', props);
              }
              
              const showTime = currentView !== 'dayGridWeek';
              
              return {
                html: `
                  <div style="padding: 4px; font-size: 11px; overflow: hidden; opacity: ${isCurrentMonth ? '1' : '0.6'};">
                    <div style="font-weight: bold; margin-bottom: 2px;">${props.busNumber || '미지정'}번</div>
                    <div style="margin-bottom: 1px;">${props.driverName || '미지정'}</div>
                    ${currentView === 'timeGridDay' ? 
                      `<div style="font-size: 10px; color: ${isCurrentMonth ? '#ecf0f1' : '#95a5a6'};">${props.routeName || '미지정'}</div>` : 
                      showTime ? `<div style="font-size: 10px;">${eventInfo.timeText}</div>` : ''
                    }
                  </div>
                `
              };
            }}
          />
        )}
      </div>
      
      <div className="legend">
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color current-month" style={{ backgroundColor: '#3498db' }}></div>
            <span>현재 월 운행 일정</span>
          </div>
          <div className="legend-item">
            <div className="legend-color other-month" style={{ backgroundColor: '#bdc3c7' }}></div>
            <span>다른 월 운행 일정</span>
          </div>
        </div>
      </div>
      
      {/* ✅ 스케줄 추가/수정 모달 */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalMode === 'add' ? '운행 배치 추가' : '운행 배치 수정'}</h3>
              <button type="button" className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>운행 날짜 *</label>
                <input
                  type="date"
                  name="operationDate"
                  value={formData.operationDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>시작 시간 *</label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>종료 시간 *</label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>기사 선택 *</label>
                <select
                  name="driverId"
                  value={formData.driverId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">기사를 선택하세요</option>
                  {drivers.map(driver => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} - {driver.licenseNumber || '면허번호 미등록'}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>버스 선택 *</label>
                <select
                  name="busNumber"
                  value={formData.busNumber}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">버스를 선택하세요</option>
                  {buses.map(bus => (
                    <option key={bus.id} value={bus.busNumber}>
                      {bus.busNumber}번 - {bus.busRealNumber || bus.busNumber} 
                      {bus.routeName && ` (${bus.routeName})`}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>노선</label>
                <input
                  type="text"
                  name="routeName"
                  value={formData.routeName}
                  onChange={handleInputChange}
                  placeholder="노선명 (버스 선택 시 자동 입력)"
                  readOnly
                />
              </div>
              
              <div className="form-group">
                <label>상태</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="스케줄 등록됨">스케줄 등록됨</option>
                  <option value="운행 중">운행 중</option>
                  <option value="운행 완료">운행 완료</option>
                  <option value="운행 취소">운행 취소</option>
                </select>
              </div>
              
              {modalMode === 'add' && (
                <>
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        name="isRecurring"
                        checked={formData.isRecurring}
                        onChange={handleInputChange}
                      />
                      반복 스케줄로 등록
                    </label>
                  </div>
                  
                  {formData.isRecurring && (
                    <div className="form-group">
                      <label>반복 주수</label>
                      <select
                        name="recurringWeeks"
                        value={formData.recurringWeeks}
                        onChange={handleInputChange}
                      >
                        <option value={1}>1주</option>
                        <option value={2}>2주</option>
                        <option value={3}>3주</option>
                        <option value={4}>4주</option>
                        <option value={8}>8주</option>
                        <option value={12}>12주</option>
                      </select>
                    </div>
                  )}
                </>
              )}
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  취소
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? '처리 중...' : (modalMode === 'add' ? '추가' : '수정')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* ✅ 상세 정보 모달 - 수정된 버전 */}
      {showDetailModal && selectedSchedule && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🚌 운행 배치 상세 정보</h3>
              <button type="button" className="close-btn" onClick={() => setShowDetailModal(false)}>×</button>
            </div>
            
            <div className="detail-content">
              <div className="detail-section">
                <h4>📅 운행 정보</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">운행 날짜:</span>
                    <span className="value">{selectedSchedule.operationDate}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">운행 시간:</span>
                    <span className="value">
                      {timeObjectToString(selectedSchedule.startTime)} - {timeObjectToString(selectedSchedule.endTime)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h4>👤 기사 정보</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">기사명:</span>
                    <span className="value">{selectedSchedule.driverName || '미지정'}</span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h4>🚌 버스 정보</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">버스 번호:</span>
                    <span className="value">{selectedSchedule.busNumber || '미지정'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">실제 번호:</span>
                    <span className="value">{selectedSchedule.busRealNumber || '미지정'}</span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h4>🛣️ 노선 정보</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">노선명:</span>
                    <span className="value">{selectedSchedule.routeName || '미지정'}</span>
                  </div>
                </div>
              </div>
              
            </div>
            
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
                닫기
              </button>
              <button type="button" className="btn btn-warning" onClick={handleEdit}>
                ✏️ 수정
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={loading}>
                {loading ? '삭제 중...' : '🗑️ 삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        /* 기본 스타일 */
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
        
        .current-month-stat {
          background-color: #e3f2fd;
          border-color: #2196f3;
          color: #1976d2;
          font-weight: 600;
        }
        
        .legend {
          margin-top: 20px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #dee2e6;
        }
        
        .legend-items {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 10px;
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
        
        /* 모달 스타일 */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 0;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        
        .detail-modal {
          max-width: 700px;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e9ecef;
          background-color: #f8f9fa;
          border-radius: 12px 12px 0 0;
        }
        
        .modal-header h3 {
          margin: 0;
          color: #2c3e50;
          font-size: 1.25rem;
          font-weight: 600;
        }
        
        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6c757d;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s ease;
        }
        
        .close-btn:hover {
          background-color: #e9ecef;
          color: #495057;
        }
        
        /* 폼 스타일 */
        form {
          padding: 24px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        
        label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #495057;
          font-size: 14px;
        }
        
        input, select, textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ced4da;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s ease;
          box-sizing: border-box;
        }
        
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: #3498db;
          box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
        }
        
        input[type="checkbox"] {
          width: auto;
          margin-right: 8px;
        }
        
        /* 상세 모달 스타일 */
        .detail-content {
          padding: 24px;
        }
        
        .detail-section {
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e9ecef;
        }
        
        .detail-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }
        
        .detail-section h4 {
          margin: 0 0 16px 0;
          color: #2c3e50;
          font-size: 1.1rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        
        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .detail-item .label {
          font-size: 12px;
          font-weight: 500;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .detail-item .value {
          font-size: 14px;
          color: #2c3e50;
          font-weight: 500;
          background-color: #f8f9fa;
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid #e9ecef;
        }
        
        /* 상태별 색상 */
        .status-스케줄-등록됨 {
          background-color: #e3f2fd !important;
          color: #1976d2 !important;
          border-color: #2196f3 !important;
        }
        
        .status-운행-중 {
          background-color: #fff3e0 !important;
          color: #f57c00 !important;
          border-color: #ff9800 !important;
        }
        
        .status-운행-완료 {
          background-color: #e8f5e8 !important;
          color: #2e7d32 !important;
          border-color: #4caf50 !important;
        }
        
        .status-운행-취소 {
          background-color: #ffebee !important;
          color: #c62828 !important;
          border-color: #f44336 !important;
        }
        
        /* 모달 푸터 */
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px 24px;
          border-top: 1px solid #e9ecef;
          background-color: #f8f9fa;
          border-radius: 0 0 12px 12px;
        }
        
        /* 버튼 스타일 */
        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .btn-primary {
          background-color: #3498db;
          color: white;
        }
        
        .btn-primary:hover:not(:disabled) {
          background-color: #2980b9;
          transform: translateY(-1px);
        }
        
        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }
        
        .btn-secondary:hover:not(:disabled) {
          background-color: #5a6268;
        }
        
        .btn-warning {
          background-color: #f39c12;
          color: white;
        }
        
        .btn-warning:hover:not(:disabled) {
          background-color: #e67e22;
        }
        
        .btn-danger {
          background-color: #e74c3c;
          color: white;
        }
        
        .btn-danger:hover:not(:disabled) {
          background-color: #c0392b;
        }
        
        .btn-success {
          background-color: #27ae60;
          color: white;
        }
        
        .btn-success:hover:not(:disabled) {
          background-color: #219a52;
        }
        
        .btn-info {
          background-color: #3498db;
          color: white;
        }
        
        .btn-info:hover:not(:disabled) {
          background-color: #2980b9;
        }
        
        /* 캘린더 스타일 */
        .fc-event.current-month-event {
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-width: 2px !important;
        }
        
        .fc-event.other-month-event {
          opacity: 0.6 !important;
          filter: grayscale(20%);
        }
        
        .fc-daygrid-day.other-month-cell {
          background-color: #fafafa;
        }
        
        .fc-daygrid-day.current-month-cell {
          background-color: #ffffff;
        }
        
        .fc-event {
          cursor: pointer;
          border: none !important;
          padding: 2px !important;
          transition: all 0.2s ease;
        }
        
        .fc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
        }
        
        /* 반응형 디자인 */
        @media (max-width: 768px) {
          .modal-content {
            width: 95%;
            margin: 10px;
          }
          
          .detail-grid {
            grid-template-columns: 1fr;
          }
          
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .schedule-stats {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          
          .legend-items {
            flex-direction: column;
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
}

export default BusSchedule;