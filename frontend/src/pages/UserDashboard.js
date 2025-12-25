import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle, Loader2, User, Mail, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, token, loading: authLoading, logout, isAdmin } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
    if (!authLoading && isAdmin) {
      navigate('/admin');
    }
  }, [user, authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (token && !isAdmin) {
      fetchBookings();
    }
  }, [token, isAdmin]);

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${API}/bookings/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const StatusBadge = ({ status }) => {
    const styles = {
      pending: 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30',
      confirmed: 'bg-green-400/20 text-green-400 border-green-400/30',
      completed: 'bg-purple-400/20 text-purple-400 border-purple-400/30',
      cancelled: 'bg-red-400/20 text-red-400 border-red-400/30'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.pending}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#030305] pt-32 pb-20 px-6 md:px-12" data-testid="user-dashboard">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome, {user.name}!</h1>
            <p className="text-white/50">Manage your bookings and account</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass border border-white/10 text-red-400 hover:bg-red-500/10 transition-colors"
            data-testid="user-logout"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </motion.div>

        {/* User Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 border border-white/10 mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
              <User className="w-8 h-8 text-black" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-white/50 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {user.email}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Bookings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold mb-6">Your Bookings</h2>
          
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="glass rounded-2xl p-12 border border-white/10 text-center">
              <Calendar className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/50 mb-4">You haven't made any bookings yet</p>
              <button
                onClick={() => navigate('/booking')}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-semibold hover:scale-105 transition-transform"
              >
                Book a Session
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking, index) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all"
                  data-testid={`user-booking-${booking.id}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold">{booking.service_name}</h3>
                        <StatusBadge status={booking.status} />
                      </div>
                      <p className="text-white/50 text-sm line-clamp-2 mb-3">{booking.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="flex items-center gap-2 text-white/60">
                          <Calendar className="w-4 h-4 text-cyan-400" />
                          {booking.preferred_date}
                        </span>
                        <span className="flex items-center gap-2 text-white/60">
                          <Clock className="w-4 h-4 text-cyan-400" />
                          {booking.preferred_time}
                        </span>
                      </div>
                    </div>
                    {booking.status === 'completed' && (
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Completed</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default UserDashboard;
