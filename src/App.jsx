import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Marketplace from './components/marketplace/Marketplace';
import DriverDashboard from './components/driver/DriverDashboard';
import WorkshopDashboard from './components/workshop/WorkshopDashboard';
import Deposit from './components/deposit/Deposit';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/driver/vehicles" element={<DriverDashboard />} />
            <Route path="/workshop/dashboard" element={<WorkshopDashboard />} />
            <Route path="/deposit" element={<Deposit />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}
