import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
} from '@mui/material';
import {
  Restaurant,
  LocalTaxi,
  Explore,
  CleaningServices,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const serviceTypes = [
  { type: 'food_delivery', label: 'Food Delivery', icon: <Restaurant />, color: 'primary' },
  { type: 'taxi', label: 'Taxi Booking', icon: <LocalTaxi />, color: 'secondary' },
  { type: 'excursion', label: 'Excursions', icon: <Explore />, color: 'success' },
  { type: 'cleaning', label: 'Cleaning Services', icon: <CleaningServices />, color: 'info' },
];

const Services = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get('/services');
      setServices(response.data);
    } catch (error) {
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const getServiceTypeInfo = (type) => {
    return serviceTypes.find(st => st.type === type) || serviceTypes[0];
  };

  const groupedServices = serviceTypes.reduce((acc, st) => {
    acc[st.type] = services.filter(s => s.type === st.type);
    return acc;
  }, {});

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight={600}>
        Services
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Request services during your stay
      </Typography>

      {serviceTypes.map((serviceType) => (
        <Box key={serviceType.type} sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            {serviceType.icon}
            <Typography variant="h6" fontWeight={600}>
              {serviceType.label}
            </Typography>
            <Chip label={groupedServices[serviceType.type]?.length || 0} size="small" />
          </Box>

          <Grid container spacing={2}>
            {groupedServices[serviceType.type]?.length > 0 ? (
              groupedServices[serviceType.type].map((service) => (
                <Grid item xs={12} sm={6} md={4} key={service.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {service.name}
                      </Typography>
                      {service.partner_name && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          by {service.partner_name}
                        </Typography>
                      )}
                      {service.description && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {service.description}
                        </Typography>
                      )}
                      {service.price && (
                        <Typography variant="h6" color="primary">
                          €{service.price}
                        </Typography>
                      )}
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => navigate(`/services/${serviceType.type}`, { state: { service } })}
                      >
                        Request
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      No {serviceType.label.toLowerCase()} available at the moment.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Box>
      ))}
    </Box>
  );
};

export default Services;



