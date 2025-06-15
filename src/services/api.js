// services/api.js (토큰 인증 추가)
import { Cookies } from 'react-cookie';

const API_BASE_URL = 'http://devse.kr:12589/api';
const cookies = new Cookies();

/**
 * API 서비스
 * 인증 및 MongoDB와의 통신을 담당하는 통합 서비스 레이어
 */
class ApiService {
  // ==================== 인증 관련 메서드 ====================
  /**
   * 로그인 요청
   * @param {string} organizationId 조직 ID
   * @param {string} password 비밀번호
   * @returns {Promise<Object>} 로그인 결과
   */
  static async login(organizationId, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/staff/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          password,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`로그인 실패: ${response.status}`);
      }
      
      const responseData = await response.json();
      // 응답 구조가 { data: {...}, message: '...' } 형태임
      const { data, message } = responseData;
      
      // 토큰 저장
      if (data && data.token) {
        ApiService.saveToken(data.token);
      }
      
      return responseData;
    } catch (error) {
      console.error('로그인 요청 실패:', error);
      throw error;
    }
  }
  
  /**
   * 토큰 저장
   * @param {string} token JWT 토큰
   */
  static saveToken(token) {
    cookies.set('auth_token', token, {
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30일
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
  }
  
  /**
 * 로그아웃 - 모든 쿠키 및 세션 데이터 삭제
 * @returns {boolean} 로그아웃 성공 여부
 */
static logout() {
  try {
    // 1. 쿠키 삭제
    // 1.1. 기존 auth_token 쿠키 삭제
    cookies.remove('auth_token', { path: '/' });
    
    // 1.2. 모든 쿠키 삭제
    const allCookies = cookies.getAll();
    console.log('삭제할 쿠키 목록:', allCookies);
    
    Object.keys(allCookies).forEach(cookieName => {
      console.log(`쿠키 삭제: ${cookieName}`);
      // 다양한 경로에 설정된 쿠키도 삭제
      cookies.remove(cookieName, { path: '/' });
      cookies.remove(cookieName, { path: '/dashboard' });
      cookies.remove(cookieName, { path: '/admin' });
      cookies.remove(cookieName);
    });
    
    // 2. 브라우저 저장소 삭제
    // 2.1. 로컬 스토리지 데이터 삭제
    localStorage.clear();
    
    // 2.2. 세션 스토리지 데이터 삭제
    sessionStorage.clear();
    
    console.log('모든 인증 데이터가 삭제되었습니다.');
    return true;
  } catch (error) {
    console.error('로그아웃 중 오류 발생:', error);
    // 오류가 발생해도 사용자는 로그아웃되어야 함
    return true;
  }
}
  
  /**
   * 토큰 가져오기
   * @returns {string|null} 저장된 토큰
   */
  static getToken() {
    return cookies.get('auth_token');
  }
  
  /**
   * 인증 헤더 생성
   * @returns {Object} 인증 헤더
   */
  static getAuthHeader() {
    const token = ApiService.getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }
  
  /**
   * 로그인 여부 확인
   * @returns {boolean} 로그인 여부
   */
  static isLoggedIn() {
    return !!ApiService.getToken();
  }
  
  // ==================== API 요청 공통 메서드 ====================
  /**
   * API 요청 메서드
   * @param {string} endpoint API 엔드포인트
   * @param {string} method HTTP 메서드
   * @param {Object} data 요청 데이터
   * @param {boolean} auth 인증 헤더 사용 여부
   * @returns {Promise<Object>} API 응답
   */
  static async apiRequest(endpoint, method = 'GET', data = null, auth = true) {
    try {
      const url = `${API_BASE_URL}/${endpoint}`;
      
      // 항상 인증 헤더 포함
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // 토큰이 있으면 Authorization 헤더 추가
      const token = ApiService.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else if (auth) {
        // 토큰이 필요한데 없는 경우
        console.warn('인증 토큰이 필요하지만 찾을 수 없습니다.');
      }
      
      const options = {
        method,
        headers,
      };
      
      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
        options.body = JSON.stringify(data);
      }
      
      console.log(`API 요청: ${method} ${url}`, options);
      
      let response = await fetch(url, options);
      
      // 인증 오류 (401 Unauthorized)
      if (response.status === 401 && auth) {
        console.error('인증 오류: 토큰이 만료되었거나, 유효하지 않습니다.');
        // 토큰이 만료되었으므로 로그아웃 처리
        ApiService.logout();
        throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
      }
      
      if (!response.ok) {
        console.error(`API 요청 실패: ${response.status}`);
        const errorText = await response.text();
        console.error('오류 응답:', errorText);
        throw new Error(`API 요청 실패: ${response.status} - ${errorText}`);
      }
      
      const responseData = await response.json();
      console.log(`API 응답: ${method} ${url}`, responseData);
      return responseData;
    } catch (error) {
      console.error(`${endpoint} API 요청 실패:`, error);
      throw error;
    }
  }
  
  // ==================== 버스 기사 배치표 관련 메서드 ====================
  /**
   * 모든 버스 기사 배치표 조회
   * @returns {Promise<Array>} 버스 기사 배치표 목록
   */
  static async getAllOperationPlans() {
    const data = await ApiService.apiRequest('operationplan');
    return data;
  }
  
  /**
   * 단일 버스 기사 배치표 조회
   * @param {string} operationPlanID 조회할 배치표 ID
   * @returns {Promise<Object>} 버스 기사 배치표
   */
  static async getOperationPlan(operationPlanID) {
    const data = await ApiService.apiRequest(`operationplan?operationPlanID=${operationPlanID}`);
    return data;
  }
  
  /**
 * 버스 기사 배치표 추가
 * @param {Object} operationPlanData 추가할 배치표 데이터
 * @returns {Promise<Object>} 추가된 배치표 정보
 */
static async addOperationPlan(operationPlanData) {
  try {
    console.log('운행 일정 추가 요청 (원본):', operationPlanData);
    
    // 필수 데이터 검증
    if (!operationPlanData.busNumber) {
      throw new Error('버스 번호가 필요합니다.');
    }
    if (!operationPlanData.driverId) {
      throw new Error('기사 ID가 필요합니다.');
    }
    if (!operationPlanData.operationDate) {
      throw new Error('운행 날짜가 필요합니다.');
    }
    
    // busId 검증 - MongoDB ObjectId 형식인지 확인
    let validBusId = operationPlanData.busId;
    
    // busId가 없거나 유효하지 않은 경우 빈 문자열로 처리
    if (!validBusId) {
      console.log('⚠️ busId가 제공되지 않았습니다.');
      validBusId = '';
    } else if (!/^[0-9a-fA-F]{24}$/.test(validBusId)) {
      console.warn(`⚠️ busId가 MongoDB ObjectId 형식이 아닙니다: ${validBusId}`);
      validBusId = '';
    } else {
      console.log('✅ 유효한 busId:', validBusId);
    }
    
    // 요청 데이터를 백엔드 DTO 형식에 맞게 변환
    const requestData = {
      busId: validBusId, // 검증된 busId 사용
      busNumber: operationPlanData.busNumber || '', // 버스 번호
      driverId: String(operationPlanData.driverId), // 문자열로 변환
      routeId: operationPlanData.routeId ? String(operationPlanData.routeId) : '', // 노선 ID
      operationDate: operationPlanData.operationDate, // YYYY-MM-DD 형식
      startTime: operationPlanData.startTime || '08:00', // HH:MM 형식
      endTime: operationPlanData.endTime || '17:00', // HH:MM 형식
      isRecurring: Boolean(operationPlanData.isRecurring), // 불린 값으로 변환
      recurringWeeks: operationPlanData.recurringWeeks || null
    };
    
    console.log('최종 요청 데이터:', requestData);
    console.log('특히 busId:', requestData.busId || '빈 값');
    console.log('특히 busNumber:', requestData.busNumber);
    
    const response = await ApiService.apiRequest('operation-plan', 'POST', requestData);
    return response;
  } catch (error) {
    console.error('운행 일정 추가 실패:', error);
    throw error;
  }
}

/**
 * 운행 일정 수정 - 데이터 검증 강화
 */
static async updateOperationPlan(operationPlanData) {
  try {
    console.log('운행 일정 수정 요청 (원본):', operationPlanData);
    
    // 필수 데이터 검증
    if (!operationPlanData.id) {
      throw new Error('운행 일정 ID가 필요합니다.');
    }
    
    // busId 검증 - MongoDB ObjectId 형식인지 확인
    let validBusId = operationPlanData.busId;
    
    // busId가 없거나 유효하지 않은 경우 빈 문자열로 처리
    if (!validBusId) {
      console.log('⚠️ busId가 제공되지 않았습니다.');
      validBusId = '';
    } else if (!/^[0-9a-fA-F]{24}$/.test(validBusId)) {
      console.warn(`⚠️ busId가 MongoDB ObjectId 형식이 아닙니다: ${validBusId}`);
      validBusId = '';
    } else {
      console.log('✅ 유효한 busId:', validBusId);
    }
    
    // 요청 데이터를 백엔드 DTO 형식에 맞게 변환
    const requestData = {
      id: String(operationPlanData.id),
      busId: validBusId, // 검증된 busId 사용
      busNumber: operationPlanData.busNumber || '',
      driverId: String(operationPlanData.driverId),
      routeId: operationPlanData.routeId ? String(operationPlanData.routeId) : '',
      operationDate: operationPlanData.operationDate, // YYYY-MM-DD 형식
      startTime: operationPlanData.startTime || '08:00', // HH:MM 형식
      endTime: operationPlanData.endTime || '17:00', // HH:MM 형식
      status: operationPlanData.status || 'SCHEDULED'
    };
    
    console.log('최종 수정 요청 데이터:', requestData);
    console.log('특히 busId:', requestData.busId || '빈 값');
    console.log('특히 busNumber:', requestData.busNumber);
    
    const response = await ApiService.apiRequest('operation-plan', 'PUT', requestData);
    return response;
  } catch (error) {
    console.error('운행 일정 수정 실패:', error);
    throw error;
  }
}
  
  /**
   * 버스 기사 배치표 수정
   * @param {Object} operationPlanData 수정할 배치표 데이터
   * @returns {Promise<Object>} 수정된 배치표 정보
   */
  static async updateOperationPlan(operationPlanData) {
    const data = await ApiService.apiRequest('operationplan', 'PUT', operationPlanData);
    return data;
  }
  
  /**
   * 버스 기사 배치표 삭제
   * @param {string} operationPlanID 삭제할 배치표 ID
   * @returns {Promise<Object>} 삭제 결과
   */
  static async deleteOperationPlan(operationPlanID) {
    const data = await ApiService.apiRequest('operationplan', 'DELETE', { operationPlanID });
    return data;
  }
  
  // ==================== 정류장 관련 메서드 ====================
  /**
   * 모든 정류장 조회
   * @returns {Promise<Array>} 정류장 목록
   */
  static async getAllStations() {
    const data = await ApiService.apiRequest('station');
    return data;
  }
  
  /**
   * 정류장 이름으로 검색
   * @param {string} name 검색할 정류장 이름
   * @returns {Promise<Array>} 검색된 정류장 목록
   */
  static async searchStationsByName(name) {
    const data = await ApiService.apiRequest(`station?name=${name}`);
    return data;
  }
  
  /**
   * 단일 정류장 조회
   * @param {string} stationId 조회할 정류장 ID
   * @returns {Promise<Object>} 정류장 정보
   */
  static async getStation(stationId) {
    const data = await ApiService.apiRequest(`station/${stationId}`);
    return data;
  }
  
  /**
   * 정류장 추가
   * @param {Object} stationData 추가할 정류장 데이터
   * @returns {Promise<Object>} 추가된 정류장 정보
   */
  static async addStation(stationData) {
  try {
    // 서버가 요구하는 형식: { name: string, latitude: number, longitude: number }
    const requestData = {
      name: stationData.name,
      latitude: stationData.location.coordinates[0], // 위도
      longitude: stationData.location.coordinates[1] // 경도
    };
    
    console.log('정류장 등록 요청 데이터:', requestData);
    
    const data = await ApiService.apiRequest('station', 'POST', requestData);
    return data;
  } catch (error) {
    console.error('정류장 등록 실패:', error);
    throw error;
  }
}
  
  /**
   * 정류장 수정
   * @param {string} stationId 수정할 정류장 ID
   * @param {Object} stationData 수정할 정류장 데이터
   * @returns {Promise<Object>} 수정된 정류장 정보
   */
  static async updateStation(stationId, stationData) {
  try {
    // 서버가 요구하는 형식: { name: string, latitude: number, longitude: number }
    const requestData = {
      name: stationData.name,
      latitude: stationData.location.coordinates[0], // 위도
      longitude: stationData.location.coordinates[1] // 경도
    };
    
    console.log('정류장 수정 요청 데이터:', requestData);
    
    const data = await ApiService.apiRequest(`station/${stationId}`, 'PUT', requestData);
    return data;
  } catch (error) {
    console.error('정류장 수정 실패:', error);
    throw error;
  }
}
  
  /**
   * 정류장 삭제
   * @param {string} stationId 삭제할 정류장 ID
   * @returns {Promise<Object>} 삭제 결과
   */
  static async deleteStation(stationId) {
    const data = await ApiService.apiRequest(`station/${stationId}`, 'DELETE');
    return data;
  }
  
  // ==================== 유틸리티 메서드 ====================
  /**
   * 날짜 형식 변환 (YYYY-MM-DD 형식으로 변환)
   * @param {Date} date 변환할 날짜 객체
   * @returns {string} YYYY-MM-DD 형식의 문자열
   */
  static formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  /**
   * 시간 범위 형식 변환 (시작 시간 - 종료 시간 형식)
   * @param {string} startTime 시작 시간 (HH:MM 형식)
   * @param {string} endTime 종료 시간 (HH:MM 형식)
   * @returns {string} 시간 범위 문자열
   */
  static formatTimeRange(startTime, endTime) {
    return `${startTime}-${endTime}`;
  }
  
/**
   * MongoDB 데이터를 앱 형식으로 변환
   * @param {Object|Array} serverData 서버 응답 데이터
   * @returns {Array} 앱 형식의 데이터 배열
   */
static convertToAppFormat(serverData) {
  // 서버 응답 데이터가 배열인지 확인
  const dataArray = Array.isArray(serverData) ? serverData : [serverData];
  
  return dataArray.map(item => {
    // MongoDB의 날짜 형식을 JS Date 객체로 변환
    const startDate = new Date(item.operationStart.$date);
    const endDate = new Date(item.operationEnd.$date);
    
    // 시작 및 종료 시간 추출 (HH:MM 형식)
    const startTime = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
    const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
    
    return {
      id: item._id.$oid, // MongoDB의 ObjectId를 id로 사용
      driverId: item.driverId, // DBRef를 그대로 사용
      busId: item.busId, // DBRef를 그대로 사용
      routeId: item.routeId, // DBRef를 그대로 사용
      date: ApiService.formatDate(startDate), // 날짜만 추출
      startTime,
      endTime,
      isRepeating: item.isRepeating || false, // 서버 데이터에 없는 경우 기본값
      repeatDays: item.repeatDays || [], // 서버 데이터에 없는 경우 기본값
      repeatEndDate: item.repeatEndDate ? ApiService.formatDate(new Date(item.repeatEndDate.$date)) : null // 서버 데이터에 없는 경우 기본값
    };
  });
}

/**
 * 앱 형식을 MongoDB 형식으로 변환
 * @param {Object} appData 앱 형식 데이터
 * @param {Array} drivers 기사 목록
 * @param {Array} buses 버스 목록
 * @param {Array} routes 노선 목록
 * @returns {Object} 서버 요청 형식 데이터
 */
static convertToServerFormat(appData, drivers, buses, routes) {
  // driverId, busId, routeId를 이름으로 변환
  const driver = drivers.find(d => d.id === appData.driverId);
  const bus = buses.find(b => b.id === appData.busId);
  const route = routes.find(r => r.id === appData.routeId);
  
  // 시작 시간과 종료 시간을 Date 객체로 변환
  const [startHours, startMinutes] = appData.startTime.split(':').map(Number);
  const [endHours, endMinutes] = appData.endTime.split(':').map(Number);
  
  const operationDate = new Date(appData.date);
  operationDate.setHours(0, 0, 0, 0); // 날짜만 설정
  
  const operationStartDate = new Date(operationDate);
  operationStartDate.setHours(startHours, startMinutes, 0, 0);
  
  const operationEndDate = new Date(operationDate);
  // 종료 시간이 시작 시간보다 이른 경우 다음 날로 설정
  if (endHours < startHours || (endHours === startHours && endMinutes < startMinutes)) {
    operationEndDate.setDate(operationEndDate.getDate() + 1);
  }
  operationEndDate.setHours(endHours, endMinutes, 0, 0);
  
  // 시간 범위 문자열 생성
  const operationTime = `${appData.startTime}-${appData.endTime}`;
  
  // 반환할 데이터 객체
  const serverData = {
    driverName: driver ? driver.name : '',
    busNumber: bus ? bus.number : '',
    routeName: route ? route.name : '',
    operationDate: ApiService.formatDate(operationDate),
    operationTime
  };
  
  // ID가 있는 경우 (수정, 삭제용)
  if (appData.id) {
    serverData.operationPlanID = appData.id;
  }
  
  return serverData;
}
// api.js에 추가할 버스 관련 메서드
  
// ==================== 버스 관련 메서드 (실제 서버 구조 기반) ====================

/**
 * 모든 버스 조회 - 실제 서버 응답 구조에 맞게 수정
 * @returns {Promise<Array>} 버스 목록
 */
/**
 * 모든 버스 조회 - 일관된 응답 구조로 수정
 * @returns {Promise<Object>} 버스 목록이 담긴 응답 객체
 */
static async getAllBuses() {
  try {
    const response = await ApiService.apiRequest('bus');
    console.log('===== 버스 API 원본 응답 =====');
    console.log(response);
    console.log('===========================');
    
    let busData = [];
    
    // 다양한 응답 구조 처리
    if (response) {
      // 케이스 1: response.data가 배열인 경우
      if (response.data && Array.isArray(response.data)) {
        console.log('케이스 1: response.data 배열');
        busData = response.data;
      }
      // 케이스 2: response 자체가 배열인 경우
      else if (Array.isArray(response)) {
        console.log('케이스 2: response 자체가 배열');
        busData = response;
      }
      // 케이스 3: response가 단일 객체인 경우
      else if (response.busNumber || response.id) {
        console.log('케이스 3: response 단일 객체');
        busData = [response];
      }
    }
    
    // 실제 서버 응답 구조 그대로 사용 (최소한의 정규화만)
    const normalizedBuses = busData.map(bus => {
      const normalizedBus = {
        // 기본 식별자
        id: bus.busId || bus.id || bus.busNumber,
        busNumber: bus.busNumber, // 서버 필드명 그대로
        busRealNumber: bus.busRealNumber, // 서버 필드명 그대로
        
        // 노선 정보
        routeName: bus.routeName, // 서버에서 직접 제공
        routeId: bus.routeId, // 수정 시 필요
        
        // 좌석 정보
        totalSeats: Number(bus.totalSeats || 45),
        availableSeats: Number(bus.availableSeats || bus.totalSeats || 45),
        occupiedSeats: Number(bus.occupiedSeats || 0),
        
        // 운행 상태 정보 (서버 필드명 그대로)
        operate: Boolean(bus.operate), // 현재 운행중 여부
        currentStationIndex: bus.currentStationIndex || 0,
        currentStationName: bus.currentStationName || '알 수 없음',
        totalStations: bus.totalStations || 0,
        
        // 위치 정보
        latitude: bus.latitude || null,
        longitude: bus.longitude || null,
        
        // 시스템 정보 (상세보기에서만 사용)
        lastUpdateTime: bus.lastUpdateTime,
        organizationId: bus.organizationId, // 조직명 변환에 사용
        
        // 추가 메타데이터
        createdAt: bus.createdAt || bus.created_at,
        updatedAt: bus.updatedAt || bus.updated_at
      };
      
      console.log('정규화된 버스 데이터:', normalizedBus);
      return normalizedBus;
    });
    
    console.log(`총 ${normalizedBuses.length}개의 버스 데이터 처리 완료`);
    
    // 일관된 응답 구조로 반환 (다른 API들과 동일한 형태)
    return {
      data: normalizedBuses,
      message: response.message || '버스 목록을 가져왔습니다.'
    };
  } catch (error) {
    console.error('버스 조회 실패:', error);
    throw error;
  }
}

/**
 * 버스 추가 - 실제 서버 스펙에 맞게 수정 (busRealNumber, routeId, totalSeats)
 * @param {Object} busData 추가할 버스 데이터
 * @returns {Promise<Object>} 추가된 버스 정보
 */
static async addBus(busData) {
  try {
    console.log('===== 버스 추가 요청 시작 =====');
    console.log('원본 데이터:', busData);
    
    // 필수 데이터 검증
    if (!busData.busRealNumber) {
      throw new Error('실제 버스 번호를 입력해주세요.');
    }
    if (!busData.routeId) {
      throw new Error('노선을 선택해주세요.');
    }
    if (!busData.totalSeats || busData.totalSeats <= 0) {
      throw new Error('올바른 좌석 수를 입력해주세요.');
    }
    
    // 실제 서버 API 스펙에 맞는 요청 데이터 구성
    const requestData = {
      busRealNumber: String(busData.busRealNumber), // 실제 버스 번호 (필수)
      routeId: String(busData.routeId), // 노선 ID (필수)
      totalSeats: Number(busData.totalSeats) // 좌석 수 (필수)
      // operate, lastUpdateTime, organizationId, busNumber 등은 서버에서 자동 생성/관리
    };
    
    console.log('최종 요청 데이터:', requestData);
    
    const response = await ApiService.apiRequest('bus', 'POST', requestData);
    console.log('서버 응답:', response);
    
    // 응답 처리
    if (response) {
      const result = {
        success: true,
        busNumber: response.data || response.busNumber || response.id,
        message: response.message || '버스가 성공적으로 등록되었습니다.',
        fullResponse: response
      };
      
      console.log('처리된 결과:', result);
      console.log('===== 버스 추가 요청 완료 =====');
      
      return result;
    }
    
    throw new Error('서버 응답이 올바르지 않습니다.');
    
  } catch (error) {
    console.error('===== 버스 추가 실패 =====');
    console.error('오류:', error);
    throw error;
  }
}

/**
 * 버스 수정 - 실제 서버 스펙에 맞게 수정 (busNumber, busRealNumber, routeId, totalSeats)
 * @param {Object} busData 수정할 버스 데이터
 * @returns {Promise<Object>} 수정된 버스 정보
 */
static async updateBus(busData) {
  try {
    console.log('===== 버스 수정 요청 시작 =====');
    console.log('원본 데이터:', busData);
    
    // 필수 데이터 검증
    if (!busData.busNumber) {
      throw new Error('버스 번호가 필요합니다.');
    }
    if (!busData.busRealNumber) {
      throw new Error('실제 버스 번호를 입력해주세요.');
    }
    if (!busData.routeId) {
      throw new Error('노선을 선택해주세요.');
    }
    if (!busData.totalSeats || busData.totalSeats <= 0) {
      throw new Error('올바른 좌석 수를 입력해주세요.');
    }
    
    // 실제 서버 API 스펙에 맞는 요청 데이터 구성
    const requestData = {
      busNumber: String(busData.busNumber), // 버스 식별자 (필수, 변경 불가)
      busRealNumber: String(busData.busRealNumber), // 실제 버스 번호 (수정 가능)
      routeId: String(busData.routeId), // 노선 정보 (수정 가능)
      totalSeats: Number(busData.totalSeats) // 좌석 정보 (수정 가능)
      // operate, lastUpdateTime, organizationId 등은 서버에서 자동 관리
    };
    
    console.log('최종 요청 데이터:', requestData);
    
    const response = await ApiService.apiRequest('bus', 'PUT', requestData);
    console.log('서버 응답:', response);
    
    // 응답 처리
    if (response) {
      const result = {
        success: true,
        message: response.message || '버스 정보가 성공적으로 수정되었습니다.',
        updatedBus: {
          busNumber: busData.busNumber,
          ...requestData
        },
        fullResponse: response
      };
      
      console.log('처리된 결과:', result);
      console.log('===== 버스 수정 요청 완료 =====');
      
      return result;
    }
    
    throw new Error('서버 응답이 올바르지 않습니다.');
    
  } catch (error) {
    console.error('===== 버스 수정 실패 =====');
    console.error('오류:', error);
    throw error;
  }
}

/**
 * 특정 버스 조회 - 완전한 정보 포함
 * @param {string} busNumber 조회할 버스 번호
 * @returns {Promise<Object>} 버스 정보
 */
static async getBus(busNumber) {
  try {
    console.log(`버스 상세 조회: ${busNumber}`);
    const response = await ApiService.apiRequest(`bus/${busNumber}`);
    
    // 단일 버스 데이터도 동일한 방식으로 정규화
    if (response) {
      const bus = response.data || response;
      return {
        id: bus.id || bus._id || bus.busNumber,
        busNumber: bus.busNumber,
        busRealNumber: bus.busRealNumber,
        routeId: bus.routeId,
        routeName: bus.routeName,
        totalSeats: Number(bus.totalSeats || 45),
        availableSeats: Number(bus.availableSeats || bus.totalSeats || 45),
        occupiedSeats: Number(bus.occupiedSeats || 0),
        operate: Boolean(bus.operate),
        currentStationIndex: bus.currentStationIndex || 0,
        currentStationName: bus.currentStationName || '알 수 없음',
        totalStations: bus.totalStations || 0,
        latitude: bus.latitude || null,
        longitude: bus.longitude || null,
        lastUpdateTime: bus.lastUpdateTime,
        organizationId: bus.organizationId,
        createdAt: bus.createdAt,
        updatedAt: bus.updatedAt
      };
    }
    
    return null;
  } catch (error) {
    console.error(`버스 ${busNumber} 조회 실패:`, error);
    throw error;
  }
}

/**
 * 버스 삭제 - 로깅 개선
 * @param {string} busNumber 삭제할 버스 번호
 * @returns {Promise<Object>} 삭제 결과
 */
static async deleteBus(busNumber) {
  try {
    console.log(`===== 버스 삭제 요청: ${busNumber} =====`);
    const response = await ApiService.apiRequest(`bus/${busNumber}`, 'DELETE');
    console.log('삭제 응답:', response);
    console.log('===== 버스 삭제 완료 =====');
    return response;
  } catch (error) {
    console.error(`===== 버스 ${busNumber} 삭제 실패 =====`);
    console.error('오류:', error);
    throw error;
  }
}

/**
 * 디버깅을 위한 데이터 검증 헬퍼 메서드
 */
static validateBusData(busData) {
  const issues = [];
  
  if (!busData.busNumber) issues.push('버스 번호가 없습니다');
  if (!busData.totalSeats) issues.push('좌석 수가 없습니다');
  if (!busData.routeName && !busData.routeId) issues.push('노선 정보가 없습니다');
  
  if (issues.length > 0) {
    console.warn('버스 데이터 문제:', issues, busData);
  }
  
  return issues.length === 0;
}




  // ==================== 노선 관련 메서드 ====================
  /**
 * 모든 노선 조회 - 응답 데이터 구조 개선
 * @returns {Promise<Array>} 노선 목록
 */
static async getAllRoutes() {
  try {
    const response = await ApiService.apiRequest('routes');
    console.log('원본 노선 API 응답:', response);
    
    if (response && response.data) {
      // 노선 데이터 정규화
      const normalizedRoutes = response.data.map(route => {
        const routeData = {
          id: route.id || route._id, // 노선 ID
          routeName: route.routeName || route.name || route.title, // 노선명
          stations: route.stations || [] // 정류장 목록
        };
        
        console.log('정규화된 노선 데이터:', routeData);
        return routeData;
      });
      
      return {
        data: normalizedRoutes,
        message: response.message || '노선 목록을 가져왔습니다.'
      };
    }
    
    return { data: [], message: '노선 데이터가 없습니다.' };
  } catch (error) {
    console.error('노선 조회 실패:', error);
    throw error;
  }
}
  
  /**
   * 노선명으로 노선 검색
   * @param {string} name 검색할 노선명
   * @returns {Promise<Array>} 검색된 노선 목록
   */
  static async searchRoutesByName(name) {
    const data = await ApiService.apiRequest(`routes?name=${encodeURIComponent(name)}`);
    return data;
  }
  
  /**
   * 특정 노선 조회
   * @param {string} routeId 조회할 노선 ID
   * @returns {Promise<Object>} 노선 정보
   */
  static async getRoute(routeId) {
    const data = await ApiService.apiRequest(`routes/${routeId}`);
    return data;
  }
  
  /**
   * 노선 추가
   * @param {Object} routeData 추가할 노선 데이터
   * @returns {Promise<Object>} 추가된 노선 정보
   */
  static async addRoute(routeData) {
    const data = await ApiService.apiRequest('routes', 'POST', routeData);
    return data;
  }
  
  /**
   * 노선 수정
   * @param {Object} routeData 수정할 노선 데이터
   * @returns {Promise<Object>} 수정된 노선 정보
   */
  static async updateRoute(routeData) {
    const data = await ApiService.apiRequest('routes', 'PUT', routeData);
    return data;
  }
  
  /**
   * 노선 삭제
   * @param {string} routeId 삭제할 노선 ID
   * @returns {Promise<Object>} 삭제 결과
   */
  static async deleteRoute(routeId) {
    const data = await ApiService.apiRequest(`routes/${routeId}`, 'DELETE');
    return data;
  }
  // services/api.js에 추가할 이용자 관련 메서드

// ==================== 이용자 관련 메서드 ====================
/**
 * 이용자 데이터 응답 구조 처리 유틸리티 메서드
 * "List<User> user" 형태의 응답 구조 처리를 위한 메서드
 * @param {Object} response API 응답 객체
 * @returns {Array} 처리된 사용자 배열
 */
static extractUserList(response) {
  if (!response) {
    console.error('API 응답이 없습니다.');
    return [];
  }
  
  // 응답 확인을 위한 로깅
  console.log('사용자 데이터 응답 구조:', response);
  
  // 응답 구조 확인 - 다양한 가능한 응답 구조 처리
  
  // 케이스 1: response.user가 배열인 경우 (List<User> user)
  if (response.user && Array.isArray(response.user)) {
    console.log('케이스 1: response.user 배열 발견');
    return response.user;
  }
  
  // 케이스 2: response.data.user가 배열인 경우
  if (response.data && response.data.user && Array.isArray(response.data.user)) {
    console.log('케이스 2: response.data.user 배열 발견');
    return response.data.user;
  }
  
  // 케이스 3: response.data가 배열인 경우 (기존 구조)
  if (response.data && Array.isArray(response.data)) {
    console.log('케이스 3: response.data 배열 발견');
    return response.data;
  }
  
  // 케이스 4: response 자체가 배열인 경우
  if (Array.isArray(response)) {
    console.log('케이스 4: response 자체가 배열');
    return response;
  }
  
  // 알 수 없는 구조인 경우 빈 배열 반환
  console.error('API 응답에서 사용자 목록을 찾을 수 없습니다:', response);
  return [];
}

/**
 * 모든 이용자 조회 수정 (List<User> user 응답 구조 처리)
 * @returns {Promise<Object>} 이용자 목록이 담긴 응답 객체
 */
static async getAllUsers() {
  try {
    const response = await ApiService.apiRequest('user');
    
    // 응답에서 사용자 목록 추출
    const userList = ApiService.extractUserList(response);

    console.log('추출된 사용자 목록:', userList);
    
    // USER 역할만 필터링
    const userRoleOnly = userList.filter(user => user && user.role === 'USER');
    
    return {
      data: userRoleOnly,
      message: response.message || '이용자 목록을 가져왔습니다.'
    };
  } catch (error) {
    console.error('이용자 조회 실패:', error);
    throw error;
  }
}

/**
 * 이용자 ID로 조회
 * @param {string} userId 조회할 이용자 ID
 * @returns {Promise<Object>} 이용자 정보
 */
static async getUser(userId) {
  const data = await ApiService.apiRequest(`user/${userId}`);
  return ApiService.convertUserToAppFormat(data);
}

/**
 * 이용자 이름으로 검색
 * @param {string} name 검색할 이용자 이름
 * @returns {Promise<Array>} 검색된 이용자 목록
 */
static async searchUsersByName(name) {
  const data = await ApiService.apiRequest(`user?name=${encodeURIComponent(name)}&role=GUEST`);
  return ApiService.convertUsers(data);
}

/**
 * 이용자 삭제
 * @param {string} userId 삭제할 이용자 ID
 * @returns {Promise<Object>} 삭제 결과
 */
static async deleteUser(userId) {
  const data = await ApiService.apiRequest(`user/${userId}`, 'DELETE');
  return data;
}

/**
 * 이용자 탑승 기록 조회
 * @param {string} userId 이용자 ID
 * @returns {Promise<Array>} 탑승 기록 목록
 */
static async getUserRideHistory(userId) {
  const data = await ApiService.apiRequest(`user/${userId}/rides`);
  return ApiService.convertRideHistory(data);
}

/**
 * MongoDB 이용자 데이터를 앱 형식으로 변환
 * @param {Object|Array} serverData 서버 응답 데이터
 * @returns {Array} 앱 형식의 이용자 데이터 배열
 */
static convertUsers(serverData) {
  if (!serverData || !serverData.data) {
    return [];
  }
  
  // 서버 응답 데이터가 배열인지 확인
  const dataArray = Array.isArray(serverData.data) ? serverData.data : [serverData.data];
  
  return dataArray.map(user => ApiService.convertUserToAppFormat(user));
}

/**
 * 단일 이용자 MongoDB 데이터를 앱 형식으로 변환
 * @param {Object} userData 이용자 데이터
 * @returns {Object} 앱 형식의 이용자 데이터
 */
static convertUserToAppFormat(userData) {
  if (!userData) return null;
  
  // 생년월일을 계산하기 위한 함수
  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };
  
  return {
    id: userData._id?.$oid || userData.id,
    name: userData.name || '',
    email: userData.email || '',
    birthDate: userData.birthDate || '',
    age: calculateAge(userData.birthDate) || Math.floor(Math.random() * 30) + 20, // 임시로 무작위 나이 설정
    gender: userData.gender || '정보 없음',
    phone: userData.phone || '정보 없음',
    joinYear: userData.joinDate ? new Date(userData.joinDate).getFullYear() : new Date().getFullYear(),
    rideHistory: [] // 탑승 기록은 별도 API 호출로 가져옴
  };
}

