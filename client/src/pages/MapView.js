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
  const propertyId = 1; // Should come from context

  useEffect(() => {
    fetchData();
  }, []);

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

  // Generate Google Maps embed URL based on property location
  const getGoogleMapsUrl = () => {
    if (!property) return null;
    
    // Prefer coordinates if available (more accurate)
    if (property.latitude && property.longitude) {
      return `https://www.google.com/maps?q=${property.latitude},${property.longitude}&output=embed`;
    }
    
    // Fall back to address if coordinates not available
    if (property.address) {
      const encodedAddress = encodeURIComponent(property.address);
      return `https://www.google.com/maps?q=${encodedAddress}&output=embed`;
    }
    
    return null;
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
          {getGoogleMapsUrl() ? (
            <Box 
              sx={{ 
                height: '100%',
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: 3,
                border: 1,
                borderColor: 'divider'
              }}
            >
              <iframe
                src={getGoogleMapsUrl()}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`${property?.name || 'Property'} Location`}
              />
            </Box>
          ) : (
            <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CardContent>
                <Typography color="text.secondary">
                  {property ? 'No location information available for this property.' : 'Loading property information...'}
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



