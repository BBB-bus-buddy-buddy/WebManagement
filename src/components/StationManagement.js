// components/StationManagement.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../styles/StationManagement.css';

function StationManagement() {
  // Kakao Map script loading
  const mapScriptRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const mapContainerRef = useRef(null);
  const addMapContainerRef = useRef(null);
  const editMapContainerRef = useRef(null);

  // State
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newStation, setNewStation] = useState({
    name: '',
    location: {
      type: 'Point',
      coordinates: [35.5665, 129.3780] // Default to Ulsan center
    },
    organizationId: 'Uasidnw' // Default organizationId from your data
  });
  const [editStation, setEditStation] = useState(null);

  // API base URL
  const API_BASE_URL = 'http://DevSe.gonetis.com:12589/api';

  // Fetch all stations on component mount
  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/station`);
      console.log('API 응답 데이터:', response.data);
      
      // 응답 구조에 맞게 수정
      if (response.data && Array.isArray(response.data.data)) {
        setStations(response.data.data);
      } else {
        console.error('응답 데이터 형식이 예상과 다릅니다:', response.data);
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
      const response = await axios.get(`${API_BASE_URL}/station?name=${name}`);
      setStations(response.data);
    } catch (err) {
      console.error('Error searching stations:', err);
      setError('정류장 검색에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Load Kakao Maps API
  useEffect(() => {
    mapScriptRef.current = document.createElement('script');
    mapScriptRef.current.async = true;
    mapScriptRef.current.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=3b43e1905f0a0c9567279f725b9730ed&autoload=false&libraries=services`;
    document.head.appendChild(mapScriptRef.current);

    mapScriptRef.current.onload = () => {
      window.kakao.maps.load(() => {
        if (selectedStation && mapContainerRef.current) {
          initDetailMap();
        }
        if (showAddForm && addMapContainerRef.current) {
          initAddMap();
        }
        if (showEditForm && editMapContainerRef.current) {
          initEditMap();
        }
      });
    };

    return () => {
      if (mapScriptRef.current && document.head.contains(mapScriptRef.current)) {
        document.head.removeChild(mapScriptRef.current);
      }
    };
  }, [selectedStation, showAddForm, showEditForm]);

  // Initialize map for station details
  const initDetailMap = () => {
    if (!selectedStation || !mapContainerRef.current) return;

    const container = mapContainerRef.current;
    const options = {
      center: new window.kakao.maps.LatLng(
        selectedStation.location.coordinates[0],
        selectedStation.location.coordinates[1]
      ),
      level: 3
    };

    const map = new window.kakao.maps.Map(container, options);
    mapInstanceRef.current = map;

    // Add marker for the station
    const markerPosition = new window.kakao.maps.LatLng(
      selectedStation.location.coordinates[0],
      selectedStation.location.coordinates[1]
    );
    const marker = new window.kakao.maps.Marker({
      position: markerPosition
    });
    marker.setMap(map);
  };

  // Initialize map for adding station
  const initAddMap = () => {
    if (!addMapContainerRef.current) return;
  
    const container = addMapContainerRef.current;
    const options = {
      center: new window.kakao.maps.LatLng(
        newStation.location.coordinates[1], // 위도 (두 번째 요소)
        newStation.location.coordinates[0]  // 경도 (첫 번째 요소)
      ),
      level: 3
    };

    const map = new window.kakao.maps.Map(container, options);
    
    // Add marker for the initial position
    const markerPosition = new window.kakao.maps.LatLng(
      newStation.location.coordinates[0],
      newStation.location.coordinates[1]
    );
    const marker = new window.kakao.maps.Marker({
      position: markerPosition
    });
    marker.setMap(map);
    
    // Add click event to set marker position
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
  };

  // Initialize map for editing station
  const initEditMap = () => {
    if (!editStation || !editMapContainerRef.current) return;

    const container = editMapContainerRef.current;
    const options = {
      center: new window.kakao.maps.LatLng(
        editStation.location.coordinates[0],
        editStation.location.coordinates[1]
      ),
      level: 3
    };

    const map = new window.kakao.maps.Map(container, options);
    
    // Add marker for the current position
    const markerPosition = new window.kakao.maps.LatLng(
      editStation.location.coordinates[0],
      editStation.location.coordinates[1]
    );
    const marker = new window.kakao.maps.Marker({
      position: markerPosition
    });
    marker.setMap(map);
    
    // Add click event to set marker position
    window.kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
      const latlng = mouseEvent.latLng;
      marker.setPosition(latlng);
      
      setEditStation({
        ...editStation,
        location: {
          type: 'Point',
          coordinates: [latlng.getLng(), latlng.getLat()]
        }
      });
    });
  };

  // Filter stations based on search query
  const filteredStations = searchQuery ? 
    stations.filter(station => station.name.toLowerCase().includes(searchQuery.toLowerCase())) : 
    stations;

  const handleStationClick = (station) => {
    setSelectedStation(station);
    setShowAddForm(false);
    setShowEditForm(false);
    
    // Initialize map after component renders
    setTimeout(() => {
      if (mapContainerRef.current) {
        initDetailMap();
      }
    }, 0);
  };

  const handleAddStationClick = () => {
    setSelectedStation(null);
    setShowAddForm(true);
    setShowEditForm(false);
    setNewStation({
      name: '',
  location: {
    type: 'Point',
    coordinates: [129.3780, 35.5665] // 경도, 위도 순서로 변경
  },
  organizationId: 'Uasidnw'
    });
    
    // Initialize map after component renders
    setTimeout(() => {
      if (addMapContainerRef.current) {
        initAddMap();
      }
    }, 0);
  };

  const handleDeleteStation = async (id) => {
    if (window.confirm('정말로 이 정류장을 삭제하시겠습니까?')) {
      try {
        await axios.delete(`${API_BASE_URL}/station/${id}`);
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

  const handleAddStation = async (e) => {
    e.preventDefault();
    
    console.log('보내는 데이터:', newStation); // 추가: 서버에 보내는 데이터 로깅
    
    try {
      const response = await axios.post(`${API_BASE_URL}/user/my-station`, newStation);
      setStations([...stations, response.data]);
      console.log('저장 데이터 : ', response.data);
      setShowAddForm(false);
    } catch (err) {
      console.error('Error adding station:', err);
      // 오류 응답이 있는 경우 자세한 정보 로깅
      if (err.response) {
        console.error('서버 응답:', err.response.data);
      }
      alert('정류장 등록에 실패했습니다.');
    }
  };

  const handleEditStationClick = () => {
    setShowEditForm(true);
    setEditStation({...selectedStation});
    
    // Initialize map after component renders
    setTimeout(() => {
      if (editMapContainerRef.current) {
        initEditMap();
      }
    }, 0);
  };

  const handleUpdateStation = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.put(`${API_BASE_URL}/station/${editStation.id}`, editStation);
      setStations(stations.map(station => 
        station.id === editStation.id ? response.data : station
      ));
      setSelectedStation(response.data);
      setShowEditForm(false);
    } catch (err) {
      console.error('Error updating station:', err);
      alert('정류장 수정에 실패했습니다.');
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
            <span>위도: {formData.location.coordinates[0].toFixed(6)}</span>
            <span>경도: {formData.location.coordinates[1].toFixed(6)}</span>
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