/**
 * 탑승 기록 데이터를 앱 형식으로 변환
 * @param {Object|Array} serverData 서버 응답 데이터
 * @returns {Array} 앱 형식의 탑승 기록 배열
 */
static convertRideHistory(serverData) {
  if (!serverData || !serverData.data) {
    return [];
  }
  
  // 서버 응답 데이터가 배열인지 확인
  const dataArray = Array.isArray(serverData.data) ? serverData.data : [serverData.data];
  
  return dataArray.map((ride, index) => ({
    id: ride._id?.$oid || index + 1,
    busInfo: {
      number: ride.busNumber || '정보 없음',
      route: ride.routeName || '정보 없음'
    },
    boardingStation: ride.boardingStation || '정보 없음',
    boardingTime: ride.boardingTime || '00:00',
    alightingStation: ride.alightingStation || '정보 없음',
    alightingTime: ride.alightingTime || '00:00',
    date: ride.date || ApiService.formatDate(new Date())
  }));
}

// ==================== 조직 관련 메서드 ====================
/**
 * 조직 코드로 조직 정보 확인
 * @param {string} code 조직 코드
 * @returns {Promise<Object>} 조직 정보
 */
static async verifyOrganization(code) {
  try {
    const data = await ApiService.apiRequest('organization/verify', 'POST', { code });
    return data;
  } catch (error) {
    console.error('조직 확인 실패:', error);
    throw error;
  }
}

