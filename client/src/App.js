import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AIAssistant from './pages/AIAssistant';
import Services from './pages/Services';
import ServiceRequest from './pages/ServiceRequest';
import PropertyInfo from './pages/PropertyInfo';
import MapView from './pages/MapView';
import Chat from './pages/Chat';
import TripPlanner from './pages/TripPlanner';
import Issues from './pages/Issues';
import Feedback from './pages/Feedback';
import AdminDashboard from './pages/AdminDashboard';
import Layout from './components/Layout';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* All routes accessible without authentication - sign in/sign up is blocked */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="ai-assistant" element={<AIAssistant />} />
        <Route path="services" element={<Services />} />
        <Route path="services/:type" element={<ServiceRequest />} />
        <Route path="property-info" element={<PropertyInfo />} />
        <Route path="map" element={<MapView />} />
        <Route path="chat" element={<Chat />} />
        <Route path="trip-planner" element={<TripPlanner />} />
        <Route path="issues" element={<Issues />} />
        <Route path="feedback" element={<Feedback />} />
        <Route path="admin" element={<AdminDashboard />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;


