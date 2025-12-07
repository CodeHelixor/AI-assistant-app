import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import {
  ExpandMore,
  Build,
  Gavel,
  Star,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';

const PropertyInfo = () => {
  const [property, setProperty] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const propertyId = 1; // Should come from context

  useEffect(() => {
    fetchPropertyInfo();
  }, []);

  const fetchPropertyInfo = async () => {
    try {
      const response = await axios.get(`/properties/${propertyId}`);
      setProperty(response.data);
    } catch (error) {
      toast.error('Failed to load property information');
    }
  };

  if (!property) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight={600}>
        Property Information
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {property.name}
          </Typography>
          {property.address && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              📍 {property.address}
            </Typography>
          )}
          {property.description && (
            <Typography variant="body1" sx={{ mt: 2 }}>
              {property.description}
            </Typography>
          )}
        </CardContent>
      </Card>

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
        <Tab icon={<Build />} iconPosition="start" label="Equipment" />
        <Tab icon={<Gavel />} iconPosition="start" label="House Rules" />
        <Tab icon={<Star />} iconPosition="start" label="Stargazing" />
      </Tabs>

      {tabValue === 0 && (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Equipment Instructions
          </Typography>
          {property.equipment_instructions?.length > 0 ? (
            property.equipment_instructions.map((equipment) => (
              <Accordion key={equipment.id} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography fontWeight={600}>{equipment.equipment_name}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                    {equipment.instructions}
                  </Typography>
                  {equipment.troubleshooting && (
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Troubleshooting:
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {equipment.troubleshooting}
                      </Typography>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            ))
          ) : (
            <Card>
              <CardContent>
                <Typography color="text.secondary">No equipment instructions available.</Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            House Rules
          </Typography>
          {property.house_rules?.length > 0 ? (
            <Card>
              <CardContent>
                {property.house_rules.map((rule, idx) => (
                  <Box key={rule.id} sx={{ mb: 2, display: 'flex', gap: 2 }}>
                    <Chip label={idx + 1} size="small" />
                    <Typography variant="body1" sx={{ flex: 1 }}>
                      {rule.rule_text}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <Typography color="text.secondary">No house rules listed.</Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {tabValue === 2 && property.stargazing_info && (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Stargazing Information
          </Typography>
          <Card>
            <CardContent>
              {property.stargazing_info.tips && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Tips
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {property.stargazing_info.tips}
                  </Typography>
                </Box>
              )}
              {property.stargazing_info.best_viewing_times && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Best Viewing Times
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {property.stargazing_info.best_viewing_times}
                  </Typography>
                </Box>
              )}
              {property.stargazing_info.recommended_locations && (
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Recommended Locations
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {property.stargazing_info.recommended_locations}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default PropertyInfo;