// /**
//  * 현재 로그인한 사용자의 조직 정보 조회
//  * @returns {Promise<Object>} 조직 정보
//  */
// static async getCurrentOrganization() {
//   try {
//     const data = await ApiService.apiRequest('organization/current');
//     return data;
//   } catch (error) {
//     console.error('현재 조직 정보 조회 실패:', error);
//     throw error;
//   }
// }
// api.js에 추가
/**
 * 현재 조직의 이용자만 조회
 * @returns {Promise<Object>} 조직 이용자 목록
 */
static async getOrganizationUsers() {
  try {
    // 조직별 필터링은 서버에서 토큰 기반으로 자동 처리됨
    const response = await ApiService.apiRequest('user?role=USER');
    
    // 응답에서 사용자 목록 추출
    const userList = ApiService.extractUserList(response);
    console.log('조직 사용자 목록:', userList);
    
    // USER 역할만 필터링
    const userRoleOnly = userList.filter(user => user && user.role === 'USER');
    
    return {
      data: userRoleOnly,
      message: response.message || '조직 이용자 목록을 가져왔습니다.'
    };
  } catch (error) {
    console.error('조직 이용자 조회 실패:', error);
    throw error;
  }
}
/**
 * 현재 조직의 정류장만 조회
 * @returns {Promise<Array>} 조직 정류장 목록
 */
