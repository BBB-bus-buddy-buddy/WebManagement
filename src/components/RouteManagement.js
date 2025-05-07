// components/RouteManagement.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// API 기본 URL
const API_BASE_URL = 'http://DevSe.gonetis.com:12589/api';

function RouteManagement() {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef = useRef([]);
  
  // 상태 관리
  const [registeredStations, setRegisteredStations] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [newRoute, setNewRoute] = useState({
    routeName: '',
    stations: []
  });
  const [editRoute, setEditRoute] = useState(null);
  
  // 지도 관련 상태
  const [showMap, setShowMap] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchRoutes();
    fetchStations();
  }, []);

  // 노선 데이터 가져오기
  const fetchRoutes = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/routes`);
      setRoutes(response.data);
      setError(null);
    } catch (err) {
      console.error('노선 데이터 로드 중 오류:', err);
      setError('노선 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 정류장 데이터 가져오기
  const fetchStations = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/stations`);
      setRegisteredStations(response.data);
    } catch (err) {
      console.error('정류장 데이터 로드 중 오류:', err);
      setError('정류장 데이터를 불러오는 중 오류가 발생했습니다.');
    }
  };

  // 특정 노선 상세 정보 가져오기
  const fetchRouteDetail = async (routeId) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/routes/${routeId}`);
      setSelectedRoute(response.data);
      setError(null);
    } catch (err) {
      console.error('노선 상세 정보 로드 중 오류:', err);
      setError('노선 상세 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 카카오맵 API 스크립트 로드
  useEffect(() => {
    // 전역 로드 콜백 함수 정의
    window.kakaoMapCallback = () => {
      console.log('카카오맵 API 로드 콜백 실행');
      setMapLoaded(true);
    };
    
    const mapScript = document.getElementById('kakao-map-script');
    
    if (!mapScript) {
      const script = document.createElement('script');
      script.id = 'kakao-map-script';
      // 콜백 방식으로 변경
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=3b43e1905f0a0c9567279f725b9730ed&autoload=false&callback=kakaoMapCallback`;
      script.async = true;
      
      document.head.appendChild(script);
    } else if (window.kakao && window.kakao.maps) {
      console.log('카카오맵 API가 이미 로드되어 있습니다.');
      setMapLoaded(true);
    }
    
    // 컴포넌트 언마운트 시 정리
    return () => {
      delete window.kakaoMapCallback;
    };
  }, []);

  // showMap 변경 시 지도 초기화 실행
  useEffect(() => {
    if (mapLoaded && showMap && mapRef.current) {
      console.log('지도 초기화 시작', window.kakao);
      
      // API가 완전히 로드되었는지 안전하게 체크
      if (typeof window.kakao === 'undefined' || typeof window.kakao.maps === 'undefined') {
        console.error('카카오맵 API가 로드되지 않았습니다.');
        return;
      }
      
      // 지연 시간을 더 길게 설정 (500ms)
      setTimeout(() => {
        try {
          // 먼저 load 함수 실행 확인
          if (typeof window.kakao.maps.load === 'function') {
            window.kakao.maps.load(() => {
              console.log('명시적 load 실행 후 지도 초기화');
              initializeMap();
            });
          } else {
            // 이미 로드된 경우 바로 초기화
            initializeMap();
          }
        } catch (error) {
          console.error('지도 초기화 시도 중 오류:', error);
        }
      }, 500);
    }
  }, [mapLoaded, showMap]);

  // 지도 초기화 함수
  const initializeMap = () => {
    if (!mapRef.current) {
      console.error('지도 컨테이너가 없습니다');
      return;
    }
    
    if (typeof window.kakao === 'undefined' || typeof window.kakao.maps === 'undefined') {
      console.error('카카오맵 API가 로드되지 않았습니다.');
      return;
    }
    
    try {
      console.log('카카오맵 객체 확인:', window.kakao.maps);
      
      // LatLng 생성자 확인
      if (typeof window.kakao.maps.LatLng !== 'function') {
        console.error('LatLng 생성자가 함수가 아닙니다:', typeof window.kakao.maps.LatLng);
        return;
      }
      
      // 울산광역시 중심 좌표로 변경 (울산역 기준)
      const mapOptions = {
        center: new window.kakao.maps.LatLng(35.5525, 129.2878),
        level: 7
      };
      
      // 지도 객체 생성
      const map = new window.kakao.maps.Map(mapRef.current, mapOptions);
      googleMapRef.current = map;
      
      // 정류장 마커 생성
      addStationMarkers(map);
    } catch (error) {
      console.error('지도 초기화 중 구체적인 오류:', error);
    }
  };

  // 정류장 마커 추가
  const addStationMarkers = (map) => {
    // 기존 마커 제거
    if (markersRef.current.length > 0) {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    }
    
    // 새 마커 생성
    registeredStations.forEach(station => {
      try {
        const position = new window.kakao.maps.LatLng(
          station.coordinates.lat, 
          station.coordinates.lng
        );
        
        const marker = new window.kakao.maps.Marker({
          position,
          map
        });
        
        // 마커 클릭 이벤트
        window.kakao.maps.event.addListener(marker, 'click', () => {
          handleStationSelectFromMap(station._id);
        });
        
        // 마커 정보 표시
        const infowindow = new window.kakao.maps.InfoWindow({
          content: `<div style="padding:5px;width:150px;text-align:center;">${station.name}</div>`
        });
        
        window.kakao.maps.event.addListener(marker, 'mouseover', () => {
          infowindow.open(map, marker);
        });
        
        window.kakao.maps.event.addListener(marker, 'mouseout', () => {
          infowindow.close();
        });
        
        markersRef.current.push(marker);
      } catch (error) {
        console.error(`정류장 ${station.name} 마커 생성 중 오류:`, error);
      }
    });
    
    // 선택된 정류장 하이라이트
    highlightSelectedStations();
  };

  // 선택된 정류장 하이라이트
  const highlightSelectedStations = () => {
    if (!googleMapRef.current || !markersRef.current || !markersRef.current.length || !window.kakao || !window.kakao.maps) {
      console.log('마커 하이라이트를 위한 조건이 충족되지 않음');
      return;
    }
    
    const selectedIds = showAddForm 
      ? newRoute.stations.map(s => s.stationId)
      : showEditForm && editRoute && editRoute.stations
        ? editRoute.stations.map(s => s.stationId)
        : [];
    
    try {
      markersRef.current.forEach((marker, index) => {
        const stationId = registeredStations[index]._id;
        
        if (selectedIds.includes(stationId)) {
          // 선택된 정류장 마커 이미지 변경
          const selectedMarkerImage = new window.kakao.maps.MarkerImage(
            '//t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
            new window.kakao.maps.Size(24, 35)
          );
          marker.setImage(selectedMarkerImage);
        } else {
          // 기본 마커 이미지로 복원
          marker.setImage(null);
        }
      });
    } catch (error) {
      console.error('마커 하이라이트 중 오류:', error);
    }
  };

  // 지도에서 정류장 선택 시 처리
  const handleStationSelectFromMap = (stationId) => {
    if (showAddForm) {
      // 이미 추가된 정류장인지 확인
      if (newRoute.stations.some(s => s.stationId === stationId)) {
        alert('이미 추가된 정류장입니다.');
        return;
      }
      
      // 순서 계산 (현재 선택된 정류장 수 + 1)
      const sequence = newRoute.stations.length + 1;
      
      setNewRoute({
        ...newRoute,
        stations: [...newRoute.stations, { sequence, stationId }]
      });
    } else if (showEditForm && editRoute) {
      // 이미 추가된 정류장인지 확인
      if (editRoute.stations.some(s => s.stationId === stationId)) {
        alert('이미 추가된 정류장입니다.');
        return;
      }
      
      // 순서 계산 (현재 선택된 정류장 수 + 1)
      const sequence = editRoute.stations.length + 1;
      
      setEditRoute({
        ...editRoute,
        stations: [...editRoute.stations, { sequence, stationId }]
      });
    }
    
    // 선택된 정류장 하이라이트 업데이트
    setTimeout(() => {
      highlightSelectedStations();
    }, 100);
  };

  // 정류장 ID로 정류장 이름 가져오기
  const getStationName = (stationId) => {
    const station = registeredStations.find(s => s._id === stationId);
    return station ? station.name : '알 수 없는 정류장';
  };

  // 정류장 객체 가져오기
  const getStationById = (stationId) => {
    return registeredStations.find(s => s._id === stationId);
  };

  // 노선 클릭 시 처리
  const handleRouteClick = (route) => {
    fetchRouteDetail(route._id);
    setShowAddForm(false);
    setShowEditForm(false);
    setShowMap(false);
  };

  // 정류장 클릭 시 해당 정류장 상세페이지로 이동
  const handleStationClick = (stationId) => {
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

  // 노선 삭제
  const handleDeleteRoute = async (id) => {
    if (window.confirm('정말로 이 노선을 삭제하시겠습니까?')) {
      try {
        await axios.delete(`${API_BASE_URL}/routes/${id}`);
        
        // 성공적으로 삭제된 후 노선 목록 새로고침
        fetchRoutes();
        
        if (selectedRoute && selectedRoute._id === id) {
          setSelectedRoute(null);
        }
        
        alert('노선이 삭제되었습니다.');
      } catch (error) {
        console.error('노선 삭제 중 오류:', error);
        alert('노선 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // 노선명 입력 처리
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRoute({
      ...newRoute,
      [name]: value
    });
  };

  // 정류장 추가 버튼 클릭 - 지도 표시
  const handleOpenMap = () => {
    setShowMap(true);
  };

  // 지도 닫기
  const handleCloseMap = () => {
    setShowMap(false);
  };

  // 정류장 제거
  const handleRemoveStation = (index) => {
    if (showAddForm) {
      const updatedStations = [...newRoute.stations];
      updatedStations.splice(index, 1);
      
      // 순서 재조정
      const reorderedStations = updatedStations.map((station, idx) => ({
        ...station,
        sequence: idx + 1
      }));
      
      setNewRoute({
        ...newRoute,
        stations: reorderedStations
      });
    } else if (showEditForm && editRoute) {
      const updatedStations = [...editRoute.stations];
      updatedStations.splice(index, 1);
      
      // 순서 재조정
      const reorderedStations = updatedStations.map((station, idx) => ({
        ...station,
        sequence: idx + 1
      }));
      
      setEditRoute({
        ...editRoute,
        stations: reorderedStations
      });
    }
    
    // 선택된 정류장 하이라이트 업데이트
    setTimeout(() => {
      highlightSelectedStations();
    }, 100);
  };

  // 노선 추가 폼 제출
  const handleAddRoute = async (e) => {
    e.preventDefault();
    
    if (newRoute.stations.length < 2) {
      alert('노선에는 최소 2개 이상의 정류장이 필요합니다.');
      return;
    }
    
    try {
      const routeData = {
        routeName: newRoute.routeName,
        stations: newRoute.stations
      };
      
      const response = await axios.post(`${API_BASE_URL}/routes`, routeData);
      
      // 성공적으로 추가된 후 노선 목록 새로고침
      fetchRoutes();
      
      setShowAddForm(false);
      setShowMap(false);
      setNewRoute({
        routeName: '',
        stations: []
      });
      
      alert('노선이 등록되었습니다.');
      
      // 새로 추가된 노선 선택
      fetchRouteDetail(response.data._id);
    } catch (error) {
      console.error('노선 등록 중 오류:', error);
      alert('노선 등록 중 오류가 발생했습니다.');
    }
  };

  // 노선 수정 버튼 클릭
  const handleEditRouteClick = () => {
    setShowEditForm(true);
    setShowMap(false);
    setEditRoute({...selectedRoute});
  };

  // 노선 수정 폼 입력 처리
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditRoute({
      ...editRoute,
      [name]: value
    });
  };

  // 노선 업데이트 폼 제출
  const handleUpdateRoute = async (e) => {
    e.preventDefault();
    
    if (editRoute.stations.length < 2) {
      alert('노선에는 최소 2개 이상의 정류장이 필요합니다.');
      return;
    }
    
    try {
      const routeData = {
        _id: editRoute._id,
        routeName: editRoute.routeName,
        stations: editRoute.stations
      };
      
      await axios.put(`${API_BASE_URL}/routes`, routeData);
      
      // 성공적으로 수정된 후 노선 목록 새로고침
      fetchRoutes();
      
      // 수정된 노선 정보로 선택된 노선 업데이트
      fetchRouteDetail(editRoute._id);
      
      setShowEditForm(false);
      setShowMap(false);
      
      alert('노선이 수정되었습니다.');
    } catch (error) {
      console.error('노선 수정 중 오류:', error);
      alert('노선 수정 중 오류가 발생했습니다.');
    }
  };

  // 이미 추가된 정류장 배열을 기준으로 정류장 정렬
  const getOrderedStations = (stationList) => {
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

  return (
    <div className="route-management">
      <h1>노선 관리</h1>
      <div className="management-container">
        <div className="list-section">
          <div className="list-header">
            <h2>노선 목록</h2>
            <button onClick={handleAddRouteClick} className="add-button">+ 노선 추가</button>
          </div>
          <div className="route-list">
            {routes.map(route => (
              <div 
                key={route._id} 
                className={`route-item ${selectedRoute && selectedRoute._id === route._id ? 'selected' : ''}`}
                onClick={() => handleRouteClick(route)}
              >
                <div className="route-info">
                  <h3>{route.routeName}</h3>
                  <p>
                    {route.stations && route.stations.length > 0 ? (
                      <>
                        {getStationName(route.stations[0].stationId)} → 
                        {getStationName(route.stations[route.stations.length - 1].stationId)} 
                        ({route.stations.length}개 정류장)
                      </>
                    ) : (
                      '정류장 정보 없음'
                    )}
                  </p>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteRoute(route._id);
                  }} 
                  className="delete-button"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="detail-section">
          {selectedRoute && !showEditForm ? (
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
                <div className="detail-section">
                  <h3>경유 정류장</h3>
                  <div className="stations-list">
                    {selectedRoute.stations && selectedRoute.stations.length > 0 ? (
                      getOrderedStations(selectedRoute.stations).map((station, index) => (
                        <div key={index} className="station-item">
                          <span 
                            className="station-link" 
                            onClick={() => handleStationClick(station.id)}
                          >
                            {station.name}
                          </span>
                          {index < selectedRoute.stations.length - 1 && <span className="arrow">→</span>}
                        </div>
                      ))
                    ) : (
                      <p>등록된 정류장이 없습니다.</p>
                    )}
                  </div>
                </div>
                <div className="detail-section">
                  <h3>생성일</h3>
                  <p>{new Date(selectedRoute.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="detail-section">
                  <h3>최종 수정일</h3>
                  <p>{new Date(selectedRoute.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ) : showAddForm ? (
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
                  <label>추가된 정류장 목록</label>
                  {newRoute.stations.length > 0 ? (
                    <div className="stations-list-edit">
                      {getOrderedStations(newRoute.stations).map((station, index) => (
                        <div key={index} className="station-item-edit">
                          <span>{index + 1}. {station.name}</span>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveStation(index)}
                            className="remove-station-button"
                          >
                            삭제
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-stations">추가된 정류장이 없습니다.</p>
                  )}
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
                  <label>정류장 목록</label>
                  {editRoute.stations && editRoute.stations.length > 0 ? (
                    <div className="stations-list-edit">
                      {getOrderedStations(editRoute.stations).map((station, index) => (
                        <div key={index} className="station-item-edit">
                          <span>{index + 1}. {station.name}</span>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveStation(index)}
                            className="remove-station-button"
                          >
                            삭제
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-stations">추가된 정류장이 없습니다.</p>
                  )}
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
            <div className="no-selection">
              <p>좌측 목록에서 노선을 선택하거나 새 노선을 등록하세요.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* 지도 모달 */}
      {showMap && (
        <div className="map-modal">
          <div className="map-container">
            <div className="map-header">
              <h3>지도에서 정류장 선택</h3>
              <button 
                className="close-map-button"
                onClick={handleCloseMap}
              >
                ✕
              </button>
            </div>
            <div className="map-instructions">
              <p>지도에서 정류장 마커를 클릭하면 자동으로 노선에 추가됩니다.</p>
              <p>이미 추가된 정류장은 초록색으로 표시됩니다.</p>
            </div>
            <div 
              ref={mapRef} 
              className="map-view"
              style={{
                width: '100%',
                height: '500px',
                borderRadius: '8px'
              }}
            ></div>
            <div className="map-station-list">
              <h4>현재 선택된 정류장</h4>
              <div className="map-station-items">
                {showAddForm && newRoute.stations.length > 0 ? (
                  <div className="stations-list">
                    {getOrderedStations(newRoute.stations).map((station, index) => (
                      <div key={index} className="map-station-item">
                        <span className="map-station-number">{station.sequence}</span>
                        <span className="map-station-name">{station.name}</span>
                        <button 
                          className="map-remove-station"
                          onClick={() => {
                            const stationIndex = newRoute.stations.findIndex(s => s.stationId === station.id);
                            if (stationIndex !== -1) {
                              handleRemoveStation(stationIndex);
                            }
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                ) : showEditForm && editRoute && editRoute.stations && editRoute.stations.length > 0 ? (
                  <div className="stations-list">
                    {getOrderedStations(editRoute.stations).map((station, index) => (
                      <div key={index} className="map-station-item">
                        <span className="map-station-number">{station.sequence}</span>
                        <span className="map-station-name">{station.name}</span>
                        <button 
                          className="map-remove-station"
                          onClick={() => {
                            const stationIndex = editRoute.stations.findIndex(s => s.stationId === station.id);
                            if (stationIndex !== -1) {
                              handleRemoveStation(stationIndex);
                            }
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-stations">선택된 정류장이 없습니다. 지도에서 정류장을 선택하세요.</p>
                )}
              </div>
              <div className="map-actions">
                <button 
                  className="map-done-button"
                  onClick={handleCloseMap}
                >
                  선택 완료
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RouteManagement;