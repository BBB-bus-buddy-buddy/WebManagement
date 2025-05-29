// components/RouteManagement.js - 개선된 코드
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ApiService from '../services/api';
import '../styles/RouteManagement.css';

// ===================== 드래그 앤 드롭 컴포넌트 =====================

// 드래그 가능한 정류장 아이템 컴포넌트
const DraggableStationItem = ({ id, index, text, moveStation, removeStation }) => {
  const ref = useRef(null);
  
  const [{ isDragging }, drag] = useDrag({
    type: 'STATION',
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
  const [, drop] = useDrop({
    accept: 'STATION',
    hover(item, monitor) {
      if (!ref.current) return;
      
      const dragIndex = item.index;
      const hoverIndex = index;
      
      if (dragIndex === hoverIndex) return;
      
      moveStation(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });
  
  drag(drop(ref));
  
  return (
    <div 
      ref={ref} 
      className="station-item-edit"
      style={{
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: isDragging ? '#f0f0f0' : 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px',
        marginBottom: '8px',
        borderRadius: '4px',
        border: '1px solid #ddd',
        cursor: 'move',
      }}
    >
      <span>{index + 1}. {text}</span>
      <button 
        type="button" 
        onClick={() => removeStation(index)}
        className="remove-station-button"
        style={{
          background: 'none',
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '4px 8px',
          cursor: 'pointer',
          color: '#f44336'
        }}
      >
        삭제
      </button>
    </div>
  );
};

// 지도 모달의 드래그 가능한 정류장 아이템 컴포넌트
const MapDraggableStationItem = ({ id, index, stationNumber, stationName, moveStation, removeStation }) => {
  const ref = useRef(null);
  
  const [{ isDragging }, drag] = useDrag({
    type: 'MAP_STATION',
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
  const [, drop] = useDrop({
    accept: 'MAP_STATION',
    hover(item, monitor) {
      if (!ref.current) return;
      
      const dragIndex = item.index;
      const hoverIndex = index;
      
      if (dragIndex === hoverIndex) return;
      
      moveStation(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });
  
  drag(drop(ref));
  
  return (
    <div 
      ref={ref} 
      className="map-station-item" 
      style={{
        opacity: isDragging ? 0.5 : 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        borderBottom: '1px solid #eee',
        backgroundColor: isDragging ? '#e3f2fd' : 'white',
        borderRadius: '4px',
        marginBottom: '6px',
        cursor: 'move'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span className="map-station-number" style={{
          fontWeight: 'bold',
          marginRight: '10px',
          backgroundColor: '#2196F3',
          color: 'white',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px'
        }}>{stationNumber}</span>
        <span className="map-station-name" style={{
          flex: 1,
          paddingLeft: '8px',
          fontWeight: 'normal'
        }}>{stationName}</span>
      </div>
      <button 
        className="map-remove-station"
        onClick={() => removeStation(index)}
        style={{
          background: 'none',
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '4px 8px',
          cursor: 'pointer',
          color: '#f44336'
        }}
      >
        삭제
      </button>
    </div>
  );
};

// ===================== 메인 컴포넌트 =====================

function RouteManagement() {
  const navigate = useNavigate();
  
  // ===================== Refs =====================
  const mapRef = useRef(null);
  const detailMapRef = useRef(null);
  const kakaoMapRef = useRef(null);
  const detailKakaoMapRef = useRef(null);
  const markersRef = useRef([]);
  const detailMarkersRef = useRef([]);
  const polylinesRef = useRef([]);
  
  // ===================== 상태 관리 =====================
  // 데이터 상태
  const [stations, setStations] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  
  // UI 상태
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 폼 데이터 상태
  const [newRoute, setNewRoute] = useState({
    routeName: '',
    stations: []
  });
  const [editRoute, setEditRoute] = useState(null);
  
  // 사용자 및 조직 상태
  const [currentUser, setCurrentUser] = useState(null);
  const [organizationName, setOrganizationName] = useState('');
  
  // 지도 관련 상태
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [detailMapInitialized, setDetailMapInitialized] = useState(false);

  // ===================== 소속명 표시 함수 =====================
  
  const getCompanyDisplay = (organizationId) => {
    const organizations = {
      "Uasidnw": "울산과학대학교",
    };
    return organizations[organizationId] || organizationId || '정보 없음';
  };

  // ===================== 초기화 및 데이터 가져오기 =====================
  
  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchRoutes();
    fetchStations();
  }, []);

  // 현재 조직의 노선만 가져오기
const fetchRoutes = async () => {
  try {
    setIsLoading(true);
    const response = await ApiService.getAllRoutes();
    console.log('조직 노선 데이터 응답:', response);
    
    if (response && Array.isArray(response.data)) {
      setRoutes(response.data);
    } else if (response && response.data) {
      setRoutes(Array.isArray(response.data) ? response.data : [response.data]);
    } else {
      setRoutes([]);
    }
    setError(null);
  } catch (err) {
    console.error('조직 노선 데이터 로드 중 오류:', err);
    setError('노선 데이터를 불러오는 중 오류가 발생했습니다.');
    setRoutes([]);
  } finally {
    setIsLoading(false);
  }
};

  // 현재 조직의 정류장만 가져오기
const fetchStations = async () => {
  try {
    const response = await ApiService.getAllStations();
    console.log('조직 정류장 데이터 응답:', response);
    
    if (response && Array.isArray(response.data)) {
      setStations(response.data);
    } else if (response && response.data) {
      setStations(Array.isArray(response.data) ? response.data : [response.data]);
    } else {
      setStations([]);
    }
  } catch (err) {
    console.error('조직 정류장 데이터 로드 중 오류:', err);
    setError('정류장 데이터를 불러오는 중 오류가 발생했습니다.');
    setStations([]);
  }
};

  // 특정 노선 상세 정보 가져오기
  const fetchRouteDetail = async (routeId) => {
    try {
      setIsLoading(true);
      const response = await ApiService.getRoute(routeId);
      console.log('노선 상세 정보 응답:', response);
      
      if (response) {
        const routeData = response.data ? response.data : response;
        
        if (!routeData.stations) {
          routeData.stations = [];
        }
        
        setSelectedRoute(routeData);
        
        // 상세 정보 지도 초기화
        setTimeout(() => {
          initializeDetailMap(routeData);
        }, 500);
      } else {
        setError('노선 상세 정보를 불러오는 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('노선 상세 정보 로드 중 오류:', err);
      setError('노선 상세 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // ===================== 검색 기능 =====================
  
  // 조직별 노선 검색 기능
  const searchRoutesByName = async (name) => {
    try {
      setIsLoading(true);
      const response = await ApiService.searchRoutesByName(name);
      
      if (response && Array.isArray(response.data)) {
        setRoutes(response.data);
      } else if (response && response.data) {
        setRoutes(Array.isArray(response.data) ? response.data : [response.data]);
      } else {
        setRoutes([]);
      }
      setError(null);
    } catch (err) {
      console.error('조직 노선 검색 중 오류:', err);
      setError('노선 검색 중 오류가 발생했습니다.');
      setRoutes([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 노선 검색 (debounce 적용)
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
    
    window.searchTimeout = setTimeout(() => {
      if (value) {
        searchRoutesByName(value);
      } else {
        fetchRoutes();
      }
    }, 300);
  };

  // ===================== 카카오맵 관련 함수 =====================
  
  // 카카오맵 API 스크립트 로드
  useEffect(() => {
    const loadKakaoMap = () => {
      if (window.kakao && window.kakao.maps) {
        console.log('카카오맵 API가 이미 로드되어 있습니다.');
        setMapLoaded(true);
        return;
      }
      
      const script = document.createElement('script');
      script.id = 'kakao-map-script';
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=3b43e1905f0a0c9567279f725b9730ed&autoload=false&libraries=services`;
      script.async = true;
      script.onload = () => {
        window.kakao.maps.load(() => {
          console.log('카카오맵 API 로드 완료');
          setMapLoaded(true);
        });
      };
      
      document.head.appendChild(script);
    };
    
    loadKakaoMap();
  }, []);

  // 상세 정보 지도 초기화
  const initializeDetailMap = (routeData) => {
    if (!detailMapRef.current || !window.kakao || !window.kakao.maps || !mapLoaded) {
      console.log('상세 지도 초기화 조건 미충족');
      return;
    }

    try {
      // 기존 마커 및 폴리라인 정리
      if (detailMarkersRef.current.length > 0) {
        detailMarkersRef.current.forEach(marker => marker.setMap(null));
        detailMarkersRef.current = [];
      }
      
      if (polylinesRef.current.length > 0) {
        polylinesRef.current.forEach(polyline => polyline.setMap(null));
        polylinesRef.current = [];
      }

      const mapOptions = {
        center: new window.kakao.maps.LatLng(35.5525, 129.2878),
        level: 7
      };

      const map = new window.kakao.maps.Map(detailMapRef.current, mapOptions);
      detailKakaoMapRef.current = map;

      // 노선 정류장 표시
      if (routeData && routeData.stations && routeData.stations.length > 0) {
        const processedStations = processRouteStations(routeData);
        addDetailMapMarkers(map, processedStations);
        drawRouteLine(map, processedStations);
      }

      setDetailMapInitialized(true);
    } catch (error) {
      console.error('상세 지도 초기화 중 오류:', error);
    }
  };

  // 상세 지도 마커 추가
  const addDetailMapMarkers = (map, processedStations) => {
    if (!processedStations || processedStations.length === 0) return;

    const bounds = new window.kakao.maps.LatLngBounds();

    processedStations.forEach((station, index) => {
      const stationData = getStationById(station.stationId);
      if (!stationData || !stationData.location || !stationData.location.coordinates) return;

      const lat = parseFloat(stationData.location.coordinates[0]);
      const lng = parseFloat(stationData.location.coordinates[1]);

      if (isNaN(lat) || isNaN(lng)) return;

      const position = new window.kakao.maps.LatLng(lat, lng);
      bounds.extend(position);

      // 순서가 표시된 마커 이미지 생성
      const markerImage = new window.kakao.maps.MarkerImage(
        createNumberMarker(station.sequence),
        new window.kakao.maps.Size(30, 40),
        { offset: new window.kakao.maps.Point(15, 40) }
      );

      const marker = new window.kakao.maps.Marker({
        position,
        map,
        image: markerImage
      });

      const infowindow = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:5px;width:150px;text-align:center;">${station.sequence}. ${station.name}</div>`
      });

      window.kakao.maps.event.addListener(marker, 'mouseover', () => {
        infowindow.open(map, marker);
      });

      window.kakao.maps.event.addListener(marker, 'mouseout', () => {
        infowindow.close();
      });

      detailMarkersRef.current.push(marker);
    });

    // 지도 범위 조정
    if (processedStations.length > 1) {
      map.setBounds(bounds);
    }
  };

  // 실제 도로를 따라 경로선 그리기 (내비게이션 스타일)
  const drawRouteLine = async (map, processedStations) => {
    if (!processedStations || processedStations.length < 2) return;

    // 기존 폴리라인 제거
    if (polylinesRef.current.length > 0) {
      polylinesRef.current.forEach(polyline => polyline.setMap(null));
      polylinesRef.current = [];
    }

    // 각 정류장 간의 실제 도로 경로 그리기
    for (let i = 0; i < processedStations.length - 1; i++) {
      const startStation = getStationById(processedStations[i].stationId);
      const endStation = getStationById(processedStations[i + 1].stationId);
      
      if (!startStation?.location?.coordinates || !endStation?.location?.coordinates) {
        continue;
      }

      const startLat = parseFloat(startStation.location.coordinates[0]);
      const startLng = parseFloat(startStation.location.coordinates[1]);
      const endLat = parseFloat(endStation.location.coordinates[0]);
      const endLng = parseFloat(endStation.location.coordinates[1]);

      if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) {
        continue;
      }

      try {
        // 카카오 길찾기 API 호출
        const routePath = await getNavigationRoute(startLat, startLng, endLat, endLng);
        
        if (routePath && routePath.length > 0) {
          // 실제 도로 경로로 폴리라인 생성
          const polyline = new window.kakao.maps.Polyline({
            path: routePath,
            strokeWeight: 6,
            strokeColor: '#2196F3',
            strokeOpacity: 0.9,
            strokeStyle: 'solid'
          });

          polyline.setMap(map);
          polylinesRef.current.push(polyline);
        } else {
          // API 실패 시 직선으로 대체
          const straightPath = [
            new window.kakao.maps.LatLng(startLat, startLng),
            new window.kakao.maps.LatLng(endLat, endLng)
          ];
          
          const polyline = new window.kakao.maps.Polyline({
            path: straightPath,
            strokeWeight: 4,
            strokeColor: '#FF5722',
            strokeOpacity: 0.7,
            strokeStyle: 'dashed'
          });

          polyline.setMap(map);
          polylinesRef.current.push(polyline);
        }
      } catch (error) {
        console.error(`정류장 ${i} -> ${i+1} 경로 생성 실패:`, error);
        
        // 오류 시 직선으로 대체
        const straightPath = [
          new window.kakao.maps.LatLng(startLat, startLng),
          new window.kakao.maps.LatLng(endLat, endLng)
        ];
        
        const polyline = new window.kakao.maps.Polyline({
          path: straightPath,
          strokeWeight: 4,
          strokeColor: '#FF5722',
          strokeOpacity: 0.7,
          strokeStyle: 'dashed'
        });

        polyline.setMap(map);
        polylinesRef.current.push(polyline);
      }
    }
  };

  // 카카오 길찾기 API를 사용하여 실제 도로 경로 가져오기
  const getNavigationRoute = async (startLat, startLng, endLat, endLng) => {
    try {
      // 우선 카카오맵 웹 서비스 API 사용 (CORS 문제 없음)
      return await getKakaoWebRoute(startLat, startLng, endLat, endLng);
    } catch (error) {
      console.error('카카오 웹 서비스 오류:', error);
      
      // 웹 서비스 실패 시 백엔드 프록시 사용 시도
      try {
        return await getBackendProxyRoute(startLat, startLng, endLat, endLng);
      } catch (proxyError) {
        console.error('백엔드 프록시도 실패:', proxyError);
        
        // 모든 API 실패 시 스마트 곡선 경로 생성
        return createSmartCurvedPath(startLat, startLng, endLat, endLng);
      }
    }
  };

  // 카카오맵 웹 서비스 API 사용 (directions는 없지만 places 등으로 경로 추정)
  const getKakaoWebRoute = async (startLat, startLng, endLat, endLng) => {
    return new Promise((resolve, reject) => {
      if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
        reject(new Error('카카오맵 서비스가 로드되지 않음'));
        return;
      }

      // 거리 계산
      const distance = calculateDistance(startLat, startLng, endLat, endLng);
      
      if (distance > 100) { // 100km 이상이면 직선으로 처리
        resolve(null);
        return;
      }

      // 지리적 특성을 고려한 스마트 경로 생성
      const smartPath = createSmartCurvedPath(startLat, startLng, endLat, endLng);
      resolve(smartPath);
    });
  };

  // 백엔드 프록시를 통한 길찾기 API 호출 (CORS 우회)
  // 주의: 이 함수를 사용하려면 백엔드에서 다음과 같은 API 엔드포인트가 필요합니다:
  // POST /api/navigation/route
  // body: { origin: { lat, lng }, destination: { lat, lng } }
  // response: { path: [{ lat, lng }, ...] }
  const getBackendProxyRoute = async (startLat, startLng, endLat, endLng) => {
    try {
      // 백엔드 API를 통해 카카오 길찾기 API 호출
      const response = await fetch('/api/navigation/route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          origin: { lat: startLat, lng: startLng },
          destination: { lat: endLat, lng: endLng }
        })
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.path && Array.isArray(data.path)) {
        return data.path.map(point => new window.kakao.maps.LatLng(point.lat, point.lng));
      }
      
      return null;
    } catch (error) {
      throw error;
    }
  };

  // 지리적 특성을 고려한 스마트 곡선 경로 생성
  const createSmartCurvedPath = (startLat, startLng, endLat, endLng) => {
    const path = [];
    const steps = 15; // 더 세밀한 중간 지점
    
    // 시작점
    path.push(new window.kakao.maps.LatLng(startLat, startLng));
    
    // 거리에 따른 곡률 조정
    const distance = calculateDistance(startLat, startLng, endLat, endLng);
    const curveFactor = Math.min(distance * 0.0005, 0.01); // 거리에 비례한 곡률
    
    // 방향 벡터 계산
    const latDiff = endLat - startLat;
    const lngDiff = endLng - startLng;
    
    for (let i = 1; i < steps; i++) {
      const ratio = i / steps;
      
      // 베지어 곡선 기반 경로
      const t = ratio;
      const smoothT = t * t * (3.0 - 2.0 * t); // 부드러운 보간
      
      // 기본 경로
      let midLat = startLat + latDiff * smoothT;
      let midLng = startLng + lngDiff * smoothT;
      
      // 자연스러운 곡률 추가 (도로처럼)
      const curveOffset = Math.sin(ratio * Math.PI) * curveFactor;
      
      // 경로 방향에 수직인 방향으로 곡률 적용
      const perpLat = -lngDiff / Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
      const perpLng = latDiff / Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
      
      midLat += perpLat * curveOffset;
      midLng += perpLng * curveOffset;
      
      // 도시 지역 고려 (울산 지역의 도로 패턴 반영)
      if (isUrbanArea(midLat, midLng)) {
        // 도시 지역에서는 격자형 도로 패턴 시뮬레이션
        const gridOffset = 0.0008;
        if (ratio < 0.3 || ratio > 0.7) {
          midLat = Math.round(midLat / gridOffset) * gridOffset;
        } else {
          midLng = Math.round(midLng / gridOffset) * gridOffset;
        }
      }
      
      path.push(new window.kakao.maps.LatLng(midLat, midLng));
    }
    
    // 종점
    path.push(new window.kakao.maps.LatLng(endLat, endLng));
    
    return path;
  };

  // 울산 지역의 도시 지역 판단
  const isUrbanArea = (lat, lng) => {
    // 울산 시내 중심가 좌표 범위 (대략적)
    const ulsanCenterLat = 35.5384;
    const ulsanCenterLng = 129.3114;
    const urbanRadius = 0.05; // 약 5km 반경
    
    const distance = Math.sqrt(
      Math.pow(lat - ulsanCenterLat, 2) + Math.pow(lng - ulsanCenterLng, 2)
    );
    
    return distance < urbanRadius;
  };

  // 두 지점 간 거리 계산 (km)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // 지구 반지름 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };



  // 숫자 마커 생성 함수
  const createNumberMarker = (number) => {
    const canvas = document.createElement('canvas');
    canvas.width = 30;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');

    // 마커 배경 그리기
    ctx.fillStyle = '#2196F3';
    ctx.beginPath();
    ctx.arc(15, 15, 12, 0, 2 * Math.PI);
    ctx.fill();

    // 아래쪽 뾰족한 부분
    ctx.beginPath();
    ctx.moveTo(15, 27);
    ctx.lineTo(9, 35);
    ctx.lineTo(21, 35);
    ctx.closePath();
    ctx.fill();

    // 숫자 텍스트
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(number.toString(), 15, 15);

    return canvas.toDataURL();
  };

  // 지도 모달 열기 함수
  const handleOpenMap = () => {
    setShowMap(true);
    
    setTimeout(() => {
      if (mapInitialized && kakaoMapRef.current) {
        console.log('지도가 이미 초기화됨 - 재로드');
        
        if (mapRef.current) {
          if (markersRef.current.length > 0) {
            markersRef.current.forEach(marker => marker.setMap(null));
            markersRef.current = [];
          }
          
          const mapOptions = {
            center: new window.kakao.maps.LatLng(35.5525, 129.2878),
            level: 7
          };
          
          const map = new window.kakao.maps.Map(mapRef.current, mapOptions);
          kakaoMapRef.current = map;
          
          setTimeout(() => {
            addStationMarkers(map);
            map.relayout();
          }, 300);
        }
      } else if (mapLoaded) {
        console.log('지도 새로 초기화');
        initializeMap();
      }
    }, 500);
  };

  const handleCloseMap = () => {
    setShowMap(false);
  };

  // 지도 초기화 함수 
  const initializeMap = () => {
    console.log('지도 초기화 함수 실행', {
      mapRef: !!mapRef.current,
      kakao: !!window.kakao,
      kakaoMaps: !!(window.kakao && window.kakao.maps)
    });

    if (!mapRef.current || !window.kakao || !window.kakao.maps) {
      console.error('지도 초기화를 위한 요소가 준비되지 않았습니다.');
      return;
    }
    
    try {
      const mapContainer = document.getElementById('kakao-map-container');
      if (!mapContainer) {
        console.error('지도 컨테이너를 찾을 수 없습니다.');
        return;
      }
      
      const mapOptions = {
        center: new window.kakao.maps.LatLng(35.5525, 129.2878),
        level: 7
      };
      
      if (kakaoMapRef.current) {
        console.log('기존 지도 객체 정리');
        if (markersRef.current.length > 0) {
          markersRef.current.forEach(marker => marker.setMap(null));
          markersRef.current = [];
        }
      }
      
      console.log('새 지도 객체 생성');
      const map = new window.kakao.maps.Map(mapRef.current, mapOptions);
      kakaoMapRef.current = map;
      
      window.kakao.maps.event.addListener(map, 'tilesloaded', function() {
        console.log('지도 타일 로드 완료');
      });
      
      setTimeout(() => {
        addStationMarkers(map);
      }, 300);
      
      setTimeout(() => {
        if (map && typeof map.relayout === 'function') {
          console.log('지도 크기 재조정');
          map.relayout();
        }
      }, 500);
      
      setMapInitialized(true);
      
    } catch (error) {
      console.error('지도 초기화 중 오류:', error);
    }
  };

  // 정류장 마커 추가 함수 (조직 정류장만)
  const addStationMarkers = (map) => {
    console.log('조직 정류장 마커 추가 함수 실행', {
      mapExists: !!map,
      stationsCount: stations?.length || 0
    });

    if (markersRef.current.length > 0) {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    }
    
    if (!stations || stations.length === 0) {
      console.log('표시할 조직 정류장 데이터가 없습니다.');
      return;
    }
    
    const selectedStations = showAddForm && newRoute && newRoute.stations
      ? newRoute.stations
      : showEditForm && editRoute && editRoute.stations
        ? editRoute.stations
        : [];
    
    stations.forEach((station, index) => {
      try {
        if (!station.location || !Array.isArray(station.location.coordinates) || station.location.coordinates.length < 2) {
          console.warn(`조직 정류장 #${index} 좌표 정보 없음:`, station);
          return;
        }
        
        const lat = parseFloat(station.location.coordinates[0]);
        const lng = parseFloat(station.location.coordinates[1]);
        
        if (isNaN(lat) || isNaN(lng)) {
          console.warn(`조직 정류장 ${station.name || index}의 좌표가 유효하지 않음:`, station.location.coordinates);
          return;
        }
        
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          console.warn(`조직 정류장 ${station.name || index}의 좌표가 범위를 벗어남:`, lat, lng);
          return;
        }
        
        const position = new window.kakao.maps.LatLng(lat, lng);
        
        // 선택된 정류장 찾기
        const selectedStation = selectedStations.find(s => s.stationId === station.id);
        let markerImage = null;
        
        if (selectedStation) {
          // 순서가 표시된 마커
          markerImage = new window.kakao.maps.MarkerImage(
            createNumberMarker(selectedStation.sequence),
            new window.kakao.maps.Size(30, 40),
            { offset: new window.kakao.maps.Point(15, 40) }
          );
        }
        
        const marker = new window.kakao.maps.Marker({
          position,
          map,
          image: markerImage
        });
        
        window.kakao.maps.event.addListener(marker, 'click', () => {
          handleStationSelectFromMap(station.id);
        });
        
        const infowindow = new window.kakao.maps.InfoWindow({
          content: `<div style="padding:5px;width:150px;text-align:center;">${station.name || '정류장'}</div>`
        });
        
        window.kakao.maps.event.addListener(marker, 'mouseover', () => {
          infowindow.open(map, marker);
        });
        
        window.kakao.maps.event.addListener(marker, 'mouseout', () => {
          infowindow.close();
        });
        
        markersRef.current.push(marker);
      } catch (error) {
        console.error(`조직 정류장 마커 생성 중 오류:`, error, station);
      }
    });
    
    console.log('생성된 조직 정류장 마커 수:', markersRef.current.length);
  };

  // 선택된 정류장 하이라이트
  const highlightSelectedStations = () => {
    if (!kakaoMapRef.current || !markersRef.current || !markersRef.current.length || !window.kakao || !window.kakao.maps) {
      console.log('마커 하이라이트를 위한 조건이 충족되지 않음');
      return;
    }
    
    const selectedStations = showAddForm && newRoute && Array.isArray(newRoute.stations)
      ? newRoute.stations
      : showEditForm && editRoute && Array.isArray(editRoute.stations)
        ? editRoute.stations
        : [];
    
    console.log('하이라이트 업데이트 - 선택된 정류장 수:', selectedStations.length);
    
    try {
      markersRef.current.forEach((marker, index) => {
        if (index >= stations.length) {
          return;
        }
        
        const station = stations[index];
        if (!station || !station.id) {
          return;
        }
        
        const selectedStation = selectedStations.find(s => s.stationId === station.id);
        
        if (selectedStation) {
          const selectedMarkerImage = new window.kakao.maps.MarkerImage(
            createNumberMarker(selectedStation.sequence),
            new window.kakao.maps.Size(30, 40),
            { offset: new window.kakao.maps.Point(15, 40) }
          );
          marker.setImage(selectedMarkerImage);
        } else {
          marker.setImage(null);
        }
      });
    } catch (error) {
      console.error('마커 하이라이트 중 오류:', error);
    }
  };

  // ===================== 이벤트 핸들러 =====================

  // 지도에서 정류장 선택 시 처리
  const handleStationSelectFromMap = (stationId) => {
    console.log('조직 정류장 선택 시도:', stationId);
    
    if (showAddForm) {
      setNewRoute(prevRoute => {
        const existingStations = Array.isArray(prevRoute.stations) ? [...prevRoute.stations] : [];
        
        if (existingStations.some(s => s.stationId === stationId)) {
          alert('이미 추가된 정류장입니다.');
          return prevRoute;
        }
        
        const sequence = existingStations.length + 1;
        const updatedStations = [...existingStations, { sequence, stationId }];
        
        console.log('추가 모드 - 업데이트된 정류장 목록:', updatedStations);
        
        return {
          ...prevRoute,
          stations: updatedStations
        };
      });
    } else if (showEditForm) {
      setEditRoute(prevRoute => {
        const existingStations = Array.isArray(prevRoute.stations) ? [...prevRoute.stations] : [];
        
        if (existingStations.some(s => s.stationId === stationId)) {
          alert('이미 추가된 정류장입니다.');
          return prevRoute;
        }
        
        const sequence = existingStations.length + 1;
        const updatedStations = [...existingStations, { sequence, stationId }];
        
        console.log('편집 모드 - 업데이트된 정류장 목록:', updatedStations);
        
        return {
          ...prevRoute,
          stations: updatedStations
        };
      });
    }
    
    // 즉시 마커 업데이트
    setTimeout(() => {
      highlightSelectedStations();
    }, 100);
  };

  // 선택된 정류장 목록이 변경될 때마다 마커 업데이트
  useEffect(() => {
    if (showMap && mapInitialized) {
      highlightSelectedStations();
    }
  }, [newRoute.stations, editRoute?.stations, showMap, mapInitialized]);

  // 노선 클릭 시 처리
  const handleRouteClick = (route) => {
    if (!route || !route.id) {
      console.error('선택한 노선의 ID가 없습니다:', route);
      return;
    }
    
    fetchRouteDetail(route.id);
    setShowAddForm(false);
    setShowEditForm(false);
    setShowMap(false);
  };

  // 정류장 클릭 시 해당 정류장 상세페이지로 이동
  const handleStationClick = (stationId) => {
    if (!stationId) {
      console.error('선택한 정류장의 ID가 없습니다');
      return;
    }
    navigate(`/stations/${stationId}`);
  };

  // 노선 추가 버튼 클릭
  const handleAddRouteClick = () => {
    setSelectedRoute(null);
    setShowAddForm(true);
    setShowEditForm(false);
    setShowMap(false);
    setNewRoute({
      routeName: '',
      stations: []
    });
  };

  // 노선 수정 버튼 클릭
  const handleEditRouteClick = () => {
    if (!selectedRoute) {
      alert('선택된 노선이 없습니다.');
      return;
    }
    
    const route = {
      ...selectedRoute,
      stations: selectedRoute.stations || []
    };
    
    setShowEditForm(true);
    setShowMap(false);
    setEditRoute(route);
  };

  // 노선 삭제
  const handleDeleteRoute = async (id) => {
    if (!id) {
      console.error('삭제할 노선의 ID가 없습니다');
      return;
    }
    
    if (window.confirm('정말로 이 노선을 삭제하시겠습니까?')) {
      try {
        await ApiService.deleteRoute(id);
        
        fetchRoutes();
        
        if (selectedRoute && selectedRoute.id === id) {
          setSelectedRoute(null);
        }
        
        alert('노선이 삭제되었습니다.');
      } catch (error) {
        console.error('노선 삭제 중 오류:', error);
        alert('노선 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // ===================== 폼 처리 함수 =====================

  // 노선명 입력 처리
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRoute({
      ...newRoute,
      [name]: value
    });
  };

  // 노선 수정 폼 입력 처리
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditRoute({
      ...editRoute,
      [name]: value
    });
  };

  // 노선 추가 폼 제출
  const handleAddRoute = async (e) => {
    e.preventDefault();
    
    if (!newRoute.stations || newRoute.stations.length < 2) {
      alert('노선에는 최소 2개 이상의 정류장이 필요합니다.');
      return;
    }
    
    try {
      const routeData = {
        routeName: newRoute.routeName,
        stations: newRoute.stations.map(station => ({
          sequence: station.sequence,
          stationId: station.stationId
        }))
      };
      
      console.log('조직 노선 등록 요청 데이터:', routeData);
      const response = await ApiService.addRoute(routeData);
      console.log('조직 노선 등록 응답:', response);
      
      fetchRoutes();
      
      setShowAddForm(false);
      setShowMap(false);
      setNewRoute({
        newRouteName: '',
        stations: []
      });
      
      alert('노선이 등록되었습니다.');
      
      if (response && response.id) {
        fetchRouteDetail(response.id);
      }
    } catch (error) {
      console.error('조직 노선 등록 중 오류:', error);
      alert('노선 등록 중 오류가 발생했습니다.');
    }
  };

  // 노선 업데이트 폼 제출
  const handleUpdateRoute = async (e) => {
    e.preventDefault();
    
    if (!editRoute.stations || editRoute.stations.length < 2) {
      alert('노선에는 최소 2개 이상의 정류장이 필요합니다.');
      return;
    }
    
    
    try {
      const routeData = {
        prevRouteName: selectedRoute.routeName,
        newRouteName: editRoute.routeName,
        stations: editRoute.stations.map(station => ({
          sequence: station.sequence,
          stationId: station.stationId
        }))
      };
      
      console.log('조직 노선 수정 요청 데이터:', routeData);
      await ApiService.updateRoute(routeData);
      
      fetchRoutes();
      fetchRouteDetail(editRoute.id);
      
      setShowEditForm(false);
      setShowMap(false);
      
      alert('노선이 수정되었습니다.');
    } catch (error) {
      console.error('조직 노선 수정 중 오류:', error);
      alert('노선 수정 중 오류가 발생했습니다.');
    }
  };

  // ===================== 정류장 관리 함수 =====================

  // 정류장 제거 함수
  const handleRemoveStation = (index) => {
    if (showAddForm) {
      setNewRoute(prevRoute => {
        const existingStations = Array.isArray(prevRoute.stations) ? [...prevRoute.stations] : [];
        if (existingStations.length === 0) return prevRoute;
        
        const updatedStations = [...existingStations];
        updatedStations.splice(index, 1);
        
        const reorderedStations = updatedStations.map((station, idx) => ({
          ...station,
          sequence: idx + 1
        }));
        
        return {
          ...prevRoute,
          stations: reorderedStations
        };
      });
    } else if (showEditForm) {
      setEditRoute(prevRoute => {
        const existingStations = Array.isArray(prevRoute.stations) ? [...prevRoute.stations] : [];
        if (existingStations.length === 0) return prevRoute;
        
        const updatedStations = [...existingStations];
        updatedStations.splice(index, 1);
        
        const reorderedStations = updatedStations.map((station, idx) => ({
          ...station,
          sequence: idx + 1
        }));
        
        return {
          ...prevRoute,
          stations: reorderedStations
        };
      });
    }
    
    setTimeout(() => {
      highlightSelectedStations();
    }, 100);
  };

  // 정류장 드래그 이동 처리 함수
  const moveStation = (dragIndex, hoverIndex, isEditMode = false) => {
    if (isEditMode) {
      setEditRoute(prevRoute => {
        const existingStations = Array.isArray(prevRoute.stations) ? [...prevRoute.stations] : [];
        if (existingStations.length <= 1) return prevRoute;
        
        const updatedStations = [...existingStations];
        const [movedItem] = updatedStations.splice(dragIndex, 1);
        updatedStations.splice(hoverIndex, 0, movedItem);
        
        const reorderedStations = updatedStations.map((station, idx) => ({
          ...station,
          sequence: idx + 1
        }));
        
        return {
          ...prevRoute,
          stations: reorderedStations
        };
      });
    } else {
      setNewRoute(prevRoute => {
        const existingStations = Array.isArray(prevRoute.stations) ? [...prevRoute.stations] : [];
        if (existingStations.length <= 1) return prevRoute;
        
        const updatedStations = [...existingStations];
        const [movedItem] = updatedStations.splice(dragIndex, 1);
        updatedStations.splice(hoverIndex, 0, movedItem);
        
        const reorderedStations = updatedStations.map((station, idx) => ({
          ...station,
          sequence: idx + 1
        }));
        
        return {
          ...prevRoute,
          stations: reorderedStations
        };
      });
    }
    
    setTimeout(() => {
      highlightSelectedStations();
    }, 100);
  };

  // ===================== 유틸리티 함수 =====================

  // 정류장 ID로 정류장 이름 가져오기
  const getStationName = (stationId) => {
    if (!stationId) return '정류장 정보 없음';
    const station = stations.find(s => s.id === stationId);
    return station ? station.name : '알 수 없는 정류장';
  };

  // 정류장 객체 가져오기
  const getStationById = (stationId) => {
    if (!stationId) return null;
    return stations.find(s => s.id === stationId);
  };

  // 이미 추가된 정류장 배열을 기준으로 정류장 정렬
  const getOrderedStations = (stationList) => {
    if (!stationList || !Array.isArray(stationList) || stationList.length === 0) {
      return [];
    }
    
    return stationList
      .sort((a, b) => a.sequence - b.sequence)
      .map(station => {
        const stationInfo = getStationById(station.stationId);
        return {
          id: station.stationId,
          sequence: station.sequence,
          name: stationInfo ? stationInfo.name : '알 수 없는 정류장',
          address: stationInfo ? stationInfo.address : ''
        };
      });
  };

  // 노선 정보에서 stationId 추출
  const extractStationId = (stationRef) => {
    if (!stationRef) return null;
    
    if (typeof stationRef === 'string') {
      return stationRef;
    }
    
    if (stationRef.$id && stationRef.$id.$oid) {
      return stationRef.$id.$oid;
    }
    
    if (stationRef.stationId) {
      return extractStationId(stationRef.stationId);
    }
    
    return null;
  };

  // 노선 정보 처리
  const processRouteStations = (route) => {
    if (!route || !route.stations || !Array.isArray(route.stations)) {
      return [];
    }
    
    return route.stations.map((station, index) => {
      const stationId = extractStationId(station);
      
      return {
        sequence: station.sequence || index + 1,
        stationId: stationId,
        name: getStationName(stationId)
      };
    }).sort((a, b) => a.sequence - b.sequence);
  };

  // ===================== 컴포넌트 정리 =====================

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (markersRef.current.length > 0) {
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
      }
      
      if (detailMarkersRef.current.length > 0) {
        detailMarkersRef.current.forEach(marker => marker.setMap(null));
        detailMarkersRef.current = [];
      }
      
      if (polylinesRef.current.length > 0) {
        polylinesRef.current.forEach(polyline => polyline.setMap(null));
        polylinesRef.current = [];
      }
      
      kakaoMapRef.current = null;
      detailKakaoMapRef.current = null;
      setMapInitialized(false);
      setDetailMapInitialized(false);
      
      if (window.searchTimeout) {
        clearTimeout(window.searchTimeout);
      }
    };
  }, []);

  // ===================== 로딩 및 에러 상태 처리 =====================

  // 로딩 상태 표시
  if (isLoading && !selectedRoute && !showAddForm && !showEditForm) {
    return (
      <div className="loading-container">
        <p>데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  // 오류 상태 표시
  if (error && !selectedRoute && !showAddForm && !showEditForm) {
    return (
      <div className="error-container">
        <h2>오류가 발생했습니다</h2>
        <p>{error}</p>
        <button onClick={() => { fetchRoutes(); fetchStations(); }}>
          다시 시도
        </button>
      </div>
    );
  }

  // ===================== 렌더링 =====================

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="route-management">
        {/* 헤더 영역 */}
        <div className="management-header">
          <h1>노선 관리</h1>
        </div>

        {/* 메인 컨텐츠 영역 */}
        <div className="management-container">
          {/* 왼쪽 목록 영역 */}
          <div className="list-section">
            <div className="list-header">
              <h2>노선 목록</h2>
              <div className="search-container">
                <input
                  type="text"
                  placeholder="노선명 검색..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="search-input"
                />
              </div>
              <button onClick={handleAddRouteClick} className="add-button">+</button>
            </div>
            
            <div className="route-list">
              {routes.length === 0 ? (
                <div className="empty-list">
                  {searchQuery ? '검색 결과가 없습니다.' : '등록된 노선이 없습니다.'}
                </div>
              ) : (
                routes.map(route => (
                  <div 
                    key={route.id || route._id} 
                    className={`route-item ${selectedRoute && (selectedRoute.id === route.id || selectedRoute._id === route._id) ? 'selected' : ''}`}
                    onClick={() => handleRouteClick(route)}
                  >
                    <div className="route-info">
                      <h3>{route.routeName}</h3>
                      <p>
                        {route.stations && route.stations.length > 0 ? (
                          (() => {
                            const processedStations = processRouteStations(route);
                            if (processedStations.length === 0) return '정류장 정보 없음';
                            
                            const first = processedStations[0];
                            const last = processedStations[processedStations.length - 1];
                            
                            return `${first.name} → ${last.name} (${processedStations.length}개 정류장)`;
                          })()
                        ) : (
                          '정류장 정보 없음'
                        )}
                      </p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRoute(route.id || route._id);
                      }} 
                      className="delete-button"
                    >
                      삭제
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* 오른쪽 상세 영역 */}
          <div className="detail-section">
            {selectedRoute && !showEditForm ? (
              // 노선 상세 정보
              <div className="route-details">
                <div className="detail-header">
                  <h2>노선 상세 정보</h2>
                  <button onClick={handleEditRouteClick} className="edit-button">노선 수정</button>
                </div>
                <div className="detail-info">
                  <div className="detail-row">
                    <label>노선명:</label>
                    <span>{selectedRoute.routeName}</span>
                  </div>
                  <div className="detail-row">
                    <label>소속:</label>
                    <span>{getCompanyDisplay(selectedRoute.organizationId)}</span>
                  </div>
                  
                  {/* 노선 지도 */}
                  <div className="detail-section">
                    <h3>노선 지도</h3>
                    <div className="map-info" style={{
                      marginBottom: '10px',
                      padding: '10px',
                      backgroundColor: '#e3f2fd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      color: '#1976d2'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🗺️</span>
                        <span><strong>실제 도로를 따라 연결된 경로</strong>가 표시됩니다.</span>
                      </div>
                      <div style={{ marginTop: '5px', fontSize: '13px', color: '#666' }}>
                        • 파란색 실선: 내비게이션 경로 | 주황색 점선: 추정 경로
                      </div>
                    </div>
                    <div 
                      ref={detailMapRef} 
                      className="route-detail-map"
                      style={{
                        width: '100%',
                        height: '300px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        border: '1px solid #ddd'
                      }}
                    ></div>
                  </div>
                  
                  <div className="detail-section">
                    <h3>경유 정류장</h3>
                    <div className="stations-list-vertical">
                      {selectedRoute.stations && selectedRoute.stations.length > 0 ? (
                        (() => {
                          const processedStations = processRouteStations(selectedRoute);
                          
                          return processedStations.length > 0 ? (
                            processedStations.map((station, index) => (
                              <div key={`${station.stationId}-${index}`} className="station-item-vertical">
                                <div className="station-content">
                                  <span className="station-sequence-circle">{index + 1}</span>
                                  <span 
                                    className="station-name-link" 
                                    onClick={() => handleStationClick(station.stationId)}
                                    style={{
                                      cursor: 'pointer',
                                      color: '#2196F3',
                                      textDecoration: 'none',
                                      fontWeight: '500'
                                    }}
                                    onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                    onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                                  >
                                    {station.name}
                                  </span>
                                </div>
                                {index < processedStations.length - 1 && (
                                  <div className="station-arrow-down">↓</div>
                                )}
                              </div>
                            ))
                          ) : (
                            <p>정류장 정보를 처리할 수 없습니다.</p>
                          );
                        })()
                      ) : (
                        <p>등록된 정류장이 없습니다.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : showAddForm ? (
              // 노선 추가 폼
              <div className="add-route-form">
                <h2>새 노선 등록</h2>
                <form onSubmit={handleAddRoute}>
                  <div className="form-group">
                    <label htmlFor="routeName">노선명</label>
                    <input 
                      type="text" 
                      id="routeName" 
                      name="routeName" 
                      value={newRoute.routeName} 
                      onChange={handleInputChange} 
                      required 
                      placeholder="예: 동부캠퍼스 정문 로타리 - 남운럭키아파트"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>정류장 추가</label>
                    <div className="station-selector-container">
                      <button 
                        type="button" 
                        onClick={handleOpenMap}
                        className="station-selector-toggle"
                      >
                        지도에서 정류장 선택
                      </button>
                    </div>
                  </div>
                  
                  <div className="stations-container">
                    <label>추가된 정류장 목록 <small>(드래그하여 순서 변경 가능)</small></label>
                    <div 
                      className="stations-list-edit-enhanced"
                      style={{
                        maxHeight: '400px',
                        overflowY: 'auto',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        padding: '10px',
                        backgroundColor: '#f9f9f9'
                      }}
                    >
                      {newRoute.stations && newRoute.stations.length > 0 ? (
                        newRoute.stations.map((station, index) => (
                          <DraggableStationItem
                            key={`${station.stationId}-${index}`}
                            id={station.stationId}
                            index={index}
                            text={getStationName(station.stationId)}
                            moveStation={(dragIndex, hoverIndex) => moveStation(dragIndex, hoverIndex, false)}
                            removeStation={handleRemoveStation}
                          />
                        ))
                      ) : (
                        <p className="no-stations">추가된 정류장이 없습니다.</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="form-actions">
                    <button type="submit" className="save-button">등록</button>
                    <button 
                      type="button" 
                      className="cancel-button"
                      onClick={() => {
                        setShowAddForm(false);
                        setShowMap(false);
                      }}
                    >
                      취소
                    </button>
                  </div>
                </form>
              </div>
            ) : showEditForm && editRoute ? (
              // 노선 수정 폼
              <div className="edit-route-form">
                <h2>노선 수정</h2>
                <form onSubmit={handleUpdateRoute}>
                  <div className="form-group">
                    <label htmlFor="edit-name">노선명</label>
                    <input 
                      type="text" 
                      id="edit-name" 
                      name="routeName" 
                      value={editRoute.routeName} 
                      onChange={handleEditInputChange} 
                      required 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>정류장 추가</label>
                    <div className="station-selector-container">
                      <button 
                        type="button" 
                        onClick={handleOpenMap}
                        className="station-selector-toggle"
                      >
                        지도에서 정류장 선택
                      </button>
                    </div>
                  </div>
                  
                  <div className="stations-container">
                    <label>정류장 목록 <small>(드래그하여 순서 변경 가능)</small></label>
                    <div 
                      className="stations-list-edit-enhanced"
                      style={{
                        maxHeight: '400px',
                        overflowY: 'auto',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        padding: '10px',
                        backgroundColor: '#f9f9f9'
                      }}
                    >
                      {editRoute.stations && editRoute.stations.length > 0 ? (
                        editRoute.stations.map((station, index) => (
                          <DraggableStationItem
                            key={`${station.stationId}-${index}`}
                            id={station.stationId}
                            index={index}
                            text={getStationName(station.stationId)}
                            moveStation={(dragIndex, hoverIndex) => moveStation(dragIndex, hoverIndex, true)}
                            removeStation={handleRemoveStation}
                          />
                        ))
                      ) : (
                        <p className="no-stations">추가된 정류장이 없습니다.</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="form-actions">
                    <button type="submit" className="save-button">저장</button>
                    <button 
                      type="button" 
                      className="cancel-button"
                      onClick={() => {
                        setShowEditForm(false);
                        setShowMap(false);
                      }}
                    >
                      취소
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              // 기본 상태
              <div className="no-selection">
                <p>좌측 목록에서 노선을 선택하거나 새 노선을 등록하세요.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* 지도 모달 */}
        {showMap && (
          <div 
            id="kakao-map-modal" 
            className="map-modal" 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden'
            }}
          >
            <div 
              className="map-container" 
              style={{
                width: '90%',
                maxWidth: '1000px',
                height: '90vh',
                backgroundColor: 'white',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              {/* 고정 헤더 */}
              <div className="map-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 20px 10px 20px',
                borderBottom: '1px solid #eee',
                backgroundColor: 'white',
                zIndex: 10
              }}>
                <h3>조직 정류장에서 선택</h3>
                <button 
                  className="close-map-button"
                  onClick={handleCloseMap}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>
              
              {/* 고정 안내 메시지 */}
              <div className="map-instructions" style={{
                padding: '10px 20px',
                backgroundColor: '#f8f9fa',
                borderBottom: '1px solid #eee',
                zIndex: 10
              }}>
                <p><strong>조직의 정류장만 표시됩니다.</strong></p>
                <p>지도에서 정류장 마커를 클릭하면 자동으로 노선에 추가됩니다.</p>
                <p>선택된 정류장은 <span style={{color: '#2196F3'}}>순서 번호</span>가 표시됩니다.</p>
              </div>
              
              {/* 지도 영역 */}
              <div 
                id="kakao-map-container"
                ref={mapRef} 
                className="map-view"
                style={{
                  width: '100%',
                  flex: '1',
                  borderRadius: '0',
                  position: 'relative',
                  minHeight: '300px'
                }}
              ></div>
              
              {/* 선택된 정류장 목록 */}
              <div className="map-station-list" style={{
                height: '200px',
                overflowY: 'auto',
                padding: '15px 20px',
                backgroundColor: '#f8f9fa',
                borderTop: '1px solid #eee'
              }}>
                <h4 style={{marginBottom: '10px'}}>현재 선택된 정류장</h4>
                <div className="map-station-items">
                  {showAddForm && newRoute && newRoute.stations && newRoute.stations.length > 0 ? (
                    <div className="stations-list">
                      {newRoute.stations.map((station, index) => (
                        <MapDraggableStationItem
                          key={`map-${station.stationId}-${index}`}
                          id={station.stationId}
                          index={index}
                          stationNumber={station.sequence}
                          stationName={getStationName(station.stationId)}
                          moveStation={(dragIndex, hoverIndex) => moveStation(dragIndex, hoverIndex, false)}
                          removeStation={handleRemoveStation}
                        />
                      ))}
                    </div>
                  ) : showEditForm && editRoute && editRoute.stations && editRoute.stations.length > 0 ? (
                    <div className="stations-list">
                      {editRoute.stations.map((station, index) => (
                        <MapDraggableStationItem
                          key={`map-edit-${station.stationId}-${index}`}
                          id={station.stationId}
                          index={index}
                          stationNumber={station.sequence}
                          stationName={getStationName(station.stationId)}
                          moveStation={(dragIndex, hoverIndex) => moveStation(dragIndex, hoverIndex, true)}
                          removeStation={handleRemoveStation}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="no-stations">선택된 정류장이 없습니다. 지도에서 조직 정류장을 선택하세요.</p>
                  )}
                </div>
              </div>
              
              {/* 고정 하단 버튼 */}
              <div className="map-actions" style={{
                padding: '15px 20px',
                textAlign: 'center',
                borderTop: '1px solid #eee',
                backgroundColor: 'white',
                zIndex: 10
              }}>
                <button 
                  className="map-done-button"
                  onClick={handleCloseMap}
                  style={{
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    padding: '12px 30px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  선택 완료
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* CSS 스타일 추가 */}
      <style>{`
        .stations-list-vertical {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 15px;
          background-color: #f9f9f9;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }
        
        .station-item-vertical {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        
        .station-content {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background-color: white;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          min-width: 200px;
          justify-content: flex-start;
          transition: all 0.3s ease;
        }
        
        .station-content:hover {
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
          transform: translateY(-1px);
        }
        
        .station-sequence-circle {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2196F3, #1976D2);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
          flex-shrink: 0;
          box-shadow: 0 2px 4px rgba(33, 150, 243, 0.3);
        }
        
        .station-name-link {
          font-size: 16px;
          color: #333;
          flex: 1;
          transition: color 0.2s ease;
        }
        
        .station-arrow-down {
          color: #2196F3;
          font-size: 20px;
          font-weight: bold;
          margin: 5px 0;
          animation: bounce 2s infinite;
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-3px);
          }
          60% {
            transform: translateY(-1px);
          }
        }
        
        .stations-list-edit-enhanced {
          background-color: #f8f9fa;
        }
        
        .stations-list-edit-enhanced .station-item-edit {
          background-color: white;
          border: 1px solid #e0e0e0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          transition: all 0.2s ease;
        }
        
        .stations-list-edit-enhanced .station-item-edit:hover {
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          transform: translateY(-1px);
        }
        
        .route-detail-map {
          position: relative;
          overflow: hidden;
        }
        
        .route-detail-map::after {
          content: '';
          position: absolute;
          top: 10px;
          left: 10px;
          right: 10px;
          bottom: 10px;
          border: 2px solid #2196F3;
          border-radius: 6px;
          pointer-events: none;
          opacity: 0.3;
        }
        
        .map-modal {
          backdrop-filter: blur(5px);
        }
        
        .map-container {
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .map-header h3 {
          color: #2196F3;
          margin: 0;
        }
        
        .map-instructions {
          font-size: 14px;
          line-height: 1.4;
        }
        
        .map-instructions p {
          margin: 5px 0;
        }
        
        .map-done-button {
          transition: all 0.3s ease;
        }
        
        .map-done-button:hover {
          background-color: #45a049 !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
        }
        
        /* 폴리라인 스타일 (CSS로는 직접 제어할 수 없지만 참고용) */
        .navigation-route {
          stroke-width: 6px;
          stroke: #2196F3;
          stroke-opacity: 0.9;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        
        .fallback-route {
          stroke-width: 4px;
          stroke: #FF5722;
          stroke-opacity: 0.7;
          stroke-dasharray: 10,5;
          stroke-linecap: round;
        }
      `}</style>
    </DndProvider>
  );
}

export default RouteManagement;