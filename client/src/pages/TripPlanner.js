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
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Grid,
  MenuItem,
} from '@mui/material';
import {
  Add,
  Delete,
  LocationOn,
  CalendarToday,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const TripPlanner = () => {
  const [savedLocations, setSavedLocations] = useState([]);
  const [itineraries, setItineraries] = useState([]);
  const [locations, setLocations] = useState([]);
  const [openItineraryDialog, setOpenItineraryDialog] = useState(false);
  const [itineraryForm, setItineraryForm] = useState({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    activities: '',
  });
  const propertyId = 1; // Should come from context

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [savedRes, itinerariesRes, locationsRes] = await Promise.all([
        axios.get('/trip-planner/saved-locations'),
        axios.get('/trip-planner/itineraries'),
        axios.get(`/map/locations/${propertyId}`),
      ]);
      setSavedLocations(savedRes.data);
      setItineraries(itinerariesRes.data);
      setLocations(locationsRes.data);
    } catch (error) {
      toast.error('Failed to load trip planner data');
    }
  };

  const handleSaveLocation = async (locationId) => {
    try {
      await axios.post('/trip-planner/save-location', { location_id: locationId });
      toast.success('Location saved');
      fetchData();
    } catch (error) {
      toast.error('Failed to save location');
    }
  };

  const handleRemoveLocation = async (id) => {
    try {
      await axios.delete(`/trip-planner/saved-locations/${id}`);
      toast.success('Location removed');
      fetchData();
    } catch (error) {
      toast.error('Failed to remove location');
    }
  };

  const handleCreateItinerary = async () => {
    try {
      const activities = itineraryForm.activities.split('\n').filter(a => a.trim());
      await axios.post('/trip-planner/itinerary', {
        title: itineraryForm.title,
        date: itineraryForm.date,
        activities: activities,
      });
      toast.success('Itinerary created');
      setOpenItineraryDialog(false);
      setItineraryForm({ title: '', date: format(new Date(), 'yyyy-MM-dd'), activities: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to create itinerary');
    }
  };

  const handleDeleteItinerary = async (id) => {
    try {
      await axios.delete(`/trip-planner/itinerary/${id}`);
      toast.success('Itinerary deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete itinerary');
    }
  };

  const generateItinerary = async () => {
    try {
      const response = await axios.post('/ai-assistant/generate-itinerary', {
        property_id: propertyId,
        date: itineraryForm.date,
      });
      setItineraryForm({
        ...itineraryForm,
        activities: response.data.itinerary,
      });
      toast.success('AI itinerary generated!');
    } catch (error) {
      toast.error('Failed to generate itinerary');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Trip Planner
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenItineraryDialog(true)}
        >
          New Itinerary
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Saved Locations
              </Typography>
              {savedLocations.length > 0 ? (
                <List>
                  {savedLocations.map((location) => (
                    <ListItem key={location.id}>
                      <ListItemText
                        primary={location.custom_name || location.name}
                        secondary={
                          <Box>
                            <Chip label={location.type} size="small" sx={{ mr: 1 }} />
                            {location.notes && (
                              <Typography variant="caption" color="text.secondary">
                                {location.notes}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => handleRemoveLocation(location.id)}>
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No saved locations. Save locations from the Map view.
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Available Locations
              </Typography>
              <List>
                {locations.slice(0, 5).map((location) => (
                  <ListItem key={location.id}>
                    <ListItemText
                      primary={location.name}
                      secondary={
                        <Chip label={location.type} size="small" />
                      }
                    />
                    <ListItemSecondaryAction>
                      <Button
                        size="small"
                        onClick={() => handleSaveLocation(location.id)}
                        disabled={savedLocations.some(sl => sl.location_id === location.id)}
                      >
                        Save
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                My Itineraries
              </Typography>
              {itineraries.length > 0 ? (
                <List>
                  {itineraries.map((itinerary) => (
                    <ListItem key={itinerary.id}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarToday fontSize="small" />
                            {itinerary.title}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              {format(new Date(itinerary.date), 'MMMM d, yyyy')}
                            </Typography>
                            {itinerary.activities && (
                              <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                                {typeof itinerary.activities === 'string' 
                                  ? itinerary.activities 
                                  : JSON.stringify(itinerary.activities)}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => handleDeleteItinerary(itinerary.id)}>
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No itineraries yet. Create one to start planning!
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={openItineraryDialog} onClose={() => setOpenItineraryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Itinerary</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={itineraryForm.title}
            onChange={(e) => setItineraryForm({ ...itineraryForm, title: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Date"
            type="date"
            value={itineraryForm.date}
            onChange={(e) => setItineraryForm({ ...itineraryForm, date: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
            <Button size="small" onClick={generateItinerary}>
              Generate with AI
            </Button>
          </Box>
          <TextField
            fullWidth
            label="Activities"
            value={itineraryForm.activities}
            onChange={(e) => setItineraryForm({ ...itineraryForm, activities: e.target.value })}
            margin="normal"
            multiline
            rows={8}
            placeholder="Enter activities, one per line, or use AI to generate..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenItineraryDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateItinerary} variant="contained" disabled={!itineraryForm.title}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TripPlanner;



