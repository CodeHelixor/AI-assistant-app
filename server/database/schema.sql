-- Guest Experience App Database Schema

CREATE DATABASE IF NOT EXISTS guest_experience_app;
USE guest_experience_app;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  role ENUM('guest', 'host', 'admin', 'partner') DEFAULT 'guest',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Properties Table
CREATE TABLE IF NOT EXISTS properties (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  description TEXT,
  host_id INT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  check_in_time TIME,
  check_out_time TIME,
  max_guests INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Property Equipment Instructions
CREATE TABLE IF NOT EXISTS equipment_instructions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  property_id INT NOT NULL,
  equipment_name VARCHAR(255) NOT NULL,
  instructions TEXT NOT NULL,
  troubleshooting TEXT,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- House Rules
CREATE TABLE IF NOT EXISTS house_rules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  property_id INT NOT NULL,
  rule_text TEXT NOT NULL,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Stargazing Information
CREATE TABLE IF NOT EXISTS stargazing_info (
  id INT PRIMARY KEY AUTO_INCREMENT,
  property_id INT NOT NULL,
  tips TEXT,
  best_viewing_times TEXT,
  recommended_locations TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Partners Table
CREATE TABLE IF NOT EXISTS partners (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  service_type ENUM('restaurant', 'taxi', 'excursion', 'cleaning', 'other') NOT NULL,
  description TEXT,
  commission_percentage DECIMAL(5, 2) DEFAULT 0.00,
  commission_fixed DECIMAL(10, 2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Services Table
CREATE TABLE IF NOT EXISTS services (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  type ENUM('food_delivery', 'taxi', 'excursion', 'cleaning', 'other') NOT NULL,
  description TEXT,
  partner_id INT,
  price DECIMAL(10, 2),
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE SET NULL
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  guest_id INT NOT NULL,
  property_id INT NOT NULL,
  service_id INT,
  partner_id INT,
  service_type ENUM('food_delivery', 'taxi', 'excursion', 'cleaning', 'other') NOT NULL,
  status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
  price DECIMAL(10, 2),
  commission_percentage DECIMAL(5, 2) DEFAULT 0.00,
  commission_amount DECIMAL(10, 2) DEFAULT 0.00,
  order_details JSON,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (guest_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE SET NULL
);

-- Bookings Table (Guest stays)
CREATE TABLE IF NOT EXISTS bookings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  property_id INT NOT NULL,
  guest_id INT NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  status ENUM('upcoming', 'active', 'completed', 'cancelled') DEFAULT 'upcoming',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (guest_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Map Locations
CREATE TABLE IF NOT EXISTS map_locations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  property_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  type ENUM('restaurant', 'shop', 'beach', 'pharmacy', 'viewpoint', 'historical_site', 'other') NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  description TEXT,
  address TEXT,
  phone VARCHAR(20),
  website VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Emergency Contacts
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  property_id INT NOT NULL,
  service_type ENUM('fire', 'police', 'medical', 'other') NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Issues/Reports
CREATE TABLE IF NOT EXISTS issues (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT NOT NULL,
  property_id INT NOT NULL,
  guest_id INT NOT NULL,
  issue_type ENUM('damage', 'maintenance', 'other') NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  images JSON,
  status ENUM('reported', 'in_progress', 'resolved') DEFAULT 'reported',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (guest_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Guest Feedback
CREATE TABLE IF NOT EXISTS guest_feedback (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT NOT NULL,
  property_id INT NOT NULL,
  guest_id INT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (guest_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Trip Planner - Saved Locations
CREATE TABLE IF NOT EXISTS saved_locations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  guest_id INT NOT NULL,
  location_id INT,
  custom_name VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (guest_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES map_locations(id) ON DELETE CASCADE
);

-- Trip Planner - Itineraries
CREATE TABLE IF NOT EXISTS itineraries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  guest_id INT NOT NULL,
  booking_id INT,
  title VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  activities JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (guest_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_orders_guest ON orders(guest_id);
CREATE INDEX idx_orders_partner ON orders(partner_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_bookings_guest ON bookings(guest_id);
CREATE INDEX idx_bookings_property ON bookings(property_id);
CREATE INDEX idx_chat_booking ON chat_messages(booking_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);



