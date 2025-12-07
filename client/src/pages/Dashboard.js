import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
} from '@mui/material';
import {
  WbSunny,
  RoomService,
  Map,
  SmartToy,
  Chat,
  Route,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [weather, setWeather] = useState(null);
  const [activeBooking, setActiveBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // In a real app, you'd get property_id from active booking or user context
      const propertyId = 1; // This should come from your booking/context
      
      // Fetch property info
      const propertyRes = await axios.get(`/properties/${propertyId}`);
      setProperty(propertyRes.data);

      // Fetch active booking
      try {
        const bookingRes = await axios.get(`/properties/${propertyId}/active-booking`);
        setActiveBooking(bookingRes.data);
      } catch (err) {
        // No active booking
      }

      // Fetch weather
      try {
        const weatherRes = await axios.get(`/weather/${propertyId}`);
        setWeather(weatherRes.data);
      } catch (err) {
        console.error('Weather fetch error:', err);
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { icon: <SmartToy />, label: 'AI Assistant', path: '/ai-assistant', color: 'primary' },
    { icon: <RoomService />, label: 'Services', path: '/services', color: 'secondary' },
    { icon: <Map />, label: 'Map', path: '/map', color: 'success' },
    { icon: <Chat />, label: 'Chat', path: '/chat', color: 'info' },
    { icon: <Route />, label: 'Trip Planner', path: '/trip-planner', color: 'warning' },
  ];

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={600}>
        Welcome to {property?.name || 'Your Stay'}
      </Typography>

      {activeBooking && (
        <Card sx={{ mb: 3, bgcolor: 'primary.main', color: 'white' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Active Booking
            </Typography>
            <Typography variant="body2">
              Check-in: {new Date(activeBooking.check_in_date).toLocaleDateString()} • 
              Check-out: {new Date(activeBooking.check_out_date).toLocaleDateString()}
            </Typography>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {weather && (
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <WbSunny sx={{ fontSize: 48, color: 'warning.main' }} />
                  <Box>
                    <Typography variant="h4" fontWeight={600}>
                      {Math.round(weather.temperature)}°C
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {weather.description}
                    </Typography>
                    {weather.uv_index && (
                      <Chip
                        label={`UV: ${weather.uv_index.toFixed(1)}`}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid item xs={12} md={weather ? 8 : 12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                {quickActions.map((action) => (
                  <Grid item xs={6} sm={4} key={action.path}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={action.icon}
                      onClick={() => navigate(action.path)}
                      sx={{ py: 2 }}
                    >
                      {action.label}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Property Information
          </Typography>
          {property && (
            <Box>
              <Typography variant="body1" paragraph>
                {property.description || 'No description available'}
              </Typography>
              {property.address && (
                <Typography variant="body2" color="text.secondary">
                  📍 {property.address}
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;



