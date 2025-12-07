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
  List,
  ListItem,
  ListItemText,
  Chip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { Add, ReportProblem } from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';

const Issues = () => {
  const [issues, setIssues] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    issue_type: 'maintenance',
    title: '',
    description: '',
  });
  const [booking, setBooking] = useState(null);
  const propertyId = 1; // Should come from context

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [issuesRes, bookingRes] = await Promise.all([
        axios.get('/issues/my-issues'),
        axios.get(`/properties/${propertyId}/active-booking`).catch(() => null),
      ]);
      setIssues(issuesRes.data);
      if (bookingRes) setBooking(bookingRes.data);
    } catch (error) {
      toast.error('Failed to load issues');
    }
  };

  const handleSubmit = async () => {
    if (!booking) {
      toast.error('No active booking found');
      return;
    }

    try {
      await axios.post('/issues', {
        booking_id: booking.id,
        property_id: propertyId,
        ...formData,
      });
      toast.success('Issue reported successfully');
      setOpenDialog(false);
      setFormData({ issue_type: 'maintenance', title: '', description: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to report issue');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      reported: 'default',
      in_progress: 'warning',
      resolved: 'success',
    };
    return colors[status] || 'default';
  };

  const getTypeColor = (type) => {
    const colors = {
      damage: 'error',
      maintenance: 'warning',
      other: 'info',
    };
    return colors[type] || 'default';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Report Issue
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
          disabled={!booking}
        >
          Report Issue
        </Button>
      </Box>

      {!booking && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography color="text.secondary">
              No active booking found. You can report issues during your stay.
            </Typography>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            My Reports
          </Typography>
          {issues.length > 0 ? (
            <List>
              {issues.map((issue) => (
                <ListItem key={issue.id} sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', width: '100%' }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                          <ReportProblem />
                          {issue.title}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            {issue.description}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                              label={issue.issue_type}
                              size="small"
                              color={getTypeColor(issue.issue_type)}
                            />
                            <Chip
                              label={issue.status}
                              size="small"
                              color={getStatusColor(issue.status)}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {new Date(issue.created_at).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </Box>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No issues reported yet.
            </Typography>
          )}
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Report an Issue</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Issue Type</InputLabel>
            <Select
              value={formData.issue_type}
              onChange={(e) => setFormData({ ...formData, issue_type: e.target.value })}
              label="Issue Type"
            >
              <MenuItem value="damage">Damage</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={4}
            required
            placeholder="Describe the issue in detail..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.title || !formData.description}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Issues;



