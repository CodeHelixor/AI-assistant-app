import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Tabs,
  Tab,
} from '@mui/material';
import Map, { Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import axios from 'axios';
import toast from 'react-hot-toast';

const locationTypes = [
  { value: 'all', label: 'All' },
  { value: 'restaurant', label: 'Restaurants' },
  { value: 'shop', label: 'Shops' },
  { value: 'beach', label: 'Beaches' },
  { value: 'pharmacy', label: 'Pharmacies' },
  { value: 'viewpoint', label: 'Viewpoints' },
  { value: 'historical_site', label: 'Historical Sites' },
];

const MapView = () => {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [property, setProperty] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 0,
    zoom: 12,
  });
  const propertyId = 1; // Should come from context

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (property?.latitude && property?.longitude) {
      setViewState({
        longitude: parseFloat(property.longitude),
        latitude: parseFloat(property.latitude),
        zoom: 12,
      });
    }
  }, [property]);

  const fetchData = async () => {
    try {
      const [locationsRes, propertyRes] = await Promise.all([
        axios.get(`/map/locations/${propertyId}`),
        axios.get(`/properties/${propertyId}`),
      ]);
      setLocations(locationsRes.data);
      setProperty(propertyRes.data);
    } catch (error) {
      toast.error('Failed to load map data');
    }
  };

  const filteredLocations = filterType === 'all'
    ? locations
    : locations.filter(loc => loc.type === filterType);

  const getLocationColor = (type) => {
    const colors = {
      restaurant: '#f44336',
      shop: '#2196f3',
      beach: '#00bcd4',
      pharmacy: '#4caf50',
      viewpoint: '#ff9800',
      historical_site: '#9c27b0',
    };
    return colors[type] || '#757575';
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight={600}>
        Interactive Map
      </Typography>

      <Tabs value={filterType} onChange={(e, newValue) => setFilterType(newValue)} sx={{ mb: 2 }}>
        {locationTypes.map((type) => (
          <Tab key={type.value} label={type.label} value={type.value} />
        ))}
      </Tabs>

      <Box sx={{ display: 'flex', gap: 2, height: 'calc(100vh - 300px)' }}>
        <Card sx={{ width: 300, overflow: 'auto' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Locations ({filteredLocations.length})
            </Typography>
            <List>
              {filteredLocations.map((location) => (
                <ListItem
                  key={location.id}
                  button
                  onClick={() => setSelectedLocation(location)}
                  selected={selectedLocation?.id === location.id}
                >
                  <ListItemText
                    primary={location.name}
                    secondary={
                      <Box>
                        <Chip
                          label={location.type}
                          size="small"
                          sx={{ bgcolor: getLocationColor(location.type), color: 'white', mb: 0.5 }}
                        />
                        {location.description && (
                          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                            {location.description.substring(0, 50)}...
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>

        <Box sx={{ flex: 1 }}>
          {process.env.REACT_APP_MAPBOX_TOKEN ? (
            <Map
              {...viewState}
              onMove={evt => setViewState(evt.viewState)}
              mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
              style={{ width: '100%', height: '100%' }}
              mapStyle="mapbox://styles/mapbox/streets-v11"
            >
              {property && (
                <Marker
                  longitude={parseFloat(property.longitude)}
                  latitude={parseFloat(property.latitude)}
                  color="#1976d2"
                />
              )}
              {filteredLocations.map((location) => (
                <Marker
                  key={location.id}
                  longitude={parseFloat(location.longitude)}
                  latitude={parseFloat(location.latitude)}
                  color={getLocationColor(location.type)}
                  onClick={() => setSelectedLocation(location)}
                />
              ))}
              {selectedLocation && (
                <Popup
                  longitude={parseFloat(selectedLocation.longitude)}
                  latitude={parseFloat(selectedLocation.latitude)}
                  anchor="bottom"
                  onClose={() => setSelectedLocation(null)}
                >
                  <Box sx={{ p: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {selectedLocation.name}
                    </Typography>
                    <Chip
                      label={selectedLocation.type}
                      size="small"
                      sx={{ bgcolor: getLocationColor(selectedLocation.type), color: 'white', my: 1 }}
                    />
                    {selectedLocation.description && (
                      <Typography variant="body2">{selectedLocation.description}</Typography>
                    )}
                    {selectedLocation.address && (
                      <Typography variant="caption" color="text.secondary">
                        📍 {selectedLocation.address}
                      </Typography>
                    )}
                  </Box>
                </Popup>
              )}
            </Map>
          ) : (
            <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CardContent>
                <Typography color="text.secondary">
                  Mapbox token not configured. Please set REACT_APP_MAPBOX_TOKEN in your environment.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default MapView;



