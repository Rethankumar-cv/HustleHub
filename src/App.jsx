import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import LandingPage from './pages/LandingPage';
import JoinPage from './pages/JoinPage';
import LoginPage from './pages/LoginPage';

// App pages (protected)
import DashboardPage from './pages/DashboardPage';
import GigFeedPage from './pages/GigFeedPage';
import GigPostPage from './pages/GigPostPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import MessagesPage from './pages/MessagesPage';
import ChatPage from './pages/ChatPage';

import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/join" element={<JoinPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/gigs" element={<ProtectedRoute><GigFeedPage /></ProtectedRoute>} />
          <Route path="/post-gig" element={<ProtectedRoute><GigPostPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
          <Route path="/chat/:conversationId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
