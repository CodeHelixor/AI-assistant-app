import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  IconButton,
  Typography,
  Paper,
  List,
  ListItem,
} from '@mui/material';
import { Send } from '@mui/icons-material';
import { io } from 'socket.io-client';
import axios from 'axios';
import toast from 'react-hot-toast';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [booking, setBooking] = useState(null);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const propertyId = 1; // Should come from context

  useEffect(() => {
    fetchActiveBooking();
    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (booking) {
      fetchMessages();
      initializeSocket();
    }
  }, [booking]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchActiveBooking = async () => {
    try {
      const response = await axios.get(`/properties/${propertyId}/active-booking`);
      setBooking(response.data);
    } catch (error) {
      toast.error('No active booking found');
    }
  };

  const fetchMessages = async () => {
    if (!booking) return;
    try {
      const response = await axios.get(`/chat/booking/${booking.id}`);
      setMessages(response.data);
    } catch (error) {
      toast.error('Failed to load messages');
    }
  };

  const initializeSocket = () => {
    if (!booking) return;
    
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
    setSocket(newSocket);

    newSocket.emit('join-room', `booking-${booking.id}`);

    newSocket.on('receive-message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => newSocket.disconnect();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !booking) return;

    try {
      // Get host ID - in real app, this would come from property data
      const hostId = 1; // Should come from property.host_id

      const response = await axios.post('/chat', {
        booking_id: booking.id,
        receiver_id: hostId,
        message: newMessage,
      });

      setMessages((prev) => [...prev, response.data]);
      
      if (socket) {
        socket.emit('send-message', {
          roomId: `booking-${booking.id}`,
          ...response.data,
        });
      }

      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!booking) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom fontWeight={600}>
          Chat with Host
        </Typography>
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography color="text.secondary">
              No active booking found. You can chat with your host once you have an active booking.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5" gutterBottom fontWeight={600}>
        Chat with Host
      </Typography>

      <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', mb: 2 }}>
        <CardContent sx={{ flexGrow: 1, overflow: 'auto', pb: 2 }}>
          <List>
            {messages.map((msg) => (
              <ListItem
                key={msg.id}
                sx={{
                  justifyContent: msg.sender_id === msg.receiver_id ? 'flex-end' : 'flex-start',
                  px: 0,
                }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    maxWidth: '70%',
                    bgcolor: msg.role === 'host' ? 'primary.main' : 'grey.100',
                    color: msg.role === 'host' ? 'white' : 'text.primary',
                  }}
                >
                  <Typography variant="caption" display="block" sx={{ mb: 0.5, opacity: 0.8 }}>
                    {msg.first_name} {msg.last_name}
                  </Typography>
                  <Typography variant="body1">{msg.message}</Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.7 }}>
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </Typography>
                </Paper>
              </ListItem>
            ))}
          </List>
          <div ref={messagesEndRef} />
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          multiline
          maxRows={4}
        />
        <IconButton
          color="primary"
          onClick={handleSend}
          disabled={!newMessage.trim()}
          sx={{ alignSelf: 'flex-end' }}
        >
          <Send />
        </IconButton>
      </Box>
    </Box>
  );
};

export default Chat;