static async getOrganizationStations() {
  try {
    // 조직별 필터링은 서버에서 토큰 기반으로 자동 처리됨
    const data = await ApiService.apiRequest('station');
    return data;
  } catch (error) {
    console.error('조직 정류장 조회 실패:', error);
    throw error;
  }
}


// ==================== 현재 사용자 정보 관련 메서드 ====================
/**

}

/**
 * 토큰에서 사용자 정보 추출
 * @returns {Object|null} 디코딩된 사용자 정보
 */
static getCurrentUserFromToken() {
  try {
    const token = ApiService.getToken();
    if (!token) return null;
    
    // JWT 토큰 디코딩 (간단한 방법, 보안 검증은 서버에서)
    const payload = token.split('.')[1];
    const decodedPayload = atob(payload);
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('토큰 디코딩 실패:', error);
    return null;
  }
}

// ==================== 버스 기사(Driver) 관련 메서드 ====================

/**
 * 조직의 모든 버스 기사 조회
 * @returns {Promise<Object>} 버스 기사 목록
 */
static async getOrganizationDrivers() {
  try {
    const response = await ApiService.apiRequest('driver');
    
    // 응답 구조 확인
    console.log('버스 기사 목록 응답:', response);
    
    // 응답에서 기사 목록 추출
    if (response && response.data) {
      return response;
    } else {
      return { data: [], message: '기사 목록이 없습니다.' };
    }
  } catch (error) {
    console.error('버스 기사 조회 실패:', error);
    throw error;
  }
}

