import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  Alert,
} from '@mui/material';
import { Star } from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';

const Feedback = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    rating: 5,
    comments: '',
  });
  const [booking, setBooking] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const propertyId = 1; // Should come from context

  useEffect(() => {
    fetchActiveBooking();
  }, []);

  const fetchActiveBooking = async () => {
    try {
      const response = await axios.get(`/properties/${propertyId}/active-booking`);
      setBooking(response.data);
    } catch (error) {
      // No active booking
    }
  };

  const handleSubmit = async () => {
    if (!booking) {
      toast.error('No active booking found');
      return;
    }

    try {
      await axios.post('/feedback', {
        booking_id: booking.id,
        property_id: propertyId,
        ...formData,
      });
      toast.success('Thank you for your feedback!');
      setOpenDialog(false);
      setSubmitted(true);
      setFormData({ rating: 5, comments: '' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit feedback');
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight={600}>
        Guest Feedback
      </Typography>

      {submitted ? (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Alert severity="success">
              Thank you for your feedback! We appreciate your input.
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Share Your Experience
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                We'd love to hear about your stay. Your feedback helps us improve the experience for future guests.
              </Typography>
              <Button
                variant="contained"
                startIcon={<Star />}
                onClick={() => setOpenDialog(true)}
                disabled={!booking}
                sx={{ mt: 2 }}
              >
                Submit Feedback
              </Button>
              {!booking && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  You can submit feedback during or after your stay.
                </Alert>
              )}
            </CardContent>
          </Card>

          <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Rate Your Stay</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <Box>
                  <Typography component="legend" gutterBottom>
                    Overall Rating
                  </Typography>
                  <Rating
                    value={formData.rating}
                    onChange={(e, newValue) => setFormData({ ...formData, rating: newValue })}
                    size="large"
                  />
                </Box>
                <TextField
                  fullWidth
                  label="Comments (optional)"
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  multiline
                  rows={6}
                  placeholder="Tell us about your experience..."
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
              <Button onClick={handleSubmit} variant="contained" disabled={!formData.rating}>
                Submit
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
};

export default Feedback;



