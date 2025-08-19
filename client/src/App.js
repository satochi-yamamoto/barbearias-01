import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Componentes de Layout
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Páginas Públicas
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import About from './pages/About';
import NotFound from './pages/NotFound';

// Páginas Privadas - Cliente
import Dashboard from './pages/client/Dashboard';
import AppointmentForm from './pages/client/AppointmentForm';
import AppointmentDetails from './pages/client/AppointmentDetails';
import Profile from './pages/client/Profile';

// Páginas Privadas - Barbeiro
import BarberDashboard from './pages/barber/Dashboard';
import BarberSchedule from './pages/barber/Schedule';
import BarberProfile from './pages/barber/Profile';

// Páginas Privadas - Admin
import AdminDashboard from './pages/admin/Dashboard';
import BarbershopManagement from './pages/admin/BarbershopManagement';
import ServicesManagement from './pages/admin/ServicesManagement';
import UsersManagement from './pages/admin/UsersManagement';

// Componentes de Rota
import PrivateRoute from './components/routing/PrivateRoute';

// Context
import AuthState from './context/auth/AuthState';
import AppointmentState from './context/appointment/AppointmentState';
import NotificationState from './context/notification/NotificationState';

function App() {
  return (
    <AuthState>
      <AppointmentState>
        <NotificationState>
          <Router>
            <div className="App">
              <Navbar />
              <div className="container">
                <Routes>
                  {/* Rotas Públicas */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/about" element={<About />} />
                  
                  {/* Rotas Privadas - Cliente */}
                  <Route path="/dashboard" element={<PrivateRoute component={Dashboard} />} />
                  <Route path="/appointments/new" element={<PrivateRoute component={AppointmentForm} />} />
                  <Route path="/appointments/:id" element={<PrivateRoute component={AppointmentDetails} />} />
                  <Route path="/profile" element={<PrivateRoute component={Profile} />} />
                  
                  {/* Rotas Privadas - Barbeiro */}
                  <Route path="/barber/dashboard" element={<PrivateRoute component={BarberDashboard} role="barber" />} />
                  <Route path="/barber/schedule" element={<PrivateRoute component={BarberSchedule} role="barber" />} />
                  <Route path="/barber/profile" element={<PrivateRoute component={BarberProfile} role="barber" />} />
                  
                  {/* Rotas Privadas - Admin */}
                  <Route path="/admin/dashboard" element={<PrivateRoute component={AdminDashboard} role="admin" />} />
                  <Route path="/admin/barbershops" element={<PrivateRoute component={BarbershopManagement} role="admin" />} />
                  <Route path="/admin/services" element={<PrivateRoute component={ServicesManagement} role="admin" />} />
                  <Route path="/admin/users" element={<PrivateRoute component={UsersManagement} role="admin" />} />
                  
                  {/* Rota 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
              <Footer />
              <ToastContainer position="bottom-right" />
            </div>
          </Router>
        </NotificationState>
      </AppointmentState>
    </AuthState>
  );
}

export default App;