/**
 * 특정 버스 기사 조회
 * @param {string} driverId 조회할 기사 ID
 * @returns {Promise<Object>} 기사 정보
 */
static async getDriver(driverId) {
  try {
    const response = await ApiService.apiRequest(`driver/${driverId}`);
    return response;
  } catch (error) {
    console.error('버스 기사 상세 조회 실패:', error);
    throw error;
  }
}

/**
 * 버스 기사 삭제
 * @param {string} driverId 삭제할 기사 ID
 * @returns {Promise<Object>} 삭제 결과
 */
static async deleteDriver(driverId) {
  try {
    const response = await ApiService.apiRequest(`driver/${driverId}`, 'DELETE');
    return response;
  } catch (error) {
    console.error('버스 기사 삭제 실패:', error);
    throw error;
  }
}

/**
 * 기사의 운행 계획 조회 (임시 - 실제 API 구현 필요)
 * @param {string} driverName 기사 이름
 * @param {Object} options 옵션 (limit 등)
 * @returns {Promise<Array>} 운행 계획 목록
 */
static async getDriverOperationPlans(driverName, options = {}) {
  try {
    // 운행 계획 API가 구현되면 여기에 실제 엔드포인트 호출
    // 현재는 빈 배열 반환
    console.log(`${driverName} 기사의 운행 계획 조회 (미구현)`);
    return [];
  } catch (error) {
    console.error('운행 계획 조회 실패:', error);
    return [];
  }
}

