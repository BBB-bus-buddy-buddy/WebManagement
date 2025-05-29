// components/StationManagement.js - 조직명 표시 개선
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
  const [currentUser, setCurrentUser] = useState(null);
  const [organizationName, setOrganizationName] = useState('');
  const [newStation, setNewStation] = useState({
    name: '',
    location: {
      type: 'Point',
      coordinates: [35.5665, 129.3780] // Default to Ulsan center (위도, 경도 순서로 통일)
    }
  });
  const [editStation, setEditStation] = useState(null);

  // Fetch all organization stations on component mount
  useEffect(() => {
    fetchOrganizationInfo(); // 조직 정보를 먼저 가져오기
    fetchStations();
    loadKakaoMapScript();
  }, []);

  // 조직 정보 가져오기 (UserManagement와 동일한 방식)
  const fetchOrganizationInfo = async () => {
    try {
      // 현재 로그인한 사용자의 조직 정보 가져오기
      const response = await ApiService.getCurrentOrganization();
      
      if (response && response.data && response.data.name) {
        setOrganizationName(response.data.name);
        console.log('조직 정보 조회 성공:', response.data.name);
      } else {
        // API 응답이 없는 경우 토큰에서 정보 추출 시도
        const userInfo = ApiService.getCurrentUserFromToken();
        if (userInfo && userInfo.organizationName) {
          setOrganizationName(userInfo.organizationName);
        } else {
          setOrganizationName('현재 조직');
        }
      }
    } catch (error) {
      console.error('조직 정보 조회 실패:', error);
      
      // 실패 시 토큰에서 정보 추출 시도
      try {
        const userInfo = ApiService.getCurrentUserFromToken();
        if (userInfo && userInfo.organizationName) {
          setOrganizationName(userInfo.organizationName);
        } else if (userInfo && userInfo.organizationId) {
          // 기본 조직명 매핑
          const knownOrganizations = {
            "Uasidnw": "울산과학대학교",
            // 필요시 다른 조직 추가
          };
          setOrganizationName(knownOrganizations[userInfo.organizationId] || userInfo.organizationId || '현재 조직');
        } else {
          setOrganizationName('현재 조직');
        }
      } catch (tokenError) {
        console.error('토큰에서 정보 추출 실패:', tokenError);
        setOrganizationName('현재 조직');
      }
    }
  };

  // Load Kakao Maps API
  const loadKakaoMapScript = () => {
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

  // 현재 조직의 정류장만 가져오기
  const fetchStations = async () => {
    setLoading(true);
    setError(null);
    try {
      // 조직별 필터링된 정류장 조회 메서드 사용
      const response = await ApiService.getOrganizationStations();
      console.log('조직 정류장 API 응답 데이터:', response);
      
      // 응답 구조에 맞게 수정
      if (response && Array.isArray(response.data)) {
        setStations(response.data);
      } else if (response && response.data) {
        setStations(Array.isArray(response.data) ? response.data : [response.data]);
      } else {
        console.error('응답 데이터 형식이 예상과 다릅니다:', response);
        setStations([]);
      }
    } catch (err) {
      console.error('조직 정류장 정보 불러오기 실패:', err);
      setError('정류장 정보를 불러오는데 실패했습니다.');
      setStations([]);
    } finally {
      setLoading(false);
    }
  };

  // Search organization stations by name
  const searchStationsByName = async (name) => {
    if (!name.trim()) {
      fetchStations();
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      // 조직별 필터링된 정류장 검색 (서버에서 조직 필터링됨)
      const response = await ApiService.searchStationsByName(name);
      
      if (response && Array.isArray(response.data)) {
        setStations(response.data);
      } else if (response && response.data) {
        setStations(Array.isArray(response.data) ? response.data : [response.data]);
      } else {
        setStations([]);
      }
    } catch (err) {
      console.error('조직 정류장 검색 실패:', err);
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
      const lat = selectedStation.location.coordinates[0];
      const lng = selectedStation.location.coordinates[1];
      console.log("상세 지도 좌표:", { lat, lng });

      if (!isFinite(lat) || !isFinite(lng)) {
        console.error("유효하지 않은 좌표:", { lat, lng });
        return;
      }

      const options = {
        center: new window.kakao.maps.LatLng(lat, lng),
        level: 3
      };

      const map = new window.kakao.maps.Map(container, options);
      mapInstanceRef.current = map;

      if (detailMarkerRef.current) {
        detailMarkerRef.current.setMap(null);
      }

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
      const lat = newStation.location.coordinates[0];
      const lng = newStation.location.coordinates[1];
      console.log("등록 지도 좌표:", { lat, lng });

      if (!isFinite(lat) || !isFinite(lng)) {
        console.error("유효하지 않은 좌표:", { lat, lng });
        return;
      }

      const options = {
        center: new window.kakao.maps.LatLng(lat, lng),
        level: 3
      };

      const map = new window.kakao.maps.Map(container, options);

      if (addMarkerRef.current) {
        addMarkerRef.current.setMap(null);
      }

      const markerPosition = new window.kakao.maps.LatLng(lat, lng);
      const marker = new window.kakao.maps.Marker({
        position: markerPosition
      });
      marker.setMap(map);
      addMarkerRef.current = marker;

      window.kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
        const latlng = mouseEvent.latLng;
        marker.setPosition(latlng);
        
        setNewStation({
          ...newStation,
          location: {
            type: 'Point',
            coordinates: [latlng.getLat(), latlng.getLng()]
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
      const lat = editStation.location.coordinates[0];
      const lng = editStation.location.coordinates[1];
      console.log("수정 지도 좌표:", { lat, lng });

      if (!isFinite(lat) || !isFinite(lng)) {
        console.error("유효하지 않은 좌표:", { lat, lng });
        return;
      }

      const options = {
        center: new window.kakao.maps.LatLng(lat, lng),
        level: 3
      };

      const map = new window.kakao.maps.Map(container, options);

      if (editMarkerRef.current) {
        editMarkerRef.current.setMap(null);
      }

      const markerPosition = new window.kakao.maps.LatLng(lat, lng);
      const marker = new window.kakao.maps.Marker({
        position: markerPosition
      });
      marker.setMap(map);
      editMarkerRef.current = marker;

      window.kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
        const latlng = mouseEvent.latLng;
        marker.setPosition(latlng);
        
        setEditStation({
          ...editStation,
          location: {
            type: 'Point',
            coordinates: [latlng.getLat(), latlng.getLng()]
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
  setNewStation({
    name: '',
    location: {
      type: 'Point',
      coordinates: [35.5665, 129.3780]
    }
  });
  
  // 맵 초기화 타이밍을 더 길게 조정
  setTimeout(() => {
    if (mapLoaded && addMapContainerRef.current) {
      console.log('정류장 등록 맵 초기화 시도');
      initAddMap();
    }
  }, 200);
};

  const handleDeleteStation = async (id) => {
    if (window.confirm('정말로 이 정류장을 삭제하시겠습니까?')) {
      try {
        await ApiService.deleteStation(id);
        setStations(stations.filter(station => station.id !== id));
        if (selectedStation && selectedStation.id === id) {
          setSelectedStation(null);
        }
        alert('정류장이 삭제되었습니다.');
      } catch (err) {
        console.error('조직 정류장 삭제 실패:', err);
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

  // 조직 정류장 등록 함수 (POST) - 수정과 동일한 형식으로 수정
const handleAddStation = async (e) => {
  e.preventDefault();
  
  try {
    setLoading(true);
    setError(null);
    
    console.log('정류장 등록 요청 데이터:', newStation);
    
    const response = await ApiService.addStation(newStation);
    
    console.log('서버 응답:', response);
    if (response && response.data) {
      setStations([...stations, response.data]);
      setShowAddForm(false);
      setNewStation({
        name: '',
        location: {
          type: 'Point',
          coordinates: [35.5665, 129.3780] // [위도, 경도] 형식으로 초기화
        }
      });
      alert('정류장이 성공적으로 등록되었습니다.');
    }
  } catch (err) {
    console.error('Error adding station:', err);
    setError(`정류장 등록에 실패했습니다: ${err.message || '알 수 없는 오류'}`);
  } finally {
    setLoading(false);
  }
};

  const handleEditStationClick = () => {
  setShowEditForm(true);
  setEditStation({...selectedStation});
  
  // 맵 초기화 타이밍을 더 길게 조정
  setTimeout(() => {
    if (mapLoaded && editMapContainerRef.current) {
      console.log('정류장 수정 맵 초기화 시도');
      initEditMap();
    }
  }, 200);
};

  // 조직 정류장 수정 함수 - 등록과 동일한 형식으로 수정
const handleUpdateStation = async (e) => {
  e.preventDefault();
  
  try {
    setLoading(true);
    setError(null);
    
    console.log('정류장 수정 요청 데이터:', editStation);
    
    const response = await ApiService.updateStation(editStation.id, editStation);
    
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
      
      alert('정류장이 성공적으로 수정되었습니다.');
    }
  } catch (err) {
    console.error('Error updating station:', err);
    setError(`정류장 수정에 실패했습니다: ${err.message || '알 수 없는 오류'}`);
  } finally {
    setLoading(false);
  }
};

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
    
    window.searchTimeout = setTimeout(() => {
      searchStationsByName(query);
    }, 500);
  };

  // renderStationForm 함수 수정 - ref 참조 문제 해결
const renderStationForm = (isEdit = false) => {
  const formData = isEdit ? editStation : newStation;
  
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
          ref={isEdit ? editMapContainerRef : addMapContainerRef}
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
        <button type="submit" className="save-button" disabled={loading}>
          {loading ? '처리 중...' : (isEdit ? '저장' : '등록')}
        </button>
        <button 
          type="button" 
          className="cancel-button"
          onClick={() => isEdit ? setShowEditForm(false) : setShowAddForm(false)}
          disabled={loading}
        >
          취소
        </button>
      </div>
    </form>
  );
};

  return (
  <div className="station-management">
    <div className="management-header">
      <h1>정류장 관리</h1>
    </div>
    
    {error && <div className="error-message">{error}</div>}
    {!mapLoaded && <div className="loading-message">지도를 로딩 중입니다...</div>}
    
    <div className="management-container">
      <div className="list-section">
        <div className="list-header">
          <h4 style={{marginRight: '10px'}}>정류장 목록</h4>
          <div className="search-bar">
            <input
              type="text"
              placeholder="정류장 이름으로 검색"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          <button onClick={handleAddStationClick} className="add-button">
            +
          </button>
        </div>
        
        <div className="station-list">
          {loading ? (
            <div className="loading">로딩 중...</div>
          ) : !Array.isArray(filteredStations) ? (
            <div className="empty-list">데이터 형식이 올바르지 않습니다.</div>
          ) : filteredStations.length === 0 ? (
            <div className="empty-list">
              {searchQuery ? '검색 결과가 없습니다.' : '등록된 정류장이 없습니다.'}
            </div>
          ) : (
            filteredStations.map(station => (
              <div 
                key={station.id} 
                className={`station-item ${selectedStation && selectedStation.id === station.id ? 'selected' : ''}`}
                onClick={() => handleStationClick(station)}
              >
                <div className="station-info">
                  <h3>{station.name}</h3>
                  <p className="station-coords">
                    위도: {station.location?.coordinates[0]?.toFixed(4)}, 
                    경도: {station.location?.coordinates[1]?.toFixed(4)}
                  </p>
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
                  <label>소속:</label>
                  <span>{organizationName || '조직 정보 없음'}</span>
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
              <p className="form-description">새 정류장은 현재 조직({organizationName || '현재 조직'})에 등록됩니다.</p>
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