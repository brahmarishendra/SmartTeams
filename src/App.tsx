import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import MyTasks from './pages/MyTasks';
import AIAssistant from './pages/AIAssistant';
import Profile from './pages/Profile';
import PendingApproval from './pages/PendingApproval';
import UserApproval from './pages/UserApproval';

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/pending-approval" element={<PendingApproval />} />
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="my-tasks" element={<MyTasks />} />
              <Route path="ai" element={<AIAssistant />} />
              <Route path="profile" element={<Profile />} />
              <Route path="approvals" element={<UserApproval />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;