/**
 * 운행 일정 추가 - 데이터 검증 강화
 */
static async addOperationPlan(operationPlanData) {
  try {
    console.log('운행 일정 추가 요청 (원본):', operationPlanData);
    
    // 필수 데이터 검증
    if (!operationPlanData.busId) {
      throw new Error('버스 ID가 필요합니다.');
    }
    if (!operationPlanData.driverId) {
      throw new Error('기사 ID가 필요합니다.');
    }
    if (!operationPlanData.operationDate) {
      throw new Error('운행 날짜가 필요합니다.');
    }
    
    // 요청 데이터를 백엔드 DTO 형식에 맞게 변환
    const requestData = {
      busId: String(operationPlanData.busId), // 문자열로 변환
      busNumber: operationPlanData.busNumber || '', // 버스 번호
      driverId: String(operationPlanData.driverId), // 문자열로 변환
      routeId: operationPlanData.routeId ? String(operationPlanData.routeId) : '', // 노선 ID
      operationDate: operationPlanData.operationDate, // YYYY-MM-DD 형식
      startTime: operationPlanData.startTime || '08:00', // HH:MM 형식
      endTime: operationPlanData.endTime || '17:00', // HH:MM 형식
      isRecurring: Boolean(operationPlanData.isRecurring), // 불린 값으로 변환
      recurringWeeks: operationPlanData.recurringWeeks || null
    };
    
    console.log('최종 요청 데이터:', requestData);
    
    const response = await ApiService.apiRequest('operation-plan', 'POST', requestData);
    return response;
  } catch (error) {
    console.error('운행 일정 추가 실패:', error);
    throw error;
  }
}

