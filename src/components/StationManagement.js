// components/StationManagement.js
import React, { useState, useEffect, useRef } from 'react';
import ApiService from '../services/api';
import '../styles/StationManagement.css';

function StationManagement() {
  // Kakao Map script loading
  const mapScriptRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const mapContainerRef = useRef(null);
  const addMapContainerRef = useRef(null);
  const editMapContainerRef = useRef(null);
  
  // Map markers
  const addMarkerRef = useRef(null);
  const editMarkerRef = useRef(null);
  const detailMarkerRef = useRef(null);

  // State
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [newStation, setNewStation] = useState({
    name: '',
    location: {
      type: 'Point',
      coordinates: [35.5665, 129.3780] // Default to Ulsan center (위도, 경도 순서로 통일)
    },
    organizationId: 'Uasidnw' // Default organizationId from your data
  });
  const [editStation, setEditStation] = useState(null);

  // Fetch all stations on component mount
  useEffect(() => {
    fetchStations();
    loadKakaoMapScript();
  }, []);

  // Load Kakao Maps API
  const loadKakaoMapScript = () => {
    // 이미 스크립트가 로드되었는지 확인
    if (window.kakao && window.kakao.maps) {
      console.log("카카오맵 스크립트가 이미 로드되어 있습니다.");
      setMapLoaded(true);
      return;
    }

    console.log("카카오맵 스크립트 로딩 시작");
    mapScriptRef.current = document.createElement('script');
    mapScriptRef.current.async = true;
    mapScriptRef.current.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=3b43e1905f0a0c9567279f725b9730ed&autoload=false&libraries=services`;
    document.head.appendChild(mapScriptRef.current);

    mapScriptRef.current.onload = () => {
      console.log("카카오맵 스크립트 로드 완료, 지도 초기화 시작");
      window.kakao.maps.load(() => {
        console.log("카카오맵 로드 완료");
        setMapLoaded(true);
      });
    };
  };

  // 맵 상태가 변경되면 맵 초기화 실행
  useEffect(() => {
    if (!mapLoaded) return;
    
    console.log("맵 상태 변경 감지: ", { 
      selectedStation: !!selectedStation, 
      showAddForm, 
      showEditForm 
    });

    if (selectedStation && mapContainerRef.current && !showEditForm) {
      console.log("상세 지도 초기화");
      initDetailMap();
    }
    
    if (showAddForm && addMapContainerRef.current) {
      console.log("등록 지도 초기화");
      initAddMap();
    }
    
    if (showEditForm && editMapContainerRef.current) {
      console.log("수정 지도 초기화");
      initEditMap();
    }
  }, [selectedStation, showAddForm, showEditForm, mapLoaded]);

  const fetchStations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ApiService.apiRequest('station');
      console.log('API 응답 데이터:', response);
      
      // 응답 구조에 맞게 수정
      if (response && Array.isArray(response.data)) {
        setStations(response.data);
      } else {
        console.error('응답 데이터 형식이 예상과 다릅니다:', response);
        setStations([]);
      }
    } catch (err) {
      console.error('Error fetching stations:', err);
      setError('정류장 정보를 불러오는데 실패했습니다.');
      setStations([]);
    } finally {
      setLoading(false);
    }
  };

  // Search stations by name
  const searchStationsByName = async (name) => {
    if (!name.trim()) {
      fetchStations();
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await ApiService.apiRequest(`station?name=${name}`);
      setStations(response.data);
    } catch (err) {
      console.error('Error searching stations:', err);
      setError('정류장 검색에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Initialize map for station details
  const initDetailMap = () => {
    if (!selectedStation || !mapContainerRef.current || !mapLoaded || !window.kakao || !window.kakao.maps) {
      console.error("상세 지도 초기화 실패:", { 
        selectedStation: !!selectedStation, 
        mapContainer: !!mapContainerRef.current, 
        mapLoaded, 
        kakao: !!window.kakao,
        kakaoMaps: !!(window.kakao && window.kakao.maps) 
      });
      return;
    }

    console.log("상세 지도 생성 중...");
    const container = mapContainerRef.current;
    
    try {
      // 좌표가 유효한지 확인
      const lat = selectedStation.location.coordinates[0];
      const lng = selectedStation.location.coordinates[1];
      console.log("상세 지도 좌표:", { lat, lng });

      if (!isFinite(lat) || !isFinite(lng)) {
        console.error("유효하지 않은 좌표:", { lat, lng });
        return;
      }

      // 지도 옵션 설정
      const options = {
        center: new window.kakao.maps.LatLng(lat, lng),
        level: 3
      };

      // 지도 생성
      const map = new window.kakao.maps.Map(container, options);
      mapInstanceRef.current = map;

      // 이전 마커 제거
      if (detailMarkerRef.current) {
        detailMarkerRef.current.setMap(null);
      }

      // 새 마커 생성
      const markerPosition = new window.kakao.maps.LatLng(lat, lng);
      const marker = new window.kakao.maps.Marker({
        position: markerPosition
      });
      marker.setMap(map);
      detailMarkerRef.current = marker;
      
      console.log("상세 지도 생성 완료");
    } catch (err) {
      console.error("지도 초기화 오류:", err);
    }
  };

  // Initialize map for adding station
  const initAddMap = () => {
    if (!addMapContainerRef.current || !mapLoaded || !window.kakao || !window.kakao.maps) {
      console.error("등록 지도 초기화 실패:", { 
        mapContainer: !!addMapContainerRef.current, 
        mapLoaded, 
        kakao: !!window.kakao,
        kakaoMaps: !!(window.kakao && window.kakao.maps) 
      });
      return;
    }

    console.log("등록 지도 생성 중...");
    const container = addMapContainerRef.current;

    try {
      // 좌표가 유효한지 확인
      const lat = newStation.location.coordinates[0];
      const lng = newStation.location.coordinates[1];
      console.log("등록 지도 좌표:", { lat, lng });

      if (!isFinite(lat) || !isFinite(lng)) {
        console.error("유효하지 않은 좌표:", { lat, lng });
        return;
      }

      // 지도 옵션 설정
      const options = {
        center: new window.kakao.maps.LatLng(lat, lng),
        level: 3
      };

      // 지도 생성
      const map = new window.kakao.maps.Map(container, options);

      // 이전 마커 제거
      if (addMarkerRef.current) {
        addMarkerRef.current.setMap(null);
      }

      // 새 마커 생성
      const markerPosition = new window.kakao.maps.LatLng(lat, lng);
      const marker = new window.kakao.maps.Marker({
        position: markerPosition
      });
      marker.setMap(map);
      addMarkerRef.current = marker;

      // 클릭 이벤트 등록
      window.kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
        const latlng = mouseEvent.latLng;
        marker.setPosition(latlng);
        
        setNewStation({
          ...newStation,
          location: {
            type: 'Point',
            coordinates: [latlng.getLat(), latlng.getLng()] // 위도, 경도 순서로 통일
          }
        });
      });
      
      console.log("등록 지도 생성 완료");
    } catch (err) {
      console.error("지도 초기화 오류:", err);
    }
  };

  // Initialize map for editing station
  const initEditMap = () => {
    if (!editStation || !editMapContainerRef.current || !mapLoaded || !window.kakao || !window.kakao.maps) {
      console.error("수정 지도 초기화 실패:", { 
        editStation: !!editStation, 
        mapContainer: !!editMapContainerRef.current, 
        mapLoaded, 
        kakao: !!window.kakao,
        kakaoMaps: !!(window.kakao && window.kakao.maps) 
      });
      return;
    }

    console.log("수정 지도 생성 중...");
    const container = editMapContainerRef.current;

    try {
      // 좌표가 유효한지 확인
      const lat = editStation.location.coordinates[0];
      const lng = editStation.location.coordinates[1];
      console.log("수정 지도 좌표:", { lat, lng });

      if (!isFinite(lat) || !isFinite(lng)) {
        console.error("유효하지 않은 좌표:", { lat, lng });
        return;
      }

      // 지도 옵션 설정
      const options = {
        center: new window.kakao.maps.LatLng(lat, lng),
        level: 3
      };

      // 지도 생성
      const map = new window.kakao.maps.Map(container, options);

      // 이전 마커 제거
      if (editMarkerRef.current) {
        editMarkerRef.current.setMap(null);
      }

      // 새 마커 생성
      const markerPosition = new window.kakao.maps.LatLng(lat, lng);
      const marker = new window.kakao.maps.Marker({
        position: markerPosition
      });
      marker.setMap(map);
      editMarkerRef.current = marker;

      // 클릭 이벤트 등록
      window.kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
        const latlng = mouseEvent.latLng;
        marker.setPosition(latlng);
        
        setEditStation({
          ...editStation,
          location: {
            type: 'Point',
            coordinates: [latlng.getLat(), latlng.getLng()] // 위도, 경도 순서로 통일
          }
        });
      });
      
      console.log("수정 지도 생성 완료");
    } catch (err) {
      console.error("지도 초기화 오류:", err);
    }
  };

  // Filter stations based on search query
  const filteredStations = searchQuery ? 
    stations.filter(station => station.name.toLowerCase().includes(searchQuery.toLowerCase())) : 
    stations;

  const handleStationClick = (station) => {
    setSelectedStation(station);
    setShowAddForm(false);
    setShowEditForm(false);
  };

  const handleAddStationClick = () => {
    setSelectedStation(null);
    setShowAddForm(true);
    setShowEditForm(false);
    
    // 울산 중심 좌표: 위도 35.5665, 경도 129.3780
    // 내부적으로 [위도, 경도] 형식 유지
    setNewStation({
      name: '',
      location: {
        type: 'Point',
        coordinates: [35.5665, 129.3780] // [위도, 경도] 형식으로 유지
      }
    });
    
    // 지도 초기화를 위한 지연
    setTimeout(() => {
      if (mapLoaded && addMapContainerRef.current) {
        initAddMap();
      }
    }, 100);
  };

  const handleDeleteStation = async (id) => {
    if (window.confirm('정말로 이 정류장을 삭제하시겠습니까?')) {
      try {
        await ApiService.apiRequest(`station/${id}`, 'DELETE');
        setStations(stations.filter(station => station.id !== id));
        if (selectedStation && selectedStation.id === id) {
          setSelectedStation(null);
        }
      } catch (err) {
        console.error('Error deleting station:', err);
        alert('정류장 삭제에 실패했습니다.');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStation({
      ...newStation,
      [name]: value
    });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditStation({
      ...editStation,
      [name]: value
    });
  };

  // 정류장 등록 함수 (POST)
  const handleAddStation = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // 수정 함수에서 사용한 것과 동일한 형식으로 변경
      // 1. 서버 엔티티 필드만 포함 (name, location)
      // 2. location은 배열로 직접 전달
      const requestData = {
        name: newStation.name,
        // 좌표는 [경도, 위도] 배열로 직접 전달
        location: newStation.location.coordinates[0] > 90 ?
          // 이미 [경도, 위도] 형식이면 그대로 사용
          newStation.location.coordinates :
          // [위도, 경도] 형식이면 순서 변경
          [newStation.location.coordinates[1], newStation.location.coordinates[0]]
      };
      
      console.log('정류장 등록 요청 데이터 (수정된 형식):', requestData);
      
      const response = await ApiService.apiRequest('station', 'POST', requestData);
      
      console.log('서버 응답:', response);
      if (response && response.data) {
        setStations([...stations, response.data]);
        setShowAddForm(false);
      }
    } catch (err) {
      console.error('Error adding station:', err);
      
      // 첫 번째 방식이 실패하면 두 번째 방식 시도
      try {
        // 두 번째 방식: GeoJSON Point 객체 형식
        const requestData2 = {
          name: newStation.name,
          location: {
            type: 'Point',
            coordinates: newStation.location.coordinates[0] > 90 ?
              newStation.location.coordinates :
              [newStation.location.coordinates[1], newStation.location.coordinates[0]]
          }
        };
        
        console.log('정류장 등록 요청 데이터 (방식 2):', requestData2);
        
        const response = await ApiService.apiRequest('station', 'POST', requestData2);
        
        console.log('서버 응답 (방식 2):', response);
        if (response && response.data) {
          setStations([...stations, response.data]);
          setShowAddForm(false);
          return;
        }
      } catch (err2) {
        console.error('Error adding station (방식 2):', err2);
        
        // 세 번째 방식 시도: 좌표 필드 직접 사용
        try {
          const latitude = newStation.location.coordinates[0] > 90 ? 
            newStation.location.coordinates[1] : 
            newStation.location.coordinates[0];
          
          const longitude = newStation.location.coordinates[0] > 90 ? 
            newStation.location.coordinates[0] : 
            newStation.location.coordinates[1];
          
          const requestData3 = {
            name: newStation.name,
            latitude: latitude,
            longitude: longitude
          };
          
          console.log('정류장 등록 요청 데이터 (방식 3):', requestData3);
          
          const response = await ApiService.apiRequest('station', 'POST', requestData3);
          
          console.log('서버 응답 (방식 3):', response);
          if (response && response.data) {
            setStations([...stations, response.data]);
            setShowAddForm(false);
            return;
          }
        } catch (err3) {
          console.error('Error adding station (방식 3):', err3);
          setError(`정류장 등록에 실패했습니다. 모든 방법 시도 실패: ${err3.message || '알 수 없는 오류'}`);
        }
      }
    } finally {
      setLoading(false);
    }
  };


  const handleEditStationClick = () => {
    setShowEditForm(true);
    setEditStation({...selectedStation});
  };

  // 정류장 수정 함수 - 서버 API에 맞게 데이터 형식 수정
const handleUpdateStation = async (e) => {
  e.preventDefault();
  
  try {
    setLoading(true);
    setError(null);
    
    // 요청 데이터 준비
    // 1. 서버 엔티티 필드만 포함 (ID, name, location)
    // 2. 좌표는 서버가 기대하는 형식으로 변환
    const requestData = {
      id: editStation.id, // ID 필드 포함
      name: editStation.name,
      // GeoJsonPoint 생성자는 (경도, 위도) 순서로 값을 받음
      // 그러나 JSON 요청에서는 (경도, 위도) 배열만 전달
      location: editStation.location.coordinates[0] > 90 ?
        // 이미 [경도, 위도] 형식이면 그대로 사용
        editStation.location.coordinates :
        // [위도, 경도] 형식이면 순서 변경
        [editStation.location.coordinates[1], editStation.location.coordinates[0]]
    };
    
    console.log('정류장 수정 요청 데이터 (직접 좌표 방식):', requestData);
    
    const response = await ApiService.apiRequest(`station/${editStation.id}`, 'PUT', requestData);
    
    console.log('서버 응답:', response);
    
    if (response) {
      // 성공 시 목록 갱신
      await fetchStations();
      setShowEditForm(false);
      
      // 선택된 정류장 정보 갱신
      const updatedStations = await ApiService.apiRequest('station');
      const updatedStation = updatedStations.data.find(s => s.id === editStation.id);
      
      if (updatedStation) {
        setSelectedStation(updatedStation);
      } else {
        setSelectedStation(null);
      }
    }
  } catch (err) {
    console.error('Error updating station:', err);
    
    // 첫 번째 방식 실패 시 두 번째 방식 시도
    try {
      // 두 번째 방식: location 객체 완전히 전달
      const requestData2 = {
        name: editStation.name,
        // 완전한 GeoJSON Point 객체
        location: {
          type: 'Point',
          coordinates: editStation.location.coordinates[0] > 90 ?
            // 이미 [경도, 위도] 형식이면 그대로 사용
            editStation.location.coordinates :
            // [위도, 경도] 형식이면 순서 변경
            [editStation.location.coordinates[1], editStation.location.coordinates[0]]
        }
      };
      
      console.log('정류장 수정 요청 데이터 (GeoJSON Point 방식):', requestData2);
      
      const response = await ApiService.apiRequest(`station/${editStation.id}`, 'PUT', requestData2);
      
      console.log('서버 응답 (방식 2):', response);
      
      if (response) {
        await fetchStations();
        setShowEditForm(false);
        
        const updatedStations = await ApiService.apiRequest('station');
        const updatedStation = updatedStations.data.find(s => s.id === editStation.id);
        
        if (updatedStation) {
          setSelectedStation(updatedStation);
        } else {
          setSelectedStation(null);
        }
      }
    } catch (err2) {
      console.error('Error updating station (방식 2):', err2);
      
      // 세 번째 방식 시도: 좌표 직접 타입 변환
      try {
        const latitude = editStation.location.coordinates[0] > 90 ? 
          editStation.location.coordinates[1] : 
          editStation.location.coordinates[0];
        
        const longitude = editStation.location.coordinates[0] > 90 ? 
          editStation.location.coordinates[0] : 
          editStation.location.coordinates[1];
        
        // location 객체 완전히 제거, 대신 직접 좌표 필드 추가
        const requestData3 = {
          name: editStation.name,
          latitude: latitude,
          longitude: longitude
        };
        
        console.log('정류장 수정 요청 데이터 (직접 좌표 필드 방식):', requestData3);
        
        const response = await ApiService.apiRequest(`station/${editStation.id}`, 'PUT', requestData3);
        
        console.log('서버 응답 (방식 3):', response);
        
        if (response) {
          await fetchStations();
          setShowEditForm(false);
          
          const updatedStations = await ApiService.apiRequest('station');
          const updatedStation = updatedStations.data.find(s => s.id === editStation.id);
          
          if (updatedStation) {
            setSelectedStation(updatedStation);
          } else {
            setSelectedStation(null);
          }
        }
      } catch (err3) {
        console.error('Error updating station (방식 3):', err3);
        setError(`정류장 수정에 실패했습니다. 모든 방법 시도 실패: ${err3.message || '알 수 없는 오류'}`);
      }
    }
  } finally {
    setLoading(false);
  }
};

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Debounce search to avoid too many API calls
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
    
    window.searchTimeout = setTimeout(() => {
      searchStationsByName(query);
    }, 500);
  };

  const renderStationForm = (isEdit = false) => {
    const formData = isEdit ? editStation : newStation;
    const mapContainerRef = isEdit ? editMapContainerRef : addMapContainerRef;
    
    return (
      <form onSubmit={isEdit ? handleUpdateStation : handleAddStation} className="station-form">
        <div className="form-group">
          <label htmlFor={`${isEdit ? 'edit' : 'new'}-name`}>정류장 이름</label>
          <input 
            type="text" 
            id={`${isEdit ? 'edit' : 'new'}-name`} 
            name="name" 
            value={formData.name} 
            onChange={isEdit ? handleEditInputChange : handleInputChange} 
            required 
          />
        </div>
        
        <div className="form-group">
          <label>정류장 위치</label>
          <div 
            ref={mapContainerRef}
            className="map-container" 
            style={{ width: '100%', height: '300px', marginBottom: '15px' }}
          ></div>
          <p className="map-help-text">지도를 클릭하여 정류장 위치를 지정하세요</p>
        </div>
        
        <div className="form-group">
          <label>좌표</label>
          <div className="coordinates-display">
            <span>위도: {formData.location?.coordinates[0]?.toFixed(6) || '로딩 중...'}</span>
            <span>경도: {formData.location?.coordinates[1]?.toFixed(6) || '로딩 중...'}</span>
          </div>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="save-button">
            {isEdit ? '저장' : '등록'}
          </button>
          <button 
            type="button" 
            className="cancel-button"
            onClick={() => isEdit ? setShowEditForm(false) : setShowAddForm(false)}
          >
            취소
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="station-management">
      <h1>정류장 관리</h1>
      
      {error && <div className="error-message">{error}</div>}
      {!mapLoaded && <div className="loading-message">지도를 로딩 중입니다...</div>}
      
      <div className="management-container">
        <div className="list-section">
          <div className="list-header">
            <div className="search-bar">
              <input
                type="text"
                placeholder="정류장 이름으로 검색"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            <button onClick={handleAddStationClick} className="add-button">+ 정류장 등록</button>
          </div>
          
          <div className="station-list">
            {loading ? (
              <div key="loading" className="loading">로딩 중...</div>
            ) : !Array.isArray(filteredStations) ? (
              <div key="format-error" className="empty-list">데이터 형식이 올바르지 않습니다.</div>
            ) : filteredStations.length === 0 ? (
              <div key="no-results" className="empty-list">검색 결과가 없습니다.</div>
            ) : (
              filteredStations.map(station => (
                <div 
                  key={station.id} 
                  className={`station-item ${selectedStation && selectedStation.id === station.id ? 'selected' : ''}`}
                  onClick={() => handleStationClick(station)}
                >
                  <div className="station-info">
                    <h3>{station.name}</h3>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteStation(station.id);
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
        
        <div className="detail-section">
          {selectedStation && !showEditForm ? (
            <div className="station-details">
              <div className="detail-header">
                <h2>정류장 상세 정보</h2>
                <button onClick={handleEditStationClick} className="edit-button">정류장 수정</button>
              </div>
              
              <div className="detail-info">
                <div className="detail-row">
                  <label>정류장 이름:</label>
                  <span>{selectedStation.name}</span>
                </div>
                <div className="detail-row">
                  <label>좌표:</label>
                  <span>
                    위도 {selectedStation.location.coordinates[0].toFixed(6)}, 
                    경도 {selectedStation.location.coordinates[1].toFixed(6)}
                  </span>
                </div>
                <div className="detail-row">
                  <label>ID:</label>
                  <span>{selectedStation.id}</span>
                </div>
              </div>
              
              <div className="map-section">
                <h3>정류장 위치</h3>
                <div 
                  ref={mapContainerRef}
                  className="map-container" 
                  style={{ width: '100%', height: '300px' }}
                ></div>
              </div>
            </div>
          ) : showAddForm ? (
            <div className="add-station-container">
              <h2>새 정류장 등록</h2>
              {renderStationForm(false)}
            </div>
          ) : showEditForm ? (
            <div className="edit-station-container">
              <h2>정류장 정보 수정</h2>
              {renderStationForm(true)}
            </div>
          ) : (
            <div className="no-selection">
              <p>좌측 목록에서 정류장을 선택하거나 새 정류장을 등록하세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StationManagement;