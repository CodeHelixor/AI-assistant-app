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
  People,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [orders, setOrders] = useState([]);
  const [commissions, setCommissions] = useState(null);
  const [users, setUsers] = useState([]);
  const [userStatistics, setUserStatistics] = useState({
    total: 0,
    admin: 0,
    host: 0,
    guest: 0,
    partner: 0
  });
  const [userRoleFilter, setUserRoleFilter] = useState('all');
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
    } else if (tabValue === 2 && user?.role === 'admin') {
      fetchUsers();
    }
  }, [tabValue, filters, userRoleFilter]);

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

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (userRoleFilter && userRoleFilter !== 'all') {
        params.append('role', userRoleFilter);
      }
      const response = await axios.get(`/admin/users?${params.toString()}`);
      
      // Handle both new format (with statistics) and old format (array only)
      if (response.data.users) {
        setUsers(response.data.users);
        if (response.data.statistics) {
          setUserStatistics(response.data.statistics);
        }
      } else if (Array.isArray(response.data)) {
        // Old format - just an array of users
        setUsers(response.data);
        // Calculate statistics from the users array
        const stats = {
          total: response.data.length,
          admin: response.data.filter(u => u.role === 'admin').length,
          host: response.data.filter(u => u.role === 'host').length,
          guest: response.data.filter(u => u.role === 'guest').length,
          partner: response.data.filter(u => u.role === 'partner').length
        };
        setUserStatistics(stats);
      }
    } catch (error) {
      toast.error('Failed to load users');
      console.error('Error fetching users:', error);
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
        {user?.role === 'admin' && <Tab label="Users" />}
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

      {tabValue === 2 && user?.role === 'admin' && (
        <Grid container spacing={3}>
          {/* Statistics Cards */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <People sx={{ fontSize: 48, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="h4" fontWeight={600}>
                      {userStatistics.total || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Users
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <People sx={{ fontSize: 48, color: 'error.main' }} />
                  <Box>
                    <Typography variant="h4" fontWeight={600}>
                      {userStatistics.admin || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Admins
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <People sx={{ fontSize: 48, color: 'warning.main' }} />
                  <Box>
                    <Typography variant="h4" fontWeight={600}>
                      {userStatistics.host || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Hosts
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <People sx={{ fontSize: 48, color: 'info.main' }} />
                  <Box>
                    <Typography variant="h4" fontWeight={600}>
                      {(userStatistics.guest || 0) + (userStatistics.partner || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Guests & Partners
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Users Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Users ({users.length})
                  </Typography>
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Filter by Role</InputLabel>
                    <Select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      label="Filter by Role"
                    >
                      <MenuItem value="all">All Roles</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                      <MenuItem value="host">Host</MenuItem>
                      <MenuItem value="guest">Guest</MenuItem>
                      <MenuItem value="partner">Partner</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Phone</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Created At</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <Typography variant="body2" color="text.secondary">
                              No users found
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((userItem) => (
                          <TableRow key={userItem.id}>
                            <TableCell>{userItem.id}</TableCell>
                            <TableCell>
                              {userItem.first_name} {userItem.last_name}
                            </TableCell>
                            <TableCell>{userItem.email}</TableCell>
                            <TableCell>{userItem.phone || '-'}</TableCell>
                            <TableCell>
                              <Chip
                                label={userItem.role}
                                size="small"
                                color={
                                  userItem.role === 'admin'
                                    ? 'error'
                                    : userItem.role === 'host'
                                    ? 'warning'
                                    : userItem.role === 'partner'
                                    ? 'info'
                                    : 'default'
                                }
                              />
                            </TableCell>
                            <TableCell>
                              {format(new Date(userItem.created_at), 'MMM d, yyyy')}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
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