/**
 * 버스 운행 일정 일별 조회
 */
static async getOperationPlansByDate(date) {
  try {
    const dateStr = typeof date === 'string' ? date : ApiService.formatDate(date);
    console.log('일별 운행 일정 조회 요청:', dateStr);
    
    const data = await ApiService.apiRequest(`operation-plan/${dateStr}`);
    return data;
  } catch (error) {
    console.error('일별 운행 일정 조회 실패:', error);
    throw error;
  }
}

/**
 * 버스 운행 일정 오늘자 조회
 */
static async getTodayOperationPlans() {
  try {
    console.log('오늘 운행 일정 조회');
    const data = await ApiService.apiRequest('operation-plan/today');
    return data;
  } catch (error) {
    console.error('오늘 운행 일정 조회 실패:', error);
    throw error;
  }
}

/**
 * 버스 운행 일정 주별 조회
 */
static async getWeeklyOperationPlans(startDate = null) {
  try {
    console.log('주별 운행 일정 조회:', startDate);
    let endpoint = 'operation-plan/weekly';
    if (startDate) {
      endpoint += `?startDate=${startDate}`;
    }
    const data = await ApiService.apiRequest(endpoint);
    return data;
  } catch (error) {
    console.error('주별 운행 일정 조회 실패:', error);
    throw error;
  }
}

