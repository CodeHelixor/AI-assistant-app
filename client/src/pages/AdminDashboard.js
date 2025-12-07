import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab,
} from '@mui/material';
import {
  TrendingUp,
  AttachMoney,
  ShoppingCart,
  Download,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const AdminDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [orders, setOrders] = useState([]);
  const [commissions, setCommissions] = useState(null);
  const [filters, setFilters] = useState({
    partner_id: '',
    service_type: '',
    status: '',
    start_date: '',
    end_date: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tabValue === 0) {
      fetchOrders();
    } else if (tabValue === 1) {
      fetchCommissions();
    }
  }, [tabValue, filters]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      const response = await axios.get(`/admin/orders?${params.toString()}`);
      setOrders(response.data);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.partner_id) params.append('partner_id', filters.partner_id);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      const response = await axios.get(`/admin/commissions?${params.toString()}`);
      setCommissions(response.data);
    } catch (error) {
      toast.error('Failed to load commission data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      const response = await axios.get(`/admin/orders/export?${params.toString()}`);
      
      // Convert to CSV
      const headers = Object.keys(response.data.data[0] || {});
      const csv = [
        headers.join(','),
        ...response.data.data.map(row => 
          headers.map(header => {
            const value = row[header];
            return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Export completed');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'default',
      confirmed: 'info',
      in_progress: 'warning',
      completed: 'success',
      cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight={600}>
        Admin Dashboard
      </Typography>

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label="Orders" />
        <Tab label="Commissions" />
      </Tabs>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Service Type</InputLabel>
                <Select
                  value={filters.service_type}
                  onChange={(e) => setFilters({ ...filters, service_type: e.target.value })}
                  label="Service Type"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="food_delivery">Food Delivery</MenuItem>
                  <MenuItem value="taxi">Taxi</MenuItem>
                  <MenuItem value="excursion">Excursion</MenuItem>
                  <MenuItem value="cleaning">Cleaning</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Download />}
                onClick={handleExport}
                sx={{ height: '100%' }}
              >
                Export CSV
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {tabValue === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Orders ({orders.length})
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Guest</TableCell>
                    <TableCell>Property</TableCell>
                    <TableCell>Service</TableCell>
                    <TableCell>Partner</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Commission</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        {format(new Date(order.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {order.guest_first_name} {order.guest_last_name}
                      </TableCell>
                      <TableCell>{order.property_name}</TableCell>
                      <TableCell>{order.service_name || order.service_type}</TableCell>
                      <TableCell>{order.partner_name || '-'}</TableCell>
                      <TableCell>€{order.price || '0.00'}</TableCell>
                      <TableCell>€{parseFloat(order.commission_amount || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip
                          label={order.status}
                          size="small"
                          color={getStatusColor(order.status)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {tabValue === 1 && commissions && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <AttachMoney sx={{ fontSize: 48, color: 'success.main' }} />
                  <Box>
                    <Typography variant="h4" fontWeight={600}>
                      €{parseFloat(commissions.totals?.total_commission || 0).toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Commission
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <ShoppingCart sx={{ fontSize: 48, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="h4" fontWeight={600}>
                      {commissions.totals?.total_orders || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Orders
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TrendingUp sx={{ fontSize: 48, color: 'info.main' }} />
                  <Box>
                    <Typography variant="h4" fontWeight={600}>
                      €{parseFloat(commissions.totals?.total_revenue || 0).toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Revenue
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Commission by Partner
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Partner</TableCell>
                        <TableCell>Service Type</TableCell>
                        <TableCell>Orders</TableCell>
                        <TableCell>Revenue</TableCell>
                        <TableCell>Commission</TableCell>
                        <TableCell>Avg %</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {commissions.summary?.map((row) => (
                        <TableRow key={row.partner_id}>
                          <TableCell>{row.partner_name}</TableCell>
                          <TableCell>{row.service_type}</TableCell>
                          <TableCell>{row.total_orders || 0}</TableCell>
                          <TableCell>€{parseFloat(row.total_revenue || 0).toFixed(2)}</TableCell>
                          <TableCell>€{parseFloat(row.total_commission || 0).toFixed(2)}</TableCell>
                          <TableCell>{parseFloat(row.avg_commission_percentage || 0).toFixed(2)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default AdminDashboard;



