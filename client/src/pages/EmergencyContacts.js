import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Divider,
  Alert,
} from '@mui/material';
import {
  LocalFireDepartment,
  LocalPolice,
  LocalHospital,
  Phone,
  Description,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';

const EmergencyContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const propertyId = 1; // Should come from context

  useEffect(() => {
    fetchEmergencyContacts();
  }, []);

  const fetchEmergencyContacts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/map/emergency/${propertyId}`);
      setContacts(response.data);
    } catch (error) {
      console.error('Failed to load emergency contacts:', error);
      toast.error('Failed to load emergency contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  const getServiceIcon = (serviceType) => {
    switch (serviceType) {
      case 'fire':
        return <LocalFireDepartment sx={{ fontSize: 40, color: '#f44336' }} />;
      case 'police':
        return <LocalPolice sx={{ fontSize: 40, color: '#2196f3' }} />;
      case 'medical':
        return <LocalHospital sx={{ fontSize: 40, color: '#4caf50' }} />;
      default:
        return <Phone sx={{ fontSize: 40, color: '#757575' }} />;
    }
  };

  const getServiceColor = (serviceType) => {
    switch (serviceType) {
      case 'fire':
        return '#f44336';
      case 'police':
        return '#2196f3';
      case 'medical':
        return '#4caf50';
      default:
        return '#757575';
    }
  };

  const getServiceLabel = (serviceType) => {
    switch (serviceType) {
      case 'fire':
        return 'Fire Department';
      case 'police':
        return 'Police';
      case 'medical':
        return 'Medical Services';
      default:
        return 'Other';
    }
  };

  const getDefaultEmergencyNumber = (serviceType) => {
    // Default emergency numbers - can be customized per region
    switch (serviceType) {
      case 'fire':
        return '911';
      case 'police':
        return '911';
      case 'medical':
        return '911';
      default:
        return '911';
    }
  };

  // Group contacts by service type
  const groupedContacts = {
    fire: contacts.filter(c => c.service_type === 'fire'),
    police: contacts.filter(c => c.service_type === 'police'),
    medical: contacts.filter(c => c.service_type === 'medical'),
    other: contacts.filter(c => c.service_type === 'other'),
  };

  const serviceSections = [
    { type: 'fire', label: 'Fire Department', icon: <LocalFireDepartment /> },
    { type: 'police', label: 'Police', icon: <LocalPolice /> },
    { type: 'medical', label: 'Medical Services', icon: <LocalHospital /> },
  ];

  if (loading) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom fontWeight={600}>
          Emergency Contacts
        </Typography>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight={600}>
        Emergency Contacts
      </Typography>

      <Alert 
        severity="info" 
        sx={{ 
          mb: 3,
          borderRadius: 2,
          '& .MuiAlert-icon': {
            fontSize: 28,
          },
        }}
      >
        In case of emergency, contact the appropriate service immediately. Save these numbers for quick access.
      </Alert>

      <Grid container spacing={3}>
        {serviceSections.map((section) => {
          const sectionContacts = groupedContacts[section.type] || [];
          
          return (
            <Grid item xs={12} md={4} key={section.type}>
              <Card
                sx={{
                  height: '100%',
                  borderTop: `4px solid ${getServiceColor(section.type)}`,
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 2,
                  boxShadow: 2,
                  '&:hover': {
                    boxShadow: 4,
                  },
                  transition: 'box-shadow 0.2s ease-in-out',
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    {getServiceIcon(section.type)}
                    <Typography variant="h6" fontWeight={600}>
                      {section.label}
                    </Typography>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {sectionContacts.length > 0 ? (
                    <Box>
                      {sectionContacts.map((contact) => (
                        <Card
                          key={contact.id}
                          variant="outlined"
                          sx={{
                            mb: 2,
                            p: 2.5,
                            borderRadius: 2,
                            border: `1px solid ${getServiceColor(section.type)}20`,
                            '&:hover': {
                              boxShadow: 3,
                              border: `1px solid ${getServiceColor(section.type)}40`,
                              transform: 'translateY(-2px)',
                            },
                            transition: 'all 0.2s ease-in-out',
                          }}
                        >
                          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            {contact.name}
                          </Typography>
                          
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 1, 
                              mb: 1.5,
                              p: 1,
                              borderRadius: 1,
                              bgcolor: 'action.hover',
                            }}
                          >
                            <Phone sx={{ fontSize: 20, color: getServiceColor(section.type) }} />
                            <Typography 
                              variant="body1" 
                              fontWeight={600} 
                              sx={{ 
                                color: getServiceColor(section.type),
                                fontSize: '1rem',
                                letterSpacing: '0.02em',
                              }}
                            >
                              {contact.phone}
                            </Typography>
                          </Box>

                          {contact.description && (
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
                              <Description sx={{ fontSize: 18, color: 'text.secondary', mt: 0.5 }} />
                              <Typography variant="body2" color="text.secondary">
                                {contact.description}
                              </Typography>
                            </Box>
                          )}

                          <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            startIcon={<Phone />}
                            onClick={() => handleCall(contact.phone)}
                            sx={{
                              bgcolor: getServiceColor(section.type),
                              color: 'white',
                              fontWeight: 600,
                              py: 1.25,
                              borderRadius: 2,
                              boxShadow: 2,
                              textTransform: 'none',
                              fontSize: '0.95rem',
                              '&:hover': {
                                bgcolor: getServiceColor(section.type),
                                opacity: 0.9,
                                boxShadow: 4,
                                transform: 'translateY(-1px)',
                              },
                              transition: 'all 0.2s ease-in-out',
                            }}
                          >
                            Call Now
                          </Button>
                        </Card>
                      ))}
                    </Box>
                  ) : (
                    <Box 
                      sx={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        py: 4,
                        px: 2,
                        gap: 2,
                      }}
                    >
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<Phone />}
                        onClick={() => handleCall(getDefaultEmergencyNumber(section.type))}
                        fullWidth
                        sx={{
                          bgcolor: getServiceColor(section.type),
                          color: 'white',
                          fontWeight: 600,
                          py: 1.5,
                          px: 3,
                          borderRadius: 2,
                          boxShadow: 3,
                          textTransform: 'none',
                          fontSize: '1rem',
                          '&:hover': {
                            bgcolor: getServiceColor(section.type),
                            opacity: 0.9,
                            boxShadow: 5,
                            transform: 'translateY(-2px)',
                          },
                          transition: 'all 0.2s ease-in-out',
                        }}
                      >
                        Call {getDefaultEmergencyNumber(section.type)}
                      </Button>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{
                          fontSize: '0.85rem',
                          mt: 1,
                        }}
                      >
                        Emergency number
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {groupedContacts.other.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Other Emergency Contacts
          </Typography>
          <Grid container spacing={2}>
            {groupedContacts.other.map((contact) => (
              <Grid item xs={12} sm={6} md={4} key={contact.id}>
                <Card 
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    height: '100%',
                    '&:hover': {
                      boxShadow: 3,
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      {contact.name}
                    </Typography>
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1, 
                        mb: 1.5,
                        p: 1,
                        borderRadius: 1,
                        bgcolor: 'action.hover',
                      }}
                    >
                      <Phone sx={{ fontSize: 20, color: 'primary.main' }} />
                      <Typography 
                        variant="body1" 
                        fontWeight={600} 
                        sx={{ 
                          color: 'primary.main',
                          fontSize: '1rem',
                          letterSpacing: '0.02em',
                        }}
                      >
                        {contact.phone}
                      </Typography>
                    </Box>
                    {contact.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {contact.description}
                      </Typography>
                    )}
                    <Button
                      variant="outlined"
                      fullWidth
                      size="large"
                      startIcon={<Phone />}
                      onClick={() => handleCall(contact.phone)}
                      sx={{
                        fontWeight: 600,
                        py: 1.25,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '0.95rem',
                        borderWidth: 2,
                        '&:hover': {
                          borderWidth: 2,
                          transform: 'translateY(-1px)',
                          boxShadow: 2,
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      Call Now
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {contacts.length === 0 && (
        <Card 
          sx={{ 
            mt: 3,
            borderRadius: 2,
            boxShadow: 1,
          }}
        >
          <CardContent>
            <Typography 
              variant="body1" 
              color="text.secondary" 
              align="center" 
              sx={{ 
                py: 4,
                fontSize: '1rem',
              }}
            >
              No emergency contacts available for this property.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default EmergencyContacts;

