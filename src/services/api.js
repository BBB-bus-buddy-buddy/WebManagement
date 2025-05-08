// services/api.js (토큰 인증 추가)
import { Cookies } from 'react-cookie';

const API_BASE_URL = 'http://DevSe.gonetis.com:12589/api';
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
   * 로그아웃
   */
  static logout() {
    cookies.remove('auth_token', { path: '/' });
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
    const data = await ApiService.apiRequest('operationplan', 'POST', operationPlanData);
    return data;
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
      // 요청 데이터 형식 확인 - MongoDB GeoJsonPoint 형식 [경도, 위도]로 변환
      const requestData = {
        name: stationData.name,
        location: {
          type: 'Point',
          coordinates: [
            // 좌표가 이미 [경도, 위도] 형식이라면 그대로 사용, 아니면 변환
            stationData.location.coordinates[0] > 90 ? 
              stationData.location.coordinates[0] : // 이미 경도면 그대로
              stationData.location.coordinates[1],  // 위도면 인덱스 1(경도)로 교체
            stationData.location.coordinates[0] > 90 ? 
              stationData.location.coordinates[1] : // 이미 경도면 인덱스 1(위도)로 교체
              stationData.location.coordinates[0]   // 위도면 그대로
          ]
        }
        // organizationId는 제외 - 서버에서 토큰으로부터 추출
      };
      
      console.log('정류장 등록 요청 데이터 (변환 후):', requestData);
      
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
    const data = await ApiService.apiRequest(`station/${stationId}`, 'PUT', stationData);
    return data;
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
  
  // ==================== 버스 관련 메서드 ====================
  /**
   * 모든 버스 조회
   * @returns {Promise<Array>} 버스 목록
   */
  static async getAllBuses() {
    const data = await ApiService.apiRequest('bus');
    return data;
  }
  
  /**
   * 특정 버스 조회
   * @param {string} busNumber 조회할 버스 번호
   * @returns {Promise<Object>} 버스 정보
   */
  static async getBus(busNumber) {
    const data = await ApiService.apiRequest(`bus/${busNumber}`);
    return data;
  }
  
  /**
   * 버스 좌석 정보 조회
   * @param {string} busNumber 조회할 버스 번호
   * @returns {Promise<Object>} 버스 좌석 정보
   */
  static async getBusSeats(busNumber) {
    const data = await ApiService.apiRequest(`bus/seats/${busNumber}`);
    return data;
  }
  
  /**
   * 버스 위치 정보 조회
   * @param {string} busNumber 조회할 버스 번호
   * @returns {Promise<Object>} 버스 위치 정보
   */
  static async getBusLocation(busNumber) {
    const data = await ApiService.apiRequest(`bus/location/${busNumber}`);
    return data;
  }
  
  /**
   * 버스 추가 (관리자 권한 필요)
   * @param {Object} busData 추가할 버스 데이터
   * @returns {Promise<Object>} 추가된 버스 정보
   */
  static async addBus(busData) {
    const data = await ApiService.apiRequest('bus', 'POST', busData);
    return data;
  }
  
  /**
   * 버스 수정
   * @param {Object} busData 수정할 버스 데이터
   * @returns {Promise<Object>} 수정된 버스 정보
   */
  static async updateBus(busData) {
    const data = await ApiService.apiRequest('bus', 'PUT', busData);
    return data;
  }
  
  /**
   * 버스 삭제
   * @param {string} busNumber 삭제할 버스 번호
   * @returns {Promise<Object>} 삭제 결과
   */
  static async deleteBus(busNumber) {
    const data = await ApiService.apiRequest(`bus/${busNumber}`, 'DELETE');
    return data;
  }
  // ==================== 노선 관련 메서드 ====================
  /**
   * 모든 노선 조회
   * @returns {Promise<Array>} 노선 목록
   */
  static async getAllRoutes() {
    const data = await ApiService.apiRequest('routes');
    return data;
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
 * 모든 이용자 조회 (USER 역할만)
 * @returns {Promise<Array>} 이용자 목록
 */
static async getAllUsers() {
  const data = await ApiService.apiRequest('user?role=USER');
  return ApiService.convertUsers(data);
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
}

export default ApiService;