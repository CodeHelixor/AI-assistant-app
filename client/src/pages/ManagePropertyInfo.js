import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Build,
  Gavel,
  Star,
  Add,
  Edit,
  Delete,
  Save,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';

const ManagePropertyInfo = () => {
  const [property, setProperty] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [equipmentDialog, setEquipmentDialog] = useState({ open: false, editing: null });
  const [ruleDialog, setRuleDialog] = useState({ open: false, editing: null });
  const propertyId = 1; // Should come from context

  // Property form state
  const [propertyForm, setPropertyForm] = useState({
    name: '',
    address: '',
    description: '',
    check_in_time: '',
    check_out_time: '',
    max_guests: '',
    latitude: '',
    longitude: '',
  });

  // Equipment form state
  const [equipmentForm, setEquipmentForm] = useState({
    equipment_name: '',
    instructions: '',
    troubleshooting: '',
    image_url: '',
  });

  // Rule form state
  const [ruleForm, setRuleForm] = useState({
    rule_text: '',
    category: '',
  });

  // Stargazing form state
  const [stargazingForm, setStargazingForm] = useState({
    tips: '',
    best_viewing_times: '',
    recommended_locations: '',
  });

  useEffect(() => {
    fetchPropertyInfo();
  }, []);

  const fetchPropertyInfo = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/properties/${propertyId}`);
      const data = response.data;
      setProperty(data);
      
      // Populate forms
      setPropertyForm({
        name: data.name || '',
        address: data.address || '',
        description: data.description || '',
        check_in_time: data.check_in_time ? (typeof data.check_in_time === 'string' ? data.check_in_time.substring(0, 5) : '') : '',
        check_out_time: data.check_out_time ? (typeof data.check_out_time === 'string' ? data.check_out_time.substring(0, 5) : '') : '',
        max_guests: data.max_guests || '',
        latitude: data.latitude || '',
        longitude: data.longitude || '',
      });

      if (data.stargazing_info) {
        setStargazingForm({
          tips: data.stargazing_info.tips || '',
          best_viewing_times: data.stargazing_info.best_viewing_times || '',
          recommended_locations: data.stargazing_info.recommended_locations || '',
        });
      } else {
        setStargazingForm({
          tips: '',
          best_viewing_times: '',
          recommended_locations: '',
        });
      }
    } catch (error) {
      console.error('Fetch property error:', error);
      // If property doesn't exist (404), that's okay - user can create it
      if (error.response?.status === 404) {
        setProperty(null);
        // Keep form empty so user can fill it out
        setPropertyForm({
          name: '',
          address: '',
          description: '',
          check_in_time: '',
          check_out_time: '',
          max_guests: '',
          latitude: '',
          longitude: '',
        });
        setStargazingForm({
          tips: '',
          best_viewing_times: '',
          recommended_locations: '',
        });
      } else {
        const errorMessage = error.response?.data?.error || error.message || 'Failed to load property information';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePropertySave = async () => {
    try {
      if (!propertyForm.name) {
        toast.error('Property name is required');
        return;
      }
      
      setSaving(true);
      
      // Prepare data for API
      const propertyData = {
        name: propertyForm.name,
        address: propertyForm.address || null,
        description: propertyForm.description || null,
        check_in_time: propertyForm.check_in_time || null,
        check_out_time: propertyForm.check_out_time || null,
        max_guests: propertyForm.max_guests ? parseInt(propertyForm.max_guests) : null,
        latitude: propertyForm.latitude ? parseFloat(propertyForm.latitude) : null,
        longitude: propertyForm.longitude ? parseFloat(propertyForm.longitude) : null,
      };

      // If property exists, update it; otherwise create it
      if (property) {
        // Update existing property
        try {
          await axios.put(`/properties/${propertyId}`, propertyData);
          toast.success('Property information updated successfully');
        } catch (error) {
          // If update fails with 404, try to create instead
          if (error.response?.status === 404) {
            propertyData.id = propertyId;
            await axios.post('/properties', propertyData);
            toast.success('Property created successfully');
          } else {
            throw error;
          }
        }
      } else {
        // Create new property
        propertyData.id = propertyId;
        await axios.post('/properties', propertyData);
        toast.success('Property created successfully');
      }
      
      // Refresh property data
      await fetchPropertyInfo();
    } catch (error) {
      console.error('Save property error:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      
      let errorMessage = 'Failed to save property information';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 404) {
        errorMessage = 'Route not found. Please check server configuration.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to perform this action.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEquipmentOpen = (equipment = null) => {
    if (equipment) {
      setEquipmentForm({
        equipment_name: equipment.equipment_name || '',
        instructions: equipment.instructions || '',
        troubleshooting: equipment.troubleshooting || '',
        image_url: equipment.image_url || '',
      });
      setEquipmentDialog({ open: true, editing: equipment.id });
    } else {
      setEquipmentForm({
        equipment_name: '',
        instructions: '',
        troubleshooting: '',
        image_url: '',
      });
      setEquipmentDialog({ open: true, editing: null });
    }
  };

  const handleEquipmentSave = async () => {
    try {
      if (!equipmentForm.equipment_name || !equipmentForm.instructions) {
        toast.error('Equipment name and instructions are required');
        return;
      }

      if (equipmentDialog.editing) {
        await axios.put(`/properties/${propertyId}/equipment/${equipmentDialog.editing}`, equipmentForm);
        toast.success('Equipment updated successfully');
      } else {
        await axios.post(`/properties/${propertyId}/equipment`, equipmentForm);
        toast.success('Equipment added successfully');
      }
      setEquipmentDialog({ open: false, editing: null });
      fetchPropertyInfo();
    } catch (error) {
      console.error('Save equipment error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save equipment';
      toast.error(errorMessage);
    }
  };

  const handleEquipmentDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this equipment?')) return;
    try {
      await axios.delete(`/properties/${propertyId}/equipment/${id}`);
      toast.success('Equipment deleted successfully');
      fetchPropertyInfo();
    } catch (error) {
      console.error('Delete equipment error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete equipment';
      toast.error(errorMessage);
    }
  };

  const handleRuleOpen = (rule = null) => {
    if (rule) {
      setRuleForm({
        rule_text: rule.rule_text || '',
        category: rule.category || '',
      });
      setRuleDialog({ open: true, editing: rule.id });
    } else {
      setRuleForm({
        rule_text: '',
        category: '',
      });
      setRuleDialog({ open: true, editing: null });
    }
  };

  const handleRuleSave = async () => {
    try {
      if (!ruleForm.rule_text) {
        toast.error('Rule text is required');
        return;
      }

      if (ruleDialog.editing) {
        await axios.put(`/properties/${propertyId}/rules/${ruleDialog.editing}`, ruleForm);
        toast.success('Rule updated successfully');
      } else {
        await axios.post(`/properties/${propertyId}/rules`, ruleForm);
        toast.success('Rule added successfully');
      }
      setRuleDialog({ open: false, editing: null });
      fetchPropertyInfo();
    } catch (error) {
      console.error('Save rule error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save rule';
      toast.error(errorMessage);
    }
  };

  const handleRuleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;
    try {
      await axios.delete(`/properties/${propertyId}/rules/${id}`);
      toast.success('Rule deleted successfully');
      fetchPropertyInfo();
    } catch (error) {
      console.error('Delete rule error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete rule';
      toast.error(errorMessage);
    }
  };

  const handleStargazingSave = async () => {
    try {
      setSaving(true);
      await axios.put(`/properties/${propertyId}/stargazing`, stargazingForm);
      toast.success('Stargazing information updated successfully');
      await fetchPropertyInfo();
    } catch (error) {
      console.error('Save stargazing error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update stargazing information';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  // If property doesn't exist, show message but allow creation
  const propertyNotFound = !property;

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight={600}>
        Manage Property Information
      </Typography>

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab icon={<Build />} iconPosition="start" label="Property Details" />
        <Tab icon={<Build />} iconPosition="start" label="Equipment" />
        <Tab icon={<Gavel />} iconPosition="start" label="House Rules" />
        <Tab icon={<Star />} iconPosition="start" label="Stargazing" />
      </Tabs>

      {/* Property Details Tab */}
      {tabValue === 0 && (
        <Card>
          <CardContent>
            {propertyNotFound && (
              <Box sx={{ mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="body2" color="info.dark">
                  Property not found. Fill out the form below to create a new property.
                </Typography>
              </Box>
            )}
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              Basic Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Property Name"
                  value={propertyForm.name}
                  onChange={(e) => setPropertyForm({ ...propertyForm, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={propertyForm.address}
                  onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={propertyForm.description}
                  onChange={(e) => setPropertyForm({ ...propertyForm, description: e.target.value })}
                  multiline
                  rows={4}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Check-in Time"
                  type="time"
                  value={propertyForm.check_in_time}
                  onChange={(e) => setPropertyForm({ ...propertyForm, check_in_time: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Check-out Time"
                  type="time"
                  value={propertyForm.check_out_time}
                  onChange={(e) => setPropertyForm({ ...propertyForm, check_out_time: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Max Guests"
                  type="number"
                  value={propertyForm.max_guests}
                  onChange={(e) => setPropertyForm({ ...propertyForm, max_guests: e.target.value })}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="Latitude"
                  type="number"
                  value={propertyForm.latitude}
                  onChange={(e) => setPropertyForm({ ...propertyForm, latitude: e.target.value })}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="Longitude"
                  type="number"
                  value={propertyForm.longitude}
                  onChange={(e) => setPropertyForm({ ...propertyForm, longitude: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                  onClick={handlePropertySave}
                  disabled={saving || !propertyForm.name}
                >
                  {saving ? 'Saving...' : 'Save Property Information'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Equipment Tab */}
      {tabValue === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Equipment Instructions</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleEquipmentOpen()}
            >
              Add Equipment
            </Button>
          </Box>
          {property?.equipment_instructions?.length > 0 ? (
            property.equipment_instructions.map((equipment) => (
              <Card key={equipment.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {equipment.equipment_name}
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>
                        {equipment.instructions}
                      </Typography>
                      {equipment.troubleshooting && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                            Troubleshooting:
                          </Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {equipment.troubleshooting}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    <Box>
                      <IconButton onClick={() => handleEquipmentOpen(equipment)} color="primary">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleEquipmentDelete(equipment.id)} color="error">
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent>
                <Typography color="text.secondary">No equipment instructions. Click "Add Equipment" to get started.</Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* House Rules Tab */}
      {tabValue === 2 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">House Rules</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleRuleOpen()}
            >
              Add Rule
            </Button>
          </Box>
          {property?.house_rules?.length > 0 ? (
            property.house_rules.map((rule, idx) => (
              <Card key={rule.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Box sx={{ flex: 1, display: 'flex', gap: 2 }}>
                      <Chip label={idx + 1} size="small" />
                      {rule.category && <Chip label={rule.category} size="small" variant="outlined" />}
                      <Typography variant="body1" sx={{ flex: 1 }}>
                        {rule.rule_text}
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton onClick={() => handleRuleOpen(rule)} color="primary">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleRuleDelete(rule.id)} color="error">
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent>
                <Typography color="text.secondary">No house rules. Click "Add Rule" to get started.</Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* Stargazing Tab */}
      {tabValue === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              Stargazing Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tips"
                  value={stargazingForm.tips}
                  onChange={(e) => setStargazingForm({ ...stargazingForm, tips: e.target.value })}
                  multiline
                  rows={4}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Best Viewing Times"
                  value={stargazingForm.best_viewing_times}
                  onChange={(e) => setStargazingForm({ ...stargazingForm, best_viewing_times: e.target.value })}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Recommended Locations"
                  value={stargazingForm.recommended_locations}
                  onChange={(e) => setStargazingForm({ ...stargazingForm, recommended_locations: e.target.value })}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                  onClick={handleStargazingSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Stargazing Information'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Equipment Dialog */}
      <Dialog open={equipmentDialog.open} onClose={() => setEquipmentDialog({ open: false, editing: null })} maxWidth="md" fullWidth>
        <DialogTitle>{equipmentDialog.editing ? 'Edit Equipment' : 'Add Equipment'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Equipment Name"
                value={equipmentForm.equipment_name}
                onChange={(e) => setEquipmentForm({ ...equipmentForm, equipment_name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Instructions"
                value={equipmentForm.instructions}
                onChange={(e) => setEquipmentForm({ ...equipmentForm, instructions: e.target.value })}
                multiline
                rows={6}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Troubleshooting"
                value={equipmentForm.troubleshooting}
                onChange={(e) => setEquipmentForm({ ...equipmentForm, troubleshooting: e.target.value })}
                multiline
                rows={4}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Image URL"
                value={equipmentForm.image_url}
                onChange={(e) => setEquipmentForm({ ...equipmentForm, image_url: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEquipmentDialog({ open: false, editing: null })}>Cancel</Button>
          <Button onClick={handleEquipmentSave} variant="contained" disabled={!equipmentForm.equipment_name || !equipmentForm.instructions}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rule Dialog */}
      <Dialog open={ruleDialog.open} onClose={() => setRuleDialog({ open: false, editing: null })} maxWidth="sm" fullWidth>
        <DialogTitle>{ruleDialog.editing ? 'Edit Rule' : 'Add Rule'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Rule Text"
                value={ruleForm.rule_text}
                onChange={(e) => setRuleForm({ ...ruleForm, rule_text: e.target.value })}
                multiline
                rows={3}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Category (optional)"
                value={ruleForm.category}
                onChange={(e) => setRuleForm({ ...ruleForm, category: e.target.value })}
                placeholder="e.g., Noise, Pets, Smoking"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRuleDialog({ open: false, editing: null })}>Cancel</Button>
          <Button onClick={handleRuleSave} variant="contained" disabled={!ruleForm.rule_text}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManagePropertyInfo;

