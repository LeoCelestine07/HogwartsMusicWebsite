import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle, Loader2, User, Mail, LogOut, XCircle, AlertCircle, Timer, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, token, loading: authLoading, logout, isAdmin } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const StatusBadge = ({ status }) => {
    const statusConfig = {
      pending: {
        style: 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30',
        icon: AlertCircle,
        label: 'Pending Review'
      },
      approved: {
        style: 'bg-green-400/20 text-green-400 border-green-400/30',
        icon: CheckCircle,
        label: 'Approved'
      },
      confirmed: {
        style: 'bg-green-400/20 text-green-400 border-green-400/30',
        icon: CheckCircle,
        label: 'Confirmed'
      },
      completed: {
        style: 'bg-purple-400/20 text-purple-400 border-purple-400/30',
        icon: CheckCircle,
        label: 'Completed'
      },
      rejected: {
        style: 'bg-red-400/20 text-red-400 border-red-400/30',
        icon: XCircle,
        label: 'Rejected'
      },
      cancelled: {
        style: 'bg-red-400/20 text-red-400 border-red-400/30',
        icon: XCircle,
        label: 'Cancelled'
      }
    };
    
    const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.style}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const getStatusDescription = (status) => {
    const descriptions = {
      pending: 'Your booking is awaiting review by our team.',
      approved: 'Great news! Your booking has been approved. We will contact you soon.',
      confirmed: 'Your session is confirmed and scheduled.',
      completed: 'This session has been completed. Thank you!',
      rejected: 'Unfortunately, this booking could not be accommodated.',
      cancelled: 'This booking has been cancelled.'
    };
    return descriptions[status?.toLowerCase()] || descriptions.pending;
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
            <p className="text-white/50">Track your bookings and manage your account</p>
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Your Bookings</h2>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg glass border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="glass rounded-2xl p-12 border border-white/10 text-center">
              <Calendar className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/50 mb-4">You have not made any bookings yet</p>
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
                  <div className="flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-bold">{booking.service_name}</h3>
                        <StatusBadge status={booking.status} />
                      </div>
                      {booking.hours && (
                        <span className="flex items-center gap-2 text-cyan-400 text-sm">
                          <Timer className="w-4 h-4" />
                          {booking.hours} hour(s) booked
                        </span>
                      )}
                    </div>

                    {/* Status Description */}
                    <p className="text-sm text-white/40 italic">
                      {getStatusDescription(booking.status)}
                    </p>

                    {/* Description */}
                    <p className="text-white/50 text-sm line-clamp-2">{booking.description}</p>

                    {/* Date/Time */}
                    <div className="flex flex-wrap gap-4 text-sm border-t border-white/5 pt-4">
                      <span className="flex items-center gap-2 text-white/60">
                        <Calendar className="w-4 h-4 text-cyan-400" />
                        {booking.preferred_date}
                      </span>
                      <span className="flex items-center gap-2 text-white/60">
                        <Clock className="w-4 h-4 text-cyan-400" />
                        {booking.preferred_time}
                      </span>
                    </div>

                    {/* Completed Badge */}
                    {booking.status === 'completed' && (
                      <div className="flex items-center gap-2 text-purple-400 bg-purple-400/10 rounded-lg p-3">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Session completed. Thank you for choosing Hogwarts Music Studio!</span>
                      </div>
                    )}

                    {/* Rejected Info */}
                    {booking.status === 'rejected' && booking.rejection_reason && (
                      <div className="flex items-start gap-2 text-red-400 bg-red-400/10 rounded-lg p-3">
                        <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-sm font-medium">Reason:</span>
                          <p className="text-sm text-white/60">{booking.rejection_reason}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Book Another Session */}
          {bookings.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-8 text-center"
            >
              <button
                onClick={() => navigate('/booking')}
                className="px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-bold hover:scale-105 transition-transform"
              >
                Book Another Session
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default UserDashboard;
