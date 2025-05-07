// services/api.js

const API_BASE_URL = 'http://DevSe.gonetis.com:12589/api';

/**
 * 버스 기사 배치표 API 서비스
 * MongoDB와의 통신을 담당하는 서비스 레이어
 */
class ApiService {
  /**
   * 모든 버스 기사 배치표 조회
   * @returns {Promise<Array>} 버스 기사 배치표 목록
   */
  static async getAllOperationPlans() {
    try {
      const response = await fetch(`${API_BASE_URL}/operationplan`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('모든 버스 기사 배치표 조회 실패:', error);
      throw error;
    }
  }
  
  /**
   * 단일 버스 기사 배치표 조회
   * @param {string} operationPlanID 조회할 배치표 ID
   * @returns {Promise<Object>} 버스 기사 배치표
   */
  static async getOperationPlan(operationPlanID) {
    try {
      const response = await fetch(`${API_BASE_URL}/operationplan?operationPlanID=${operationPlanID}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('버스 기사 배치표 조회 실패:', error);
      throw error;
    }
  }
  
  /**
   * 버스 기사 배치표 추가
   * @param {Object} operationPlanData 추가할 배치표 데이터
   * @returns {Promise<Object>} 추가된 배치표 정보
   */
  static async addOperationPlan(operationPlanData) {
    try {
      const response = await fetch(`${API_BASE_URL}/operationplan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(operationPlanData),
      });
      
      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('버스 기사 배치표 추가 실패:', error);
      throw error;
    }
  }
  
  /**
   * 버스 기사 배치표 수정
   * @param {Object} operationPlanData 수정할 배치표 데이터
   * @returns {Promise<Object>} 수정된 배치표 정보
   */
  static async updateOperationPlan(operationPlanData) {
    try {
      const response = await fetch(`${API_BASE_URL}/operationplan`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(operationPlanData),
      });
      
      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('버스 기사 배치표 수정 실패:', error);
      throw error;
    }
  }
  
  /**
   * 버스 기사 배치표 삭제
   * @param {string} operationPlanID 삭제할 배치표 ID
   * @returns {Promise<Object>} 삭제 결과
   */
  static async deleteOperationPlan(operationPlanID) {
    try {
      const response = await fetch(`${API_BASE_URL}/operationplan`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operationPlanID
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('버스 기사 배치표 삭제 실패:', error);
      throw error;
    }
  }
  
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
}

export default ApiService;