/**
 * 버스 운행 일정 월별 조회
 */
static async getMonthlyOperationPlans(yearMonth = null) {
  try {
    console.log('월별 운행 일정 조회:', yearMonth);
    let endpoint = 'operation-plan/monthly';
    if (yearMonth) {
      endpoint += `?yearMonth=${yearMonth}`;
    }
    const data = await ApiService.apiRequest(endpoint);
    return data;
  } catch (error) {
    console.error('월별 운행 일정 조회 실패:', error);
    throw error;
  }
}

/**
 * 특정 버스 운행 일정 상세 조회
 */
static async getOperationPlanDetail(id) {
  try {
    console.log('운행 일정 상세 조회:', id);
    const data = await ApiService.apiRequest(`operation-plan/detail/${id}`);
    return data;
  } catch (error) {
    console.error('운행 일정 상세 조회 실패:', error);
    throw error;
  }
}

/**
 * 버스 운행 일정 삭제
 */
static async deleteOperationPlan(id) {
  try {
    console.log('운행 일정 삭제:', id);
    const data = await ApiService.apiRequest(`operation-plan/${id}`, 'DELETE');
    return data;
  } catch (error) {
    console.error('운행 일정 삭제 실패:', error);
    throw error;
  }
}

/**
 * 운행 일정 수정 - 데이터 검증 강화
 */
static async updateOperationPlan(operationPlanData) {
  try {
    console.log('운행 일정 수정 요청 (원본):', operationPlanData);
    
    // 필수 데이터 검증
    if (!operationPlanData.id) {
      throw new Error('운행 일정 ID가 필요합니다.');
    }
    
    // 요청 데이터를 백엔드 DTO 형식에 맞게 변환
    const requestData = {
      id: String(operationPlanData.id),
      busId: String(operationPlanData.busId),
      busNumber: operationPlanData.busNumber || '',
      driverId: String(operationPlanData.driverId),
      routeId: operationPlanData.routeId ? String(operationPlanData.routeId) : '',
      operationDate: operationPlanData.operationDate, // YYYY-MM-DD 형식
      startTime: operationPlanData.startTime || '08:00', // HH:MM 형식
      endTime: operationPlanData.endTime || '17:00', // HH:MM 형식
      status: operationPlanData.status || 'SCHEDULED'
    };
    
    console.log('최종 수정 요청 데이터:', requestData);
    
    const response = await ApiService.apiRequest('operation-plan', 'PUT', requestData);
    return response;
  } catch (error) {
    console.error('운행 일정 수정 실패:', error);
    throw error;
  }
}

/**
 * 디버깅을 위한 데이터 검증 헬퍼 메서드
 */
static validateBusData(busData) {
  const issues = [];
  
  if (!busData.id) issues.push('ID가 없습니다');
  if (!busData.busNumber) issues.push('버스 번호가 없습니다');
  if (!busData.totalSeats) issues.push('좌석 수가 없습니다');
  
  if (issues.length > 0) {
    console.warn('버스 데이터 문제:', issues, busData);
  }
  
  return issues.length === 0;
}

static validateRouteData(routeData) {
  const issues = [];
  
  if (!routeData.id) issues.push('ID가 없습니다');
  if (!routeData.routeName) issues.push('노선명이 없습니다');
  
  if (issues.length > 0) {
    console.warn('노선 데이터 문제:', issues, routeData);
  }
  
  return issues.length === 0;
}
}

export default ApiService;