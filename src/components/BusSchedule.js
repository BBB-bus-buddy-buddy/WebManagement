// components/BusSchedule.js - 파트 1

import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';

/**
 * 버스 기사 배치표 컴포넌트
 * 버스 기사, 버스, 노선 정보를 관리하고 스케줄 CRUD 기능 제공
 */
function BusSchedule() {
  // 요일
  const weekdays = ['월', '화', '수', '목', '금', '토', '일'];
  const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  
  // 더미 데이터 - 버스 기사
  const drivers = [
    { id: 1, name: '김철수', driverNumber: 'D-1001' },
    { id: 2, name: '박영희', driverNumber: 'D-1002' },
    { id: 3, name: '이민수', driverNumber: 'D-2001' },
    { id: 4, name: '최지영', driverNumber: 'D-2002' },
    { id: 5, name: '정현우', driverNumber: 'D-3001' }
  ];
  
  // 더미 데이터 - 버스 (회사 정보 추가)
  const buses = [
    { id: 1, number: '108', company: '서울교통공사' },
    { id: 2, number: '302', company: '서울교통공사' },
    { id: 3, number: '401', company: '경기교통' },
    { id: 4, number: '152', company: '서울교통공사' },
    { id: 5, number: '273', company: '경기교통' }
  ];
  
  // 더미 데이터 - 노선 (운행 가능 시간 추가)
  const routes = [
    { id: 1, name: '강남-송파', operationStartTime: '05:00', operationEndTime: '23:00' },
    { id: 2, name: '서초-강남', operationStartTime: '06:00', operationEndTime: '22:00' },
    { id: 3, name: '송파-강동', operationStartTime: '05:30', operationEndTime: '23:30' },
    { id: 4, name: '강북-도봉', operationStartTime: '05:00', operationEndTime: '00:00' },
    { id: 5, name: '종로-중구', operationStartTime: '06:00', operationEndTime: '23:00' }
  ];
  
  // 더미 데이터 - 타 회사 버스 배정 일정
  const [externalBusAssignments, setExternalBusAssignments] = useState([
    { busNumber: '108', date: '2025-03-31', company: '인천교통', startTime: '07:00', endTime: '19:00' },
    { busNumber: '302', date: '2025-04-01', company: '경기교통', startTime: '08:00', endTime: '20:00' },
    { busNumber: '401', date: '2025-04-02', company: '서울교통공사', startTime: '06:00', endTime: '18:00' }
  ]);
  
  // 스케줄 상태
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 확장된 스케줄 (반복 일정 포함)
  const [expandedSchedules, setExpandedSchedules] = useState([]);
  
  // 상태
  const [viewType, setViewType] = useState('weekly'); // 'weekly' 또는 'monthly'
  const [selectedWeek, setSelectedWeek] = useState('2025-03-31'); // 날짜 형식
  const [selectedMonth, setSelectedMonth] = useState('2025-04'); // YYYY-MM 형식
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    driverId: '',
    busId: '',
    routeId: '',
    date: new Date().toISOString().split('T')[0], // 오늘 날짜를 기본값으로
    startTime: '09:00',
    endTime: '17:00',
    isRepeating: false,
    repeatDays: [],
    repeatEndDate: null
  });
  
  // 상세 정보 모달 관련 상태
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editSchedule, setEditSchedule] = useState(null);
  
  // 스케줄 복사 모달 관련 상태
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyScheduleId, setCopyScheduleId] = useState(null);
  const [copyTargetDate, setCopyTargetDate] = useState('');
  
  // 서버에서 데이터 가져오기
  useEffect(() => {
    fetchSchedules();
  }, []);
  
  // 모든 스케줄 가져오기
  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getAllOperationPlans();
      // 서버 형식에서 앱 형식으로 변환
      const convertedData = ApiService.convertToAppFormat(data);
      setSchedules(convertedData);
      setLoading(false);
    } catch (error) {
      setError('데이터를 불러오는 데 실패했습니다.');
      setLoading(false);
      console.error('스케줄 불러오기 실패:', error);
    }
  };// components/BusSchedule.js - 파트 2

  // 반복 스케줄을 확장하는 함수
  useEffect(() => {
    expandRepeatingSchedules();
  }, [schedules, viewType, selectedWeek, selectedMonth]);
  
  // 반복 스케줄을 확장하는 함수
  const expandRepeatingSchedules = () => {
    let expanded = [...schedules];
    const repeatingSchedules = schedules.filter(s => s.isRepeating);
    
    // 표시 기간 계산
    let startDate, endDate;
    
    if (viewType === 'weekly') {
      const selected = new Date(selectedWeek);
      const weekStart = new Date(selected);
      const dayOfWeek = selected.getDay();
      weekStart.setDate(selected.getDate() - ((dayOfWeek + 6) % 7)); // 월요일로 보정
      
      startDate = new Date(weekStart);
      endDate = new Date(weekStart);
      endDate.setDate(startDate.getDate() + 6);
    } else {
      const [year, month] = selectedMonth.split('-');
      startDate = new Date(year, parseInt(month) - 1, 1);
      endDate = new Date(year, parseInt(month), 0);
    }
    
    // 각 반복 스케줄에 대해
    repeatingSchedules.forEach(schedule => {
      // 기준 날짜로부터 표시 기간 내의 모든 날짜 확인
      const baseDate = new Date(schedule.date);
      const endRepeatDate = schedule.repeatEndDate ? new Date(schedule.repeatEndDate) : null;
      
      // 비교를 위해 baseDate의 요일 가져오기 (0: 일요일, 1: 월요일, ...)
      const baseDateDay = baseDate.getDay();
      const adjustedBaseDateDay = (baseDateDay + 6) % 7; // 월요일을 0으로 조정
      
      // startDate부터 endDate까지 순회
      let currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        // 현재 날짜가 반복 종료일 이후면 중단
        if (endRepeatDate && currentDate > endRepeatDate) {
          break;
        }
        
        // 현재 날짜가 기준 날짜보다 이전이면 건너뜀
        if (currentDate < baseDate) {
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }
        
        // 현재 날짜의 요일 (0: 일요일, 1: 월요일, ...)
        const currentDay = currentDate.getDay();
        const adjustedCurrentDay = (currentDay + 6) % 7; // 월요일을 0으로 조정
        
        // 해당 요일이 반복 요일에 포함되어 있는지 확인
        if (schedule.repeatDays.includes(adjustedCurrentDay)) {
          // 반복 스케줄에서 새 인스턴스 생성
          const newInstance = {
            ...schedule,
            id: `${schedule.id}-${currentDate.toISOString().split('T')[0]}`, // 고유 ID 생성
            date: currentDate.toISOString().split('T')[0], // YYYY-MM-DD 형식으로 변환
            isRepeatingInstance: true, // 반복 인스턴스 표시
            originalScheduleId: schedule.id // 원본 스케줄 참조
          };
          
          // 확장된 스케줄에 추가
          if (!expanded.some(s => 
            s.date === newInstance.date && 
            s.startTime === newInstance.startTime && 
            s.endTime === newInstance.endTime && 
            s.busId === newInstance.busId && 
            s.driverId === newInstance.driverId
          )) {
            expanded.push(newInstance);
          }
        }
        
        // 다음 날짜로 이동
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
    
    setExpandedSchedules(expanded);
  };
  
  // 요일 변환 유틸리티 함수들
  // 날짜를 요일 인덱스로 변환하는 함수 (0: 월요일, 1: 화요일, ...)
  const getWeekdayIndexFromDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDay(); // 0: 일요일, 1: 월요일, ...
    return (day + 6) % 7; // 월요일을 0으로 조정
  };
  
  // 요일 인덱스를 요일 이름으로 변환
  const getWeekdayNameFromIndex = (index) => {
    return weekdays[index];
  };
  
  // 날짜를 요일 이름으로 변환하는 함수
  const getWeekdayFromDate = (dateString) => {
    const index = getWeekdayIndexFromDate(dateString);
    return getWeekdayNameFromIndex(index);
  };
  
  // 시간이 노선의 운행 가능 시간 내에 있는지 확인하는 함수
  const isWithinRouteOperationHours = (routeId, startTime, endTime) => {
    const route = routes.find(r => r.id === routeId);
    if (!route) return false;
    
    // 시간 비교를 위해 문자열 시간을 분으로 변환
    const convertTimeToMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const routeStartMinutes = convertTimeToMinutes(route.operationStartTime);
    const routeEndMinutes = convertTimeToMinutes(route.operationEndTime);
    const scheduleStartMinutes = convertTimeToMinutes(startTime);
    let scheduleEndMinutes = convertTimeToMinutes(endTime);
    
    // 종료 시간이 다음 날인 경우 (예: 22:00 - 06:00)
    if (scheduleEndMinutes < scheduleStartMinutes) {
      // 시작 시간이 노선 운행 시작 이후이고, 자정 이전인지
      const isStartValid = scheduleStartMinutes >= routeStartMinutes;
      // 종료 시간이 노선 운행 종료 이전인지 (다음 날 기준)
      const isEndValid = scheduleEndMinutes <= routeEndMinutes || 
                          (routeEndMinutes >= 24*60) || // 노선 운행이 자정을 넘기는 경우
                          (scheduleEndMinutes <= (routeEndMinutes + 24*60)); // 24시간 추가하여 비교
      
      return isStartValid && isEndValid;
    } else {
      // 같은 날 내에 운행이 끝나는 경우
      return scheduleStartMinutes >= routeStartMinutes && scheduleEndMinutes <= routeEndMinutes;
    }
  };
  
  // 타 회사 버스 배정과 충돌하는지 확인하는 함수
  const hasExternalBusConflict = (busId, date, startTime, endTime) => {
    const bus = buses.find(b => b.id === busId);
    if (!bus) return false;
    
    // 같은 버스 번호의 외부 배정 확인
    const externalAssignments = externalBusAssignments.filter(
      a => a.busNumber === bus.number && a.date === date
    );
    
    if (externalAssignments.length === 0) return false;
    
    // 시간 충돌 확인
    const convertTimeToMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const scheduleStartMinutes = convertTimeToMinutes(startTime);
    let scheduleEndMinutes = convertTimeToMinutes(endTime);
    
    // 종료 시간이 다음 날인 경우 (예: 22:00 - 06:00)
    if (scheduleEndMinutes < scheduleStartMinutes) {
      scheduleEndMinutes += 24 * 60; // 24시간 추가
    }
    
    return externalAssignments.some(assignment => {
      let assignStartMinutes = convertTimeToMinutes(assignment.startTime);
      let assignEndMinutes = convertTimeToMinutes(assignment.endTime);
      
      // 종료 시간이 다음 날인 경우
      if (assignEndMinutes < assignStartMinutes) {
        assignEndMinutes += 24 * 60;
      }
      
      // 시간 범위가 겹치는지 확인
      return (
        (scheduleStartMinutes <= assignEndMinutes && scheduleEndMinutes >= assignStartMinutes)
      );
    });
  };
  
  // 현재 보기에 맞는 스케줄 필터링
  const getFilteredSchedules = () => {
    if (viewType === 'weekly') {
      // 선택된 주의 날짜 범위 계산
      const selectedDate = new Date(selectedWeek);
      const weekStart = new Date(selectedDate);
      // 월요일을 기준으로 시작일 계산
      const dayOfWeek = selectedDate.getDay(); // 0: 일요일, 1: 월요일, ...
      weekStart.setDate(selectedDate.getDate() - ((dayOfWeek + 6) % 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      // 해당 주에 속하는 스케줄만 필터링 (확장된 스케줄 사용)
      return expandedSchedules.filter(schedule => {
        const scheduleDate = new Date(schedule.date);
        return scheduleDate >= weekStart && scheduleDate <= weekEnd;
      });
    } else {
      // 월간 보기의 경우 해당 월에 속하는 스케줄만 필터링 (확장된 스케줄 사용)
      const [year, month] = selectedMonth.split('-');
      return expandedSchedules.filter(schedule => {
        return schedule.date.startsWith(`${year}-${month}`);
      });
    }
  };
  
  const getDriverName = (driverId) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver ? driver.name : '알 수 없음';
  };
  
  const getDriverNumber = (driverId) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver ? driver.driverNumber : '알 수 없음';
  };
  
  const getBusNumber = (busId) => {
    const bus = buses.find(b => b.id === busId);
    return bus ? bus.number : '알 수 없음';
  };
  
  const getBusCompany = (busId) => {
    const bus = buses.find(b => b.id === busId);
    return bus ? bus.company : '알 수 없음';
  };
  
  const getRouteName = (routeId) => {
    const route = routes.find(r => r.id === routeId);
    return route ? route.name : '알 수 없음';
  };
  
  const getRouteOperationHours = (routeId) => {
    const route = routes.find(r => r.id === routeId);
    if (!route) return '';
    return `${route.operationStartTime} - ${route.operationEndTime}`;
  };
  
  // 날짜를 포맷팅하는 함수
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long' };
    return new Date(dateString).toLocaleDateString('ko-KR', options);
  };// components/BusSchedule.js - 파트 3
  
  // 날짜 입력 처리
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'date') {
      const dayOfWeek = getWeekdayIndexFromDate(value);
      
      setNewSchedule({
        ...newSchedule,
        date: value,
        repeatDays: newSchedule.isRepeating ? [dayOfWeek] : []
      });
    } else if (name === 'repeatEndDate') {
      setNewSchedule({
        ...newSchedule,
        repeatEndDate: value
      });
    }
  };
  
  // 요일 체크박스 처리
  const handleDayCheckbox = (dayIndex) => {
    const currentDays = [...newSchedule.repeatDays];
    const dayPosition = currentDays.indexOf(dayIndex);
    
    if (dayPosition >= 0) {
      // 이미 선택된 요일이면 제거
      currentDays.splice(dayPosition, 1);
    } else {
      // 선택되지 않은 요일이면 추가
      currentDays.push(dayIndex);
    }
    
    setNewSchedule({
      ...newSchedule,
      repeatDays: currentDays
    });
  };
  
  // 요일 체크박스 처리 (수정 모드)
  const handleEditDayCheckbox = (dayIndex) => {
    const currentDays = [...editSchedule.repeatDays];
    const dayPosition = currentDays.indexOf(dayIndex);
    
    if (dayPosition >= 0) {
      // 이미 선택된 요일이면 제거
      currentDays.splice(dayPosition, 1);
    } else {
      // 선택되지 않은 요일이면 추가
      currentDays.push(dayIndex);
    }
    
    setEditSchedule({
      ...editSchedule,
      repeatDays: currentDays
    });
  };
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'isRepeating') {
      // 반복 설정 토글 시
      const baseDate = newSchedule.date;
      const dayOfWeek = getWeekdayIndexFromDate(baseDate);
      
      setNewSchedule({
        ...newSchedule,
        [name]: checked,
        // 반복 설정 활성화 시 현재 날짜의 요일을 기본으로 설정
        repeatDays: checked ? [dayOfWeek] : [],
        // 반복 종료일 설정 (기본값: 3개월 후)
        repeatEndDate: checked ? getDefaultRepeatEndDate(baseDate) : null
      });
      return;
    }
    
    if (name === 'endTime' && value <= newSchedule.startTime) {
      alert('종료 시간은 시작 시간 이후여야 합니다.');
      return;
    }
    
    // 노선 선택 시 시간 범위 검증
    if (name === 'routeId' && newSchedule.startTime && newSchedule.endTime) {
      const routeId = parseInt(value);
      if (routeId && !isWithinRouteOperationHours(routeId, newSchedule.startTime, newSchedule.endTime)) {
        alert('선택한 시간이 노선 운행 가능 시간을 벗어납니다.');
        // 경고만 하고 진행 가능하도록 함
      }
    }
    
    // 시간 변경 시 노선 운행 시간 검증
    if ((name === 'startTime' || name === 'endTime') && newSchedule.routeId) {
      const routeId = parseInt(newSchedule.routeId);
      const startTime = name === 'startTime' ? value : newSchedule.startTime;
      const endTime = name === 'endTime' ? value : newSchedule.endTime;
      
      if (routeId && !isWithinRouteOperationHours(routeId, startTime, endTime)) {
        alert('선택한 시간이 노선 운행 가능 시간을 벗어납니다.');
        // 경고만 하고 진행 가능하도록 함
      }
    }
    
    setNewSchedule({
      ...newSchedule,
      [name]: ['driverId', 'busId', 'routeId'].includes(name) 
        ? parseInt(value) 
        : value
    });
  };
  
  // 기본 반복 종료일 설정 (기준 날짜로부터 3개월 후)
  const getDefaultRepeatEndDate = (baseDate) => {
    const date = new Date(baseDate);
    date.setMonth(date.getMonth() + 3);
    return date.toISOString().split('T')[0];
  };
  
  const handleEditDateChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'date') {
      const dayOfWeek = getWeekdayIndexFromDate(value);
      
      setEditSchedule({
        ...editSchedule,
        date: value,
        repeatDays: editSchedule.isRepeating && editSchedule.repeatDays.length === 0 ? [dayOfWeek] : editSchedule.repeatDays
      });
    } else if (name === 'repeatEndDate') {
      setEditSchedule({
        ...editSchedule,
        repeatEndDate: value
      });
    }
  };
  
  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'isRepeating') {
      // 반복 설정 토글 시
      const baseDate = editSchedule.date;
      const dayOfWeek = getWeekdayIndexFromDate(baseDate);
      
      setEditSchedule({
        ...editSchedule,
        [name]: checked,
        // 반복 설정 활성화 시 현재 날짜의 요일을 기본으로 설정
        repeatDays: checked ? [dayOfWeek] : [],
        // 반복 종료일 설정 (기본값: 3개월 후)
        repeatEndDate: checked ? getDefaultRepeatEndDate(baseDate) : null
      });
      return;
    }
    
    if (name === 'endTime' && value <= editSchedule.startTime) {
      alert('종료 시간은 시작 시간 이후여야 합니다.');
      return;
    }
    
    // 노선 선택 시 시간 범위 검증
    if (name === 'routeId' && editSchedule.startTime && editSchedule.endTime) {
      const routeId = parseInt(value);
      if (routeId && !isWithinRouteOperationHours(routeId, editSchedule.startTime, editSchedule.endTime)) {
        alert('선택한 시간이 노선 운행 가능 시간을 벗어납니다.');
        // 경고만 하고 진행 가능하도록 함
      }
    }
    
    // 시간 변경 시 노선 운행 시간 검증
    if ((name === 'startTime' || name === 'endTime') && editSchedule.routeId) {
      const routeId = parseInt(editSchedule.routeId);
      const startTime = name === 'startTime' ? value : editSchedule.startTime;
      const endTime = name === 'endTime' ? value : editSchedule.endTime;
      
      if (routeId && !isWithinRouteOperationHours(routeId, startTime, endTime)) {
        alert('선택한 시간이 노선 운행 가능 시간을 벗어납니다.');
        // 경고만 하고 진행 가능하도록 함
      }
    }
    
    setEditSchedule({
      ...editSchedule,
      [name]: ['driverId', 'busId', 'routeId'].includes(name) 
        ? parseInt(value) 
        : value
    });
  };// components/BusSchedule.js - 파트 4

  // API를 통한 스케줄 추가
  const handleAddSchedule = async (e) => {
    e.preventDefault();
    
    // 버스와 노선 모두 선택했는지 확인
    if (!newSchedule.busId || !newSchedule.routeId) {
      alert('버스와 노선을 모두 선택해주세요.');
      return;
    }
    
    // 선택한 시간이 노선 운행 가능 시간 내인지 확인
    if (!isWithinRouteOperationHours(newSchedule.routeId, newSchedule.startTime, newSchedule.endTime)) {
      if (!window.confirm('선택한 시간이 노선 운행 가능 시간을 벗어납니다. 계속 진행하시겠습니까?')) {
        return;
      }
    }
    
    // 타 회사 버스 배정과 충돌이 있는지 확인
    if (hasExternalBusConflict(newSchedule.busId, newSchedule.date, newSchedule.startTime, newSchedule.endTime)) {
      alert('해당 날짜에 다른 회사에서 이미 이 버스를 사용하고 있습니다. 다른 버스를 선택해주세요.');
      return;
    }
    
    // 반복 일정 확인
    if (newSchedule.isRepeating && newSchedule.repeatDays.length === 0) {
      alert('반복 일정에는 최소 하나의 요일을 선택해야 합니다.');
      return;
    }
    
    // 반복 종료일 확인
    if (newSchedule.isRepeating && (!newSchedule.repeatEndDate || new Date(newSchedule.repeatEndDate) < new Date(newSchedule.date))) {
      alert('반복 종료일은 시작일 이후로 설정해야 합니다.');
      return;
    }
    
    // 중복 체크
    const isDuplicate = schedules.some(s => 
      s.date === newSchedule.date && 
      ((s.startTime <= newSchedule.startTime && s.endTime > newSchedule.startTime) ||
       (s.startTime < newSchedule.endTime && s.endTime >= newSchedule.endTime) ||
       (s.startTime >= newSchedule.startTime && s.endTime <= newSchedule.endTime)) &&
      s.busId === newSchedule.busId
    );
    
    if (isDuplicate) {
      alert('해당 날짜와 시간에 이미 버스가 배정되어 있습니다.');
      return;
    }
    
    // 기사 스케줄 중복 체크
    const isDriverBusy = schedules.some(s => 
      s.date === newSchedule.date && 
      ((s.startTime <= newSchedule.startTime && s.endTime > newSchedule.startTime) ||
       (s.startTime < newSchedule.endTime && s.endTime >= newSchedule.endTime) ||
       (s.startTime >= newSchedule.startTime && s.endTime <= newSchedule.endTime)) &&
      s.driverId === newSchedule.driverId
    );
    
    if (isDriverBusy) {
      alert('해당 기사는 같은 날짜와 시간에 이미 배정되어 있습니다.');
      return;
    }
    
    try {
      setLoading(true);
      
      // API 요청 데이터 준비
      const operationPlanData = ApiService.convertToServerFormat(newSchedule, drivers, buses, routes);
      
      // API 호출
      const response = await ApiService.addOperationPlan(operationPlanData);
      
      // 응답 확인
      if (response) {
        alert('스케줄이 성공적으로 추가되었습니다.');
        
        // API에서 최신 데이터 다시 불러오기
        await fetchSchedules();
        
        // 폼 초기화
        setShowAddForm(false);
        setNewSchedule({
          driverId: '',
          busId: '',
          routeId: '',
          date: new Date().toISOString().split('T')[0],
          startTime: '09:00',
          endTime: '17:00',
          isRepeating: false,
          repeatDays: [],
          repeatEndDate: null
        });
      }
    } catch (error) {
      alert(`스케줄 추가 중 오류가 발생했습니다: ${error.message}`);
      console.error('스케줄 추가 실패:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // API를 통한 스케줄 업데이트
  const handleUpdateSchedule = async (e) => {
    e.preventDefault();
    
    // 버스와 노선 모두 선택했는지 확인
    if (!editSchedule.busId || !editSchedule.routeId) {
      alert('버스와 노선을 모두 선택해주세요.');
      return;
    }
    
    // 선택한 시간이 노선 운행 가능 시간 내인지 확인
    if (!isWithinRouteOperationHours(editSchedule.routeId, editSchedule.startTime, editSchedule.endTime)) {
      if (!window.confirm('선택한 시간이 노선 운행 가능 시간을 벗어납니다. 계속 진행하시겠습니까?')) {
        return;
      }
    }
    
    // 타 회사 버스 배정과 충돌이 있는지 확인
    if (hasExternalBusConflict(editSchedule.busId, editSchedule.date, editSchedule.startTime, editSchedule.endTime)) {
      alert('해당 날짜에 다른 회사에서 이미 이 버스를 사용하고 있습니다. 다른 버스를 선택해주세요.');
      return;
    }
    
    // 반복 일정 확인
    if (editSchedule.isRepeating && editSchedule.repeatDays.length === 0) {
      alert('반복 일정에는 최소 하나의 요일을 선택해야 합니다.');
      return;
    }
    
    // 반복 종료일 확인
    if (editSchedule.isRepeating && (!editSchedule.repeatEndDate || new Date(editSchedule.repeatEndDate) < new Date(editSchedule.date))) {
      alert('반복 종료일은 시작일 이후로 설정해야 합니다.');
      return;
    }
    
    // 중복 체크 (자기 자신은 제외)
    const isDuplicate = schedules.some(s => 
      s.id !== editSchedule.id &&
      s.date === editSchedule.date && 
      ((s.startTime <= editSchedule.startTime && s.endTime > editSchedule.startTime) ||
       (s.startTime < editSchedule.endTime && s.endTime >= editSchedule.endTime) ||
       (s.startTime >= editSchedule.startTime && s.endTime <= editSchedule.endTime)) &&
      s.busId === editSchedule.busId
    );
    
    if (isDuplicate) {
      alert('해당 날짜와 시간에 이미 버스가 배정되어 있습니다.');
      return;
    }
    
    // 기사 스케줄 중복 체크 (자기 자신은 제외)
    const isDriverBusy = schedules.some(s => 
      s.id !== editSchedule.id &&
      s.date === editSchedule.date && 
      ((s.startTime <= editSchedule.startTime && s.endTime > editSchedule.startTime) ||
       (s.startTime < editSchedule.endTime && s.endTime >= editSchedule.endTime) ||
       (s.startTime >= editSchedule.startTime && s.endTime <= editSchedule.endTime)) &&
      s.driverId === editSchedule.driverId
    );
    
    if (isDriverBusy) {
      alert('해당 기사는 같은 날짜와 시간에 이미 배정되어 있습니다.');
      return;
    }
    
    try {
      setLoading(true);
      
      // API 요청 데이터 준비
      const operationPlanData = ApiService.convertToServerFormat(editSchedule, drivers, buses, routes);
      
      // API 호출
      const response = await ApiService.updateOperationPlan(operationPlanData);
      
      // 응답 확인
      if (response) {
        alert('스케줄이 성공적으로 수정되었습니다.');
        
        // API에서 최신 데이터 다시 불러오기
        await fetchSchedules();
        
        // 모달 닫기
        setShowDetailModal(false);
        setEditMode(false);
        setSelectedSchedule(null);
        setEditSchedule(null);
      }
    } catch (error) {
      alert(`스케줄 수정 중 오류가 발생했습니다: ${error.message}`);
      console.error('스케줄 수정 실패:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // API를 통한 스케줄 삭제
  const handleDeleteSchedule = async (scheduleId) => {
    // 반복 인스턴스인 경우 원본 스케줄 찾기
    const schedule = expandedSchedules.find(s => s.id === scheduleId);
    
    if (schedule && schedule.isRepeatingInstance) {
      alert('반복 일정의 개별 인스턴스는 삭제할 수 없습니다. 원본 일정을 수정하세요.');
      return;
    }
    
    if (window.confirm('이 스케줄을 삭제하시겠습니까?')) {
      try {
        setLoading(true);
        
        // API 호출
        await ApiService.deleteOperationPlan(scheduleId);
        
        alert('스케줄이 성공적으로 삭제되었습니다.');
        
        // API에서 최신 데이터 다시 불러오기
        await fetchSchedules();
        
        // 모달이 열려 있는 경우 닫기
        if (showDetailModal && selectedSchedule && selectedSchedule.id === scheduleId) {
          setShowDetailModal(false);
          setSelectedSchedule(null);
        }
      } catch (error) {
        alert(`스케줄 삭제 중 오류가 발생했습니다: ${error.message}`);
        console.error('스케줄 삭제 실패:', error);
      } finally {
        setLoading(false);
      }
    }
  };
  
  const handleScheduleClick = (schedule) => {
    // 반복 인스턴스인 경우 원본 스케줄 가져오기
    if (schedule.isRepeatingInstance && schedule.originalScheduleId) {
      const originalSchedule = schedules.find(s => s.id === schedule.originalScheduleId);
      if (originalSchedule) {
        setSelectedSchedule(originalSchedule);
      } else {
        // 원본을 찾지 못한 경우 현재 인스턴스 사용
        setSelectedSchedule(schedule);
      }
    } else {
      setSelectedSchedule(schedule);
    }
    
    setShowDetailModal(true);
    setEditMode(false);
  };
  
  const handleEditClick = () => {
    setEditSchedule({...selectedSchedule});
    setEditMode(true);
  };
  
  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedSchedule(null);
    setEditMode(false);
    setEditSchedule(null);
  };
  
  // 스케줄 복사 모달 열기
  const handleOpenCopyModal = (scheduleId) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;
    
    // 다음 날짜를 기본값으로 설정
    const nextDay = new Date(schedule.date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    setCopyScheduleId(scheduleId);
    setCopyTargetDate(nextDay.toISOString().split('T')[0]);
    setShowCopyModal(true);
  };
  
  // 스케줄 복사 실행
  const handleCopySchedule = async () => {
    const sourceSchedule = schedules.find(s => s.id === copyScheduleId);
    if (!sourceSchedule) {
      alert('복사할 스케줄을 찾을 수 없습니다.');
      return;
    }
    
    // 타겟 날짜 유효성 검사
    if (!copyTargetDate) {
      alert('복사할 날짜를 선택해주세요.');
      return;
    }
    
    // 타겟 날짜가 과거인지 확인
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(copyTargetDate);
    
    if (targetDate < today) {
      if (!window.confirm('과거 날짜로 스케줄을 복사하시겠습니까?')) {
        return;
      }
    }
    
    // 타 회사 버스 배정과 충돌이 있는지 확인
    if (hasExternalBusConflict(sourceSchedule.busId, copyTargetDate, sourceSchedule.startTime, sourceSchedule.endTime)) {
      alert('타겟 날짜에 다른 회사에서 이미 이 버스를 사용하고 있습니다. 다른 날짜나 버스를 선택해주세요.');
      return;
    }
    
    // 중복 체크
    const isDuplicate = schedules.some(s => 
      s.date === copyTargetDate && 
      ((s.startTime <= sourceSchedule.startTime && s.endTime > sourceSchedule.startTime) ||
       (s.startTime < sourceSchedule.endTime && s.endTime >= sourceSchedule.endTime) ||
       (s.startTime >= sourceSchedule.startTime && s.endTime <= sourceSchedule.endTime)) &&
      s.busId === sourceSchedule.busId
    );
    
    if (isDuplicate) {
      alert('타겟 날짜와 시간에 이미 버스가 배정되어 있습니다.');
      return;
    }
    
    // 기사 스케줄 중복 체크
    const isDriverBusy = schedules.some(s => 
      s.date === copyTargetDate && 
      ((s.startTime <= sourceSchedule.startTime && s.endTime > sourceSchedule.startTime) ||
       (s.startTime < sourceSchedule.endTime && s.endTime >= sourceSchedule.endTime) ||
       (s.startTime >= sourceSchedule.startTime && s.endTime <= sourceSchedule.endTime)) &&
      s.driverId === sourceSchedule.driverId
    );
    
    if (isDriverBusy) {
      alert('해당 기사는 타겟 날짜와 시간에 이미 배정되어 있습니다.');
      return;
    }
    
    try {
      setLoading(true);
      
      // 새 스케줄 준비
      const newSchedule = {
        ...sourceSchedule,
        date: copyTargetDate,
        // 반복 설정은 복사하지 않음
        isRepeating: false,
        repeatDays: [],
        repeatEndDate: null
      };
      
      // API 요청 데이터 준비
      const operationPlanData = ApiService.convertToServerFormat(newSchedule, drivers, buses, routes);
      
      // API 호출
      const response = await ApiService.addOperationPlan(operationPlanData);
      
      // 응답 확인
      if (response) {
        alert('스케줄이 성공적으로 복사되었습니다.');
        
        // API에서 최신 데이터 다시 불러오기
        await fetchSchedules();
        
        // 모달 닫기
        setShowCopyModal(false);
        setCopyScheduleId(null);
        setCopyTargetDate('');
      }
    } catch (error) {
      alert(`스케줄 복사 중 오류가 발생했습니다: ${error.message}`);
      console.error('스케줄 복사 실패:', error);
    } finally {
      setLoading(false);
    }
  };// components/BusSchedule.js - 파트 5

  // 요일별 구조의 주간 보기
  const renderWeeklySchedule = () => {
    // 요일별로 스케줄 그룹화
    const groupedSchedules = {};
    
    // 선택한 날짜를 기준으로 한 주의 날짜들 계산
    const selectedDate = new Date(selectedWeek);
    const weekStart = new Date(selectedDate);
    const dayOfWeek = selectedDate.getDay(); // 0: 일요일, 1: 월요일, ...
    weekStart.setDate(selectedDate.getDate() - ((dayOfWeek + 6) % 7));
    
    // 7일간의 날짜 생성
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      weekDates.push(date.toISOString().split('T')[0]); // YYYY-MM-DD 형식
    }
    
    // 날짜별로 스케줄 필터링
    weekDates.forEach(date => {
      groupedSchedules[date] = getFilteredSchedules().filter(s => s.date === date);
    });
    
    return (
      <div className="weekly-schedule">
        <table className="schedule-table">
          <thead>
            <tr>
              {weekDates.map((date, index) => (
                <th key={index} className="day-column">
                  {formatDate(date)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {weekDates.map((date, dayIndex) => {
                const daySchedules = groupedSchedules[date] || [];
                
                return (
                  <td key={dayIndex} className="schedule-cell">
                    {daySchedules.map(schedule => {
                      // 노선 운행 시간 체크
                      const isOutsideRouteHours = !isWithinRouteOperationHours(
                        schedule.routeId,
                        schedule.startTime,
                        schedule.endTime
                      );
                      
                      return (
                        <div 
                          key={schedule.id} 
                          className={`schedule-item ${isOutsideRouteHours ? 'outside-hours-warning' : ''} ${schedule.isRepeating || schedule.isRepeatingInstance ? 'repeating-schedule' : ''}`}
                          onClick={() => handleScheduleClick(schedule)}
                        >
                          <div className="bus-info">버스: {getBusNumber(schedule.busId)}</div>
                          <div className="route-info">노선: {getRouteName(schedule.routeId)}</div>
                          <div className="driver-info">기사: {getDriverName(schedule.driverId)}</div>
                          <div className="time-info">
                            {schedule.startTime} - {schedule.endTime}
                          </div>
                          {(schedule.isRepeating || schedule.isRepeatingInstance) && (
                            <div className="repeat-indicator">🔁 반복</div>
                          )}
                          {isOutsideRouteHours && (
                            <div className="hours-warning-indicator">⚠️ 노선 운행 시간 외</div>
                          )}
                          
                          <div className="schedule-actions">
                            {!schedule.isRepeatingInstance && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenCopyModal(schedule.id);
                                }}
                                className="copy-schedule-button"
                                title="이 스케줄 복사"
                              >
                                📋
                              </button>
                            )}
                            
                            {!schedule.isRepeatingInstance && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSchedule(schedule.id);
                                }}
                                className="delete-schedule-button"
                                title="삭제"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    );
  };// components/BusSchedule.js - 파트 6

  // 개선된 월간 보기
  const renderMonthlySchedule = () => {
    // 선택된 월의 일수를 계산
    const getDaysInMonth = () => {
      const [year, month] = selectedMonth.split('-');
      return new Date(year, month, 0).getDate();
    };
    
    // 선택된 월의 첫 날의 요일 (0: 일요일, 1: 월요일, ...)
    const getFirstDayOfMonth = () => {
      const [year, month] = selectedMonth.split('-');
      return new Date(year, month - 1, 1).getDay();
    };
    
    const daysInMonth = getDaysInMonth();
    const firstDay = getFirstDayOfMonth();
    
    // 달력에 표시할 일수 (이전 달의 일부 + 현재 달 + 다음 달의 일부)
    const totalCells = Math.ceil((daysInMonth + firstDay) / 7) * 7;
    
    // 달력의 셀 생성
    const cells = [];
    for (let i = 0; i < totalCells; i++) {
      const dayOfMonth = i - firstDay + 1;
      const isCurrentMonth = dayOfMonth > 0 && dayOfMonth <= daysInMonth;
      
      if (isCurrentMonth) {
        const [year, month] = selectedMonth.split('-');
        const date = `${year}-${month}-${dayOfMonth.toString().padStart(2, '0')}`;
        cells.push({ dayOfMonth, isCurrentMonth, date });
      } else {
        cells.push({ dayOfMonth, isCurrentMonth, date: '' });
      }
    }
    
    // 주간 단위로 셀 분리
    const weeks = [];
    let week = [];
    cells.forEach((cell, index) => {
      week.push(cell);
      if ((index + 1) % 7 === 0) {
        weeks.push(week);
        week = [];
      }
    });
    
    // 해당 날짜의 스케줄 찾기
    const getSchedulesForDate = (date) => {
      if (!date) return [];
      return getFilteredSchedules().filter(s => s.date === date);
    };
    
    return (
      <div className="monthly-schedule">
        <div className="calendar-container">
          <div className="calendar-header">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
              <div key={index} className="calendar-weekday">{day}</div>
            ))}
          </div>
          <div className="calendar-body">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="calendar-week">
                {week.map((cell, dayIndex) => {
                  const daySchedules = cell.isCurrentMonth ? getSchedulesForDate(cell.date) : [];
                  
                  return (
                    <div 
                      key={dayIndex} 
                      className={`calendar-day ${!cell.isCurrentMonth ? 'calendar-day-other-month' : ''}`}
                    >
                      {cell.isCurrentMonth && (
                        <>
                          <div className="calendar-day-number">{cell.dayOfMonth}</div>
                          <div className="calendar-day-schedules">
                            {daySchedules.map((schedule, scheduleIndex) => {
                              // 노선 운행 시간 체크
                              const isOutsideRouteHours = !isWithinRouteOperationHours(
                                schedule.routeId,
                                schedule.startTime,
                                schedule.endTime
                              );
                              
                              return (
                                <div 
                                  key={scheduleIndex} 
                                  className={`calendar-schedule-item ${isOutsideRouteHours ? 'outside-hours-warning' : ''} ${schedule.isRepeating || schedule.isRepeatingInstance ? 'repeating-schedule' : ''}`}
                                  onClick={() => handleScheduleClick(schedule)}
                                >
                                  <div className="mini-schedule-info">
                                    <span className="mini-bus">{getBusNumber(schedule.busId)}</span>
                                    <span className="mini-route">{getRouteName(schedule.routeId)}</span>
                                    <span className="mini-driver">{getDriverName(schedule.driverId)}</span>
                                    <span className="mini-time">{schedule.startTime}-{schedule.endTime}</span>
                                    {(schedule.isRepeating || schedule.isRepeatingInstance) && <span className="mini-repeat">🔁</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  // 스케줄 복사 모달
  const renderCopyModal = () => {
    if (!showCopyModal) return null;
    
    return (
      <div className="modal-overlay" onClick={() => setShowCopyModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>스케줄 복사</h2>
            <button className="close-button" onClick={() => setShowCopyModal(false)}>×</button>
          </div>
          <div className="modal-body">
            <p>선택한 스케줄을 다른 날짜로 복사합니다.</p>
            {copyScheduleId && (
              <div className="schedule-info">
                <h3>선택된 스케줄 정보</h3>
                <div className="detail-row">
                  <label>날짜:</label>
                  <span>{formatDate(schedules.find(s => s.id === copyScheduleId)?.date || '')}</span>
                </div>
                <div className="detail-row">
                  <label>버스:</label>
                  <span>{getBusNumber(schedules.find(s => s.id === copyScheduleId)?.busId || 0)}</span>
                </div>
                <div className="detail-row">
                  <label>노선:</label>
                  <span>{getRouteName(schedules.find(s => s.id === copyScheduleId)?.routeId || 0)}</span>
                </div>
                <div className="detail-row">
                  <label>시간:</label>
                  <span>{schedules.find(s => s.id === copyScheduleId)?.startTime || ''} - {schedules.find(s => s.id === copyScheduleId)?.endTime || ''}</span>
                </div>
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="target-date">복사할 날짜:</label>
              <input 
                type="date" 
                id="target-date" 
                value={copyTargetDate}
                onChange={(e) => setCopyTargetDate(e.target.value)}
                required
              />
            </div>
            
            <div className="modal-notes">
              <p>참고:</p>
              <ul>
                <li>기존 스케줄과 충돌하는 경우 복사되지 않습니다.</li>
                <li>반복 일정 설정은 복사되지 않습니다.</li>
              </ul>
            </div>
            
            <div className="modal-actions">
              <button className="copy-button" onClick={handleCopySchedule}>복사하기</button>
              <button className="cancel-button" onClick={() => setShowCopyModal(false)}>취소</button>
            </div>
          </div>
        </div>
      </div>
    );
  };// components/BusSchedule.js - 파트 7
  
  // 상세 정보 모달
  const renderDetailModal = () => {
    if (!showDetailModal || !selectedSchedule) return null;
    
    return (
      <div className="modal-overlay" onClick={closeDetailModal}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>스케줄 상세 정보</h2>
            <button className="close-button" onClick={closeDetailModal}>×</button>
          </div>
          
          {!editMode ? (
            <div className="modal-body">
              <div className="detail-row">
                <label>운행 날짜:</label>
                <span>{formatDate(selectedSchedule.date)}</span>
              </div>
              <div className="detail-row">
                <label>버스 번호:</label>
                <span>{getBusNumber(selectedSchedule.busId)} ({getBusCompany(selectedSchedule.busId)})</span>
              </div>
              <div className="detail-row">
                <label>노선:</label>
                <span>{getRouteName(selectedSchedule.routeId)}</span>
              </div>
              <div className="detail-row">
                <label>노선 운행 시간:</label>
                <span>{getRouteOperationHours(selectedSchedule.routeId)}</span>
              </div>
              <div className="detail-row">
                <label>버스 기사:</label>
                <span>{getDriverName(selectedSchedule.driverId)} ({getDriverNumber(selectedSchedule.driverId)})</span>
              </div>
              <div className="detail-row">
                <label>운행 시작 시간:</label>
                <span>{selectedSchedule.startTime}</span>
              </div>
              <div className="detail-row">
                <label>운행 종료 시간:</label>
                <span>{selectedSchedule.endTime}</span>
              </div>
              
              {selectedSchedule.isRepeating && (
                <>
                  <div className="detail-row">
                    <label>반복 일정:</label>
                    <span>예</span>
                  </div>
                  <div className="detail-row">
                    <label>반복 요일:</label>
                    <span>
                      {selectedSchedule.repeatDays.length > 0 
                        ? selectedSchedule.repeatDays.map(day => getWeekdayNameFromIndex(day)).join(', ') 
                        : '없음'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <label>반복 종료일:</label>
                    <span>{selectedSchedule.repeatEndDate ? formatDate(selectedSchedule.repeatEndDate) : '없음'}</span>
                  </div>
                </>
              )}
              
              {/* 경고 표시 */}
              {!isWithinRouteOperationHours(selectedSchedule.routeId, selectedSchedule.startTime, selectedSchedule.endTime) && (
                <div className="warning-box">
                  <strong>⚠️ 주의:</strong> 이 스케줄은 노선의 운행 가능 시간({getRouteOperationHours(selectedSchedule.routeId)}) 외에 설정되어 있습니다.
                </div>
              )}
              
              <div className="modal-actions">
                <button className="edit-button" onClick={handleEditClick}>수정</button>
                <button 
                  className="delete-button"
                  onClick={() => handleDeleteSchedule(selectedSchedule.id)}
                >
                  삭제
                </button>
                <button 
                  className="copy-button"
                  onClick={() => {
                    closeDetailModal();
                    handleOpenCopyModal(selectedSchedule.id);
                  }}
                >
                  복사
                </button>
              </div>
            </div>
          ) : (
            <div className="modal-body">
              <form onSubmit={handleUpdateSchedule}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-date">운행 날짜</label>
                    <input 
                      type="date" 
                      id="edit-date" 
                      name="date" 
                      value={editSchedule.date} 
                      onChange={handleEditDateChange} 
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="edit-driverId">버스 기사</label>
                    <select 
                      id="edit-driverId" 
                      name="driverId" 
                      value={editSchedule.driverId} 
                      onChange={handleEditInputChange} 
                      required
                    >
                      <option value="">기사 선택</option>
                      {drivers.map(driver => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name} ({driver.driverNumber})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-busId">버스</label>
                    <select 
                      id="edit-busId" 
                      name="busId" 
                      value={editSchedule.busId} 
                      onChange={handleEditInputChange} 
                      required
                    >
                      <option value="">버스 선택</option>
                      {buses.map(bus => (
                        <option key={bus.id} value={bus.id}>
                          {bus.number} ({bus.company})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="edit-routeId">노선</label>
                    <select 
                      id="edit-routeId" 
                      name="routeId" 
                      value={editSchedule.routeId} 
                      onChange={handleEditInputChange} 
                      required
                    >
                      <option value="">노선 선택</option>
                      {routes.map(route => (
                        <option key={route.id} value={route.id}>
                          {route.name} ({route.operationStartTime}-{route.operationEndTime})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-startTime">운행 시작 시간</label>
                    <input 
                      type="time" 
                      id="edit-startTime" 
                      name="startTime" 
                      value={editSchedule.startTime} 
                      onChange={handleEditInputChange} 
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="edit-endTime">운행 종료 시간</label>
                    <input 
                      type="time" 
                      id="edit-endTime" 
                      name="endTime" 
                      value={editSchedule.endTime} 
                      onChange={handleEditInputChange} 
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group checkbox-group">
                    <input
                      type="checkbox"
                      id="edit-isRepeating"
                      name="isRepeating"
                      checked={editSchedule.isRepeating}
                      onChange={handleEditInputChange}
                    />
                    <label htmlFor="edit-isRepeating">반복 일정</label>
                  </div>
                </div>
                
                {editSchedule.isRepeating && (
                  <>
                    <div className="form-group">
                      <label>반복 요일</label>
                      <div className="weekday-selector">
                        {weekdays.map((day, index) => (
                          <div key={index} className="weekday-checkbox">
                            <input
                              type="checkbox"
                              id={`edit-day-${index}`}
                              checked={editSchedule.repeatDays.includes(index)}
                              onChange={() => handleEditDayCheckbox(index)}
                            />
                            <label htmlFor={`edit-day-${index}`}>{day}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="edit-repeatEndDate">반복 종료일</label>
                      <input 
                        type="date" 
                        id="edit-repeatEndDate" 
                        name="repeatEndDate" 
                        value={editSchedule.repeatEndDate || ''} 
                        onChange={handleEditDateChange}
                        min={editSchedule.date}
                        required={editSchedule.isRepeating}
                      />
                    </div>
                  </>
                )}
                
                {/* 경고 표시 */}
                {editSchedule.routeId && !isWithinRouteOperationHours(
                  editSchedule.routeId, 
                  editSchedule.startTime, 
                  editSchedule.endTime
                ) && (
                  <div className="warning-box">
                    <strong>⚠️ 주의:</strong> 선택한 시간이 노선의 운행 가능 시간을 벗어납니다.
                  </div>
                )}
                
                <div className="form-actions">
                  <button type="submit" className="save-button">저장</button>
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={() => {
                      setEditMode(false);
                      setEditSchedule(null);
                    }}
                  >
                    취소
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // 로딩 인디케이터
  const renderLoader = () => {
    if (!loading) return null;
    
    return (
      <div className="loader-overlay">
        <div className="loader">
          <div className="spinner"></div>
          <p>처리 중...</p>
        </div>
      </div>
    );
  };
  
  // 에러 메시지
  const renderError = () => {
    if (!error) return null;
    
    return (
      <div className="error-message">
        <p>{error}</p>
        <button onClick={fetchSchedules}>다시 시도</button>
      </div>
    );
  };
  
  return (
    <div className="bus-schedule">
      <h1>버스 기사 배치표</h1>
      
      {renderError()}
      
      <div className="schedule-controls">
        <div className="view-selector">
          <button 
            className={viewType === 'weekly' ? 'active' : ''}
            onClick={() => setViewType('weekly')}
          >
            주간 보기
          </button>
          <button 
            className={viewType === 'monthly' ? 'active' : ''}
            onClick={() => setViewType('monthly')}
          >
            월간 보기
          </button>
        </div>
        
        <div className="date-selector">
          {viewType === 'weekly' ? (
            <div className="week-selector">
              <label>주간 선택:</label>
              <input 
                type="date" 
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
              />
            </div>
          ) : (
            <div className="month-selector">
              <label>월 선택:</label>
              <input 
                type="month" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
          )}
        </div>
        
        <div className="action-buttons">
          <button 
            className="add-schedule-button"
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={loading}
          >
            {showAddForm ? '취소' : '+ 스케줄 추가'}
          </button>
          <button 
            className="refresh-button"
            onClick={fetchSchedules}
            disabled={loading}
          >
            🔄 새로고침
          </button>
        </div>
      </div>
      
      {showAddForm && (
        <div className="add-schedule-form">
          <h2>새 스케줄 추가</h2>
          <form onSubmit={handleAddSchedule}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="date">운행 날짜</label>
                <input 
                  type="date" 
                  id="date" 
                  name="date" 
                  value={newSchedule.date} 
                  onChange={handleDateChange} 
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="driverId">버스 기사</label>
                <select id="driverId" name="driverId" value={newSchedule.driverId} onChange={handleInputChange} required>
                  <option value="">기사 선택</option>
                  {drivers.map(driver => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} ({driver.driverNumber})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="busId">버스</label>
                <select id="busId" name="busId" value={newSchedule.busId} onChange={handleInputChange} required>
                  <option value="">버스 선택</option>
                  {buses.map(bus => (
                    <option key={bus.id} value={bus.id}>
                      {bus.number} ({bus.company})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="routeId">노선</label>
                <select id="routeId" name="routeId" value={newSchedule.routeId} onChange={handleInputChange} required>
                  <option value="">노선 선택</option>
                  {routes.map(route => (
                    <option key={route.id} value={route.id}>
                      {route.name} ({route.operationStartTime}-{route.operationEndTime})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startTime">운행 시작 시간</label>
                <input 
                  type="time" 
                  id="startTime" 
                  name="startTime" 
                  value={newSchedule.startTime} 
                  onChange={handleInputChange} 
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="endTime">운행 종료 시간</label>
                <input 
                  type="time" 
                  id="endTime" 
                  name="endTime" 
                  value={newSchedule.endTime} 
                  onChange={handleInputChange} 
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="isRepeating"
                  name="isRepeating"
                  checked={newSchedule.isRepeating}
                  onChange={handleInputChange}
                />
                <label htmlFor="isRepeating">반복 일정</label>
              </div>
            </div>
            
            {newSchedule.isRepeating && (
              <>
                <div className="form-group">
                  <label>반복 요일</label>
                  <div className="weekday-selector">
                    {weekdays.map((day, index) => (
                      <div key={index} className="weekday-checkbox">
                        <input
                          type="checkbox"
                          id={`day-${index}`}
                          checked={newSchedule.repeatDays.includes(index)}
                          onChange={() => handleDayCheckbox(index)}
                        />
                        <label htmlFor={`day-${index}`}>{day}</label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="repeatEndDate">반복 종료일</label>
                  <input 
                    type="date" 
                    id="repeatEndDate" 
                    name="repeatEndDate" 
                    value={newSchedule.repeatEndDate || ''} 
                    onChange={handleDateChange}
                    min={newSchedule.date}
                    required={newSchedule.isRepeating}
                  />
                </div>
              </>
            )}
            
            {/* 경고 표시 */}
            {newSchedule.routeId && !isWithinRouteOperationHours(
              newSchedule.routeId, 
              newSchedule.startTime, 
              newSchedule.endTime
            ) && (
              <div className="warning-box">
                <strong>⚠️ 주의:</strong> 선택한 시간이 노선의 운행 가능 시간을 벗어납니다.
              </div>
            )}
            
            <div className="form-actions">
              <button type="submit" className="save-button" disabled={loading}>추가</button>
              <button 
                type="button" 
                className="cancel-button"
                onClick={() => setShowAddForm(false)}
                disabled={loading}
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="schedule-container">
        {loading ? (
          <div className="loading-placeholder">
            <p>데이터 로딩 중...</p>
          </div>
        ) : (
          viewType === 'weekly' ? renderWeeklySchedule() : renderMonthlySchedule()
        )}
      </div>
      
      {renderDetailModal()}
      {renderCopyModal()}
      {renderLoader()}
    </div>
  );
}

export default BusSchedule;