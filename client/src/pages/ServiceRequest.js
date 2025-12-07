import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
} from '@mui/material';
import axios from 'axios';
import toast from 'react-hot-toast';

const ServiceRequest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { type } = useParams();
  const [formData, setFormData] = useState({
    service_id: '',
    partner_id: '',
    price: '',
    details: '',
  });
  const [services, setServices] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const propertyId = 1; // Should come from context

  const selectedService = location.state?.service;

  useEffect(() => {
    if (selectedService) {
      setFormData({
        service_id: selectedService.id,
        partner_id: selectedService.partner_id || '',
        price: selectedService.price || '',
        details: '',
      });
    }
    fetchData();
  }, [type, selectedService]);

  const fetchData = async () => {
    try {
      const [servicesRes, partnersRes] = await Promise.all([
        axios.get(`/services?type=${type}`),
        axios.get(`/services/partners?service_type=${type}`),
      ]);
      setServices(servicesRes.data);
      setPartners(partnersRes.data);
    } catch (error) {
      toast.error('Failed to load service data');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post('/orders', {
        property_id: propertyId,
        service_id: formData.service_id || null,
        partner_id: formData.partner_id || null,
        service_type: type,
        price: formData.price ? parseFloat(formData.price) : null,
        order_details: formData.details ? { notes: formData.details } : null,
      });

      toast.success('Service request submitted successfully');
      navigate('/services');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight={600}>
        Request {type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Typography>

      <Card sx={{ maxWidth: 600, mt: 3 }}>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit}>
            {!selectedService && services.length > 0 && (
              <FormControl fullWidth margin="normal">
                <InputLabel>Select Service</InputLabel>
                <Select
                  name="service_id"
                  value={formData.service_id}
                  onChange={handleChange}
                  label="Select Service"
                >
                  {services.map((service) => (
                    <MenuItem key={service.id} value={service.id}>
                      {service.name} {service.price && `- €${service.price}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {partners.length > 0 && (
              <FormControl fullWidth margin="normal">
                <InputLabel>Select Partner</InputLabel>
                <Select
                  name="partner_id"
                  value={formData.partner_id}
                  onChange={handleChange}
                  label="Select Partner"
                >
                  {partners.map((partner) => (
                    <MenuItem key={partner.id} value={partner.id}>
                      {partner.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {!formData.price && (
              <TextField
                fullWidth
                label="Price (optional)"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                margin="normal"
                inputProps={{ step: '0.01' }}
              />
            )}

            <TextField
              fullWidth
              label="Additional Details"
              name="details"
              value={formData.details}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={4}
              placeholder="Any special requests or notes..."
            />

            <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
              Your request will be sent to the service provider. They will contact you to confirm details.
            </Alert>

            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/services')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ServiceRequest;



