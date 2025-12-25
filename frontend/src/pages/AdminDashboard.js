import { useState, useEffect, useRef } from 'react';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Calendar, Briefcase, Image, Settings, LogOut, 
  Users, Clock, CheckCircle, XCircle, MoreVertical, Edit, Trash2,
  Plus, Search, Filter, Loader2, Upload, Shield, Palette, UserCheck,
  DollarSign, Save, X, Eye, EyeOff, FileText, Phone, Ban, UserX
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { resolveImageUrl, handleImageError } from '../utils/imageUtils';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// =====================
// Dashboard Overview
// =====================
const DashboardOverview = () => {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/bookings`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setStats(statsRes.data);
      setRecentBookings(bookingsRes.data.slice(0, 5));
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Bookings', value: stats?.total_bookings || 0, icon: Calendar, color: 'cyan' },
    { label: 'Pending', value: stats?.pending_bookings || 0, icon: Clock, color: 'amber' },
    { label: 'Confirmed', value: stats?.confirmed_bookings || 0, icon: CheckCircle, color: 'teal' },
    { label: 'Completed', value: stats?.completed_bookings || 0, icon: CheckCircle, color: 'green' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-white/50">Welcome back, {user?.name}! Here's what's happening.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass rounded-2xl p-6 border border-white/10"
            data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/50 text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/20 flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="glass rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold">Recent Bookings</h2>
          <Link to="/admin/bookings" className="text-cyan-400 text-sm hover:underline">
            View All →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left p-4 text-sm text-white/60 font-medium">Client</th>
                <th className="text-left p-4 text-sm text-white/60 font-medium">Service</th>
                <th className="text-left p-4 text-sm text-white/60 font-medium">Date</th>
                <th className="text-left p-4 text-sm text-white/60 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((booking) => (
                <tr key={booking.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="p-4">
                    <div>
                      <p className="font-medium">{booking.full_name}</p>
                      <p className="text-xs text-white/40">{booking.email}</p>
                    </div>
                  </td>
                  <td className="p-4 text-white/70">{booking.service_name}</td>
                  <td className="p-4 text-white/70">{booking.preferred_date}</td>
                  <td className="p-4">
                    <StatusBadge status={booking.status} />
                  </td>
                </tr>
              ))}
              {recentBookings.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-white/40">
                    No bookings yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// =====================
// Status Badge Component
// =====================
const StatusBadge = ({ status }) => {
  const styles = {
    pending: 'bg-amber-400/20 text-amber-400 border-amber-400/30',
    confirmed: 'bg-teal-400/20 text-teal-400 border-teal-400/30',
    completed: 'bg-green-400/20 text-green-400 border-green-400/30',
    cancelled: 'bg-red-400/20 text-red-400 border-red-400/30'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.pending}`}>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
};

// =====================
// Image Upload Component
// =====================
const ImageUpload = ({ currentImage, onImageChange, label = "Image" }) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentImage || '');
  const [useUrl, setUseUrl] = useState(true);
  const { token } = useAuth();

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API}/upload/image`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const uploadedUrl = `${process.env.REACT_APP_BACKEND_URL}${response.data.url}`;
      setPreviewUrl(uploadedUrl);
      onImageChange(uploadedUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setPreviewUrl(url);
    onImageChange(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm text-white/60">{label}</label>
        <button
          type="button"
          onClick={() => setUseUrl(!useUrl)}
          className="text-xs text-cyan-400 hover:underline"
        >
          {useUrl ? 'Upload from device' : 'Use URL instead'}
        </button>
      </div>

      {useUrl ? (
        <input
          type="url"
          value={previewUrl}
          onChange={handleUrlChange}
          placeholder="https://images.unsplash.com/..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm"
        />
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-cyan-500/50 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          {uploading ? (
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-cyan-400" />
          ) : (
            <>
              <Upload className="w-8 h-8 mx-auto text-white/40 mb-2" />
              <p className="text-sm text-white/40">Click to upload image</p>
              <p className="text-xs text-white/30 mt-1">Max 5MB, JPG/PNG</p>
            </>
          )}
        </div>
      )}

      {previewUrl && (
        <div className="relative h-32 rounded-xl overflow-hidden">
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
};

// =====================
// Bookings Management
// =====================
const BookingsManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${API}/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data);
    } catch (error) {
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (bookingId, newStatus) => {
    try {
      await axios.put(`${API}/bookings/${bookingId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Status updated');
      fetchBookings();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const deleteBooking = async (bookingId) => {
    if (!window.confirm('Delete this booking?')) return;
    try {
      await axios.delete(`${API}/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Booking deleted');
      fetchBookings();
    } catch (error) {
      toast.error('Failed to delete booking');
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesFilter = filter === 'all' || b.status === filter;
    const matchesSearch = b.full_name.toLowerCase().includes(search.toLowerCase()) ||
                          b.email.toLowerCase().includes(search.toLowerCase()) ||
                          b.service_name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Bookings</h1>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-white/30"
              data-testid="bookings-search"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40 bg-white/5 border-white/10">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0d2229] border-white/10">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="glass rounded-2xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left p-4 text-sm text-white/60 font-medium">Client</th>
                  <th className="text-left p-4 text-sm text-white/60 font-medium">Service</th>
                  <th className="text-left p-4 text-sm text-white/60 font-medium">Date & Time</th>
                  <th className="text-left p-4 text-sm text-white/60 font-medium">Status</th>
                  <th className="text-left p-4 text-sm text-white/60 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="border-t border-white/5 hover:bg-white/5">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{booking.full_name}</p>
                        <p className="text-xs text-white/40">{booking.email}</p>
                        <p className="text-xs text-white/40">{booking.phone}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-white/70">{booking.service_name}</p>
                      <p className="text-xs text-white/40 line-clamp-1 max-w-xs">{booking.description}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-white/70">{booking.preferred_date}</p>
                      <p className="text-xs text-white/40">{booking.preferred_time}</p>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 hover:bg-white/10 rounded-lg">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#0d2229] border-white/10">
                          <DropdownMenuItem onClick={() => updateStatus(booking.id, 'confirmed')} className="hover:bg-white/10">
                            <CheckCircle className="w-4 h-4 mr-2 text-teal-400" /> Confirm
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(booking.id, 'completed')} className="hover:bg-white/10">
                            <CheckCircle className="w-4 h-4 mr-2 text-green-400" /> Complete
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(booking.id, 'cancelled')} className="hover:bg-white/10">
                            <XCircle className="w-4 h-4 mr-2 text-red-400" /> Cancel
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteBooking(booking.id)} className="hover:bg-white/10 text-red-400">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {filteredBookings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-white/40">
                      No bookings found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// =====================
// Services Management (Full Access Only)
// =====================
const ServicesManagement = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const { token } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    price_type: 'project',
    icon: 'mic',
    image_url: ''
  });

  const iconOptions = [
    { value: 'mic', label: 'Microphone' },
    { value: 'mic-vocal', label: 'Vocal Mic' },
    { value: 'sliders', label: 'Sliders' },
    { value: 'music', label: 'Music' },
    { value: 'volume-2', label: 'Speaker' },
    { value: 'disc', label: 'Disc' },
  ];

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API}/services`);
      setServices(response.data);
    } catch (error) {
      toast.error('Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingService) {
        await axios.put(`${API}/services/${editingService.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Service updated');
      } else {
        await axios.post(`${API}/services`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Service created');
      }
      fetchServices();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save service');
    }
  };

  const handleDelete = async (serviceId) => {
    if (!window.confirm('Delete this service?')) return;
    try {
      await axios.delete(`${API}/services/${serviceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Service deleted');
      fetchServices();
    } catch (error) {
      toast.error('Failed to delete service');
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price || '',
      price_type: service.price_type,
      icon: service.icon,
      image_url: service.image_url || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingService(null);
    setFormData({ name: '', description: '', price: '', price_type: 'project', icon: 'mic', image_url: '' });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Services</h1>
          <p className="text-white/50 text-sm mt-1">Manage your studio services and pricing</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-semibold text-sm hover:scale-105 transition-transform"
          data-testid="add-service-btn"
        >
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      {/* Service Form Modal */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 border border-cyan-500/20"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">{editingService ? 'Edit Service' : 'New Service'}</h2>
            <button onClick={resetForm} className="p-2 hover:bg-white/10 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Service Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Icon</label>
                <Select value={formData.icon} onValueChange={(v) => setFormData({ ...formData, icon: v })}>
                  <SelectTrigger className="w-full bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d2229] border-white/10">
                    {iconOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Pricing Type</label>
                <Select value={formData.price_type} onValueChange={(v) => setFormData({ ...formData, price_type: v })}>
                  <SelectTrigger className="w-full bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d2229] border-white/10">
                    <SelectItem value="fixed">Fixed Price</SelectItem>
                    <SelectItem value="project">Project Based</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">
                  Price {formData.price_type === 'fixed' ? '(e.g., ₹299/hr)' : '(leave empty for "Contact for pricing")'}
                </label>
                <input
                  type="text"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder={formData.price_type === 'fixed' ? '₹299/hr' : 'Optional'}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm"
                />
              </div>
            </div>

            <ImageUpload
              currentImage={formData.image_url}
              onImageChange={(url) => setFormData({ ...formData, image_url: url })}
              label="Service Image"
            />

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-semibold text-sm hover:scale-105 transition-transform"
              >
                <Save className="w-4 h-4" />
                {editingService ? 'Update' : 'Create'} Service
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2.5 rounded-xl glass border border-white/10 text-sm hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl overflow-hidden border border-white/10 group"
          >
            <div className="relative h-40">
              <img 
                src={resolveImageUrl(service.image_url, 'service')} 
                alt={service.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-all"
                onError={(e) => handleImageError(e, 'service')}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1a1f]/90 to-transparent" />
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  onClick={() => handleEdit(service)}
                  className="p-2 rounded-lg glass-heavy hover:bg-white/20"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="p-2 rounded-lg glass-heavy hover:bg-red-500/30"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
              <div className="absolute bottom-3 left-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  service.price_type === 'fixed' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-orange-500/20 text-orange-400'
                }`}>
                  {service.price || 'Project Based'}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg">{service.name}</h3>
              <p className="text-white/50 text-sm mt-1 line-clamp-2">{service.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// =====================
// Projects Management (Full Access Only)
// =====================
const ProjectsManagement = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const { token } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    work_type: '',
    image_url: '',
    featured: true
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
    } catch (error) {
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await axios.put(`${API}/projects/${editingProject.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Project updated');
      } else {
        await axios.post(`${API}/projects`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Project created');
      }
      fetchProjects();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save project');
    }
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await axios.delete(`${API}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Project deleted');
      fetchProjects();
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      work_type: project.work_type,
      image_url: project.image_url,
      featured: project.featured
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingProject(null);
    setFormData({ name: '', description: '', work_type: '', image_url: '', featured: true });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-white/50 text-sm mt-1">Manage your portfolio projects</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-semibold text-sm hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" /> Add Project
        </button>
      </div>

      {/* Project Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 border border-orange-500/20"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">{editingProject ? 'Edit Project' : 'New Project'}</h2>
            <button onClick={resetForm} className="p-2 hover:bg-white/10 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Project Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Work Type *</label>
                <input
                  type="text"
                  value={formData.work_type}
                  onChange={(e) => setFormData({ ...formData, work_type: e.target.value })}
                  placeholder="e.g., Mixing & Mastering"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm resize-none"
                required
              />
            </div>

            <ImageUpload
              currentImage={formData.image_url}
              onImageChange={(url) => setFormData({ ...formData, image_url: url })}
              label="Project Image"
            />

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <label htmlFor="featured" className="text-sm text-white/60">Featured project (show on homepage)</label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-semibold text-sm hover:scale-105 transition-transform"
              >
                <Save className="w-4 h-4" />
                {editingProject ? 'Update' : 'Create'} Project
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2.5 rounded-xl glass border border-white/10 text-sm hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl overflow-hidden border border-white/10 group"
          >
            <div className="relative h-48">
              <img 
                src={resolveImageUrl(project.image_url, 'project')} 
                alt={project.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-all"
                onError={(e) => handleImageError(e, 'project')}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1a1f]/90 to-transparent" />
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  onClick={() => handleEdit(project)}
                  className="p-2 rounded-lg glass-heavy hover:bg-white/20"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="p-2 rounded-lg glass-heavy hover:bg-red-500/30"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
              <div className="absolute top-3 left-3">
                <span className="px-3 py-1 rounded-full text-xs bg-cyan-500/20 text-cyan-400">
                  {project.work_type}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg">{project.name}</h3>
              <p className="text-white/50 text-sm mt-1 line-clamp-2">{project.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// =====================
// Site Settings (Super Admin Only)
// =====================
const SiteSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { token } = useAuth();
  const { refreshTheme } = useTheme();

  const backgroundTypes = [
    { value: 'gradient', label: 'Gradient (Default)' },
    { value: 'solid', label: 'Solid Color' },
    { value: 'texture', label: 'Texture Pattern' },
    { value: 'image', label: 'Custom Image' }
  ];

  const presetColors = [
    { name: 'Cyan', value: '#00d4d4' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Amber', value: '#fbbf24' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Blue', value: '#3b82f6' },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings/site`);
      setSettings(response.data);
    } catch (error) {
      toast.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/settings/site`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Settings saved! Theme updated across the site.');
      // Refresh the theme to apply changes immediately
      refreshTheme();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Site Settings</h1>
        <p className="text-white/50 text-sm mt-1">Customize your website appearance</p>
      </div>

      <div className="glass rounded-2xl p-6 border border-teal-500/20 space-y-6">
        {/* Background Settings */}
        <div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-cyan-400" />
            Background Theme
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Background Type</label>
              <Select 
                value={settings?.background_type} 
                onValueChange={(v) => setSettings({ ...settings, background_type: v })}
              >
                <SelectTrigger className="w-full bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0d2229] border-white/10">
                  {backgroundTypes.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {settings?.background_type === 'solid' && (
              <div>
                <label className="block text-sm text-white/60 mb-2">Background Color</label>
                <input
                  type="color"
                  value={settings.background_value || '#0a1a1f'}
                  onChange={(e) => setSettings({ ...settings, background_value: e.target.value })}
                  className="w-full h-12 rounded-xl cursor-pointer"
                />
              </div>
            )}

            {settings?.background_type === 'image' && (
              <div className="md:col-span-2">
                <ImageUpload
                  currentImage={settings.background_value}
                  onImageChange={(url) => setSettings({ ...settings, background_value: url })}
                  label="Background Image"
                />
              </div>
            )}
          </div>
        </div>

        {/* Color Settings */}
        <div>
          <h3 className="text-lg font-bold mb-4">Brand Colors</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Primary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings?.primary_color || '#00d4d4'}
                  onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                  className="w-12 h-12 rounded-xl cursor-pointer"
                />
                <input
                  type="text"
                  value={settings?.primary_color || '#00d4d4'}
                  onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Secondary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings?.secondary_color || '#f97316'}
                  onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                  className="w-12 h-12 rounded-xl cursor-pointer"
                />
                <input
                  type="text"
                  value={settings?.secondary_color || '#f97316'}
                  onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Accent Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings?.accent_color || '#14b8a6'}
                  onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                  className="w-12 h-12 rounded-xl cursor-pointer"
                />
                <input
                  type="text"
                  value={settings?.accent_color || '#14b8a6'}
                  onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-white/40 mb-2">Quick Presets:</p>
            <div className="flex flex-wrap gap-2">
              {presetColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSettings({ ...settings, primary_color: color.value })}
                  className="w-8 h-8 rounded-lg border-2 border-white/20 hover:border-white/40 transition-colors"
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-semibold hover:scale-105 transition-transform disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

// =====================
// Admin Management (Super Admin Only)
// =====================
const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, user } = useAuth();

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await axios.get(`${API}/admin/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmins(response.data);
    } catch (error) {
      toast.error('Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  };

  const toggleAccess = async (adminId, currentAccessLevel) => {
    const newAccessLevel = currentAccessLevel === 'full' ? 'basic' : 'full';
    try {
      await axios.put(`${API}/admin/${adminId}/access`, 
        { access_level: newAccessLevel },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Access updated to ${newAccessLevel}`);
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update access');
    }
  };

  const suspendAdmin = async (adminId, currentSuspended) => {
    const action = currentSuspended ? 'unsuspend' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${action} this admin?`)) return;
    
    try {
      await axios.put(`${API}/admin/${adminId}/suspend`, 
        { suspended: !currentSuspended, reason: !currentSuspended ? 'Suspended by Super Admin' : null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Admin ${action}ed successfully`);
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.detail || `Failed to ${action} admin`);
    }
  };

  const deleteAdmin = async (adminId) => {
    if (!window.confirm('Delete this admin?')) return;
    try {
      await axios.delete(`${API}/admin/${adminId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Admin deleted');
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete admin');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Management</h1>
        <p className="text-white/50 text-sm mt-1">Manage admin access and permissions</p>
      </div>

      <div className="glass rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="text-left p-4 text-sm text-white/60 font-medium">Admin</th>
              <th className="text-left p-4 text-sm text-white/60 font-medium">Role</th>
              <th className="text-left p-4 text-sm text-white/60 font-medium">Full Access</th>
              <th className="text-left p-4 text-sm text-white/60 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.id} className="border-t border-white/5 hover:bg-white/5">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                      <span className="text-black font-bold">{admin.name?.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-medium">{admin.name}</p>
                      <p className="text-xs text-white/40">{admin.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  {admin.is_super_admin || admin.email === 'leocelestine.s@gmail.com' ? (
                    <span className="px-3 py-1 rounded-full text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Super Admin
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      Admin
                    </span>
                  )}
                </td>
                <td className="p-4">
                  {admin.is_super_admin || admin.email === 'leocelestine.s@gmail.com' ? (
                    <span className="text-green-400 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Always
                    </span>
                  ) : (
                    <Select
                      value={admin.access_level || 'basic'}
                      onValueChange={(value) => toggleAccess(admin.id, value === 'full' ? 'basic' : 'full')}
                    >
                      <SelectTrigger className={`w-32 h-8 text-xs ${
                        admin.access_level === 'full'
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                      }`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d2229] border-white/10">
                        <SelectItem value="basic">Basic (View Only)</SelectItem>
                        <SelectItem value="full">Full Access</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </td>
                <td className="p-4">
                  {admin.is_super_admin || admin.email === 'leocelestine.s@gmail.com' ? (
                    <span className="text-white/30 text-sm">Protected</span>
                  ) : (
                    <button
                      onClick={() => deleteAdmin(admin.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="glass rounded-2xl p-6 border border-amber-500/20">
        <h3 className="font-bold flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-amber-400" />
          Access Levels
        </h3>
        <ul className="text-sm text-white/60 space-y-2">
          <li><strong className="text-amber-400">Super Admin:</strong> Full website control, can manage all admins</li>
          <li><strong className="text-green-400">Full Access Admin:</strong> Can edit services, projects, and site settings</li>
          <li><strong className="text-cyan-400">Basic Admin:</strong> Can only view and manage bookings</li>
          <li><strong className="text-red-400">Suspended:</strong> Account is temporarily disabled</li>
        </ul>
      </div>
    </div>
  );
};

// =====================
// Content Management (Super Admin Only)
// =====================
const ContentManagement = () => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await axios.get(`${API}/settings/content`);
      setContent(response.data);
    } catch (error) {
      toast.error('Failed to fetch content');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/settings/content`, content, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Content saved! Changes will reflect on the website.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  const ContentSection = ({ title, children }) => (
    <div className="glass rounded-xl p-6 border border-white/10">
      <h3 className="font-bold text-lg mb-4 text-cyan-400">{title}</h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );

  const InputField = ({ label, field, textarea = false }) => (
    <div>
      <label className="block text-sm text-white/60 mb-2">{label}</label>
      {textarea ? (
        <textarea
          value={content?.[field] || ''}
          onChange={(e) => setContent({ ...content, [field]: e.target.value })}
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50 resize-none"
        />
      ) : (
        <input
          type="text"
          value={content?.[field] || ''}
          onChange={(e) => setContent({ ...content, [field]: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50"
        />
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Management</h1>
          <p className="text-white/50 text-sm mt-1">Edit all text content on the website</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-semibold hover:scale-105 transition-transform disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save All Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ContentSection title="Logo & Branding">
          <InputField label="Logo URL" field="logo_url" />
          <InputField label="Logo Alt Text" field="logo_alt" />
        </ContentSection>

        <ContentSection title="Navigation Labels">
          <InputField label="Home" field="nav_home" />
          <InputField label="Services" field="nav_services" />
          <InputField label="Projects" field="nav_projects" />
          <InputField label="About" field="nav_about" />
          <InputField label="Book Session" field="nav_booking" />
        </ContentSection>

        <ContentSection title="Hero Section">
          <InputField label="Title" field="hero_title" />
          <InputField label="Gradient Title" field="hero_title_gradient" />
          <InputField label="Subtitle" field="hero_subtitle" textarea />
          <InputField label="CTA Button Text" field="hero_cta_text" />
        </ContentSection>

        <ContentSection title="Services Section">
          <InputField label="Section Title" field="services_title" />
          <InputField label="Section Subtitle" field="services_subtitle" />
        </ContentSection>

        <ContentSection title="Projects Section">
          <InputField label="Section Title" field="projects_title" />
          <InputField label="Section Subtitle" field="projects_subtitle" />
        </ContentSection>

        <ContentSection title="About Section">
          <InputField label="Section Title" field="about_title" />
          <InputField label="Section Subtitle" field="about_subtitle" />
          <InputField label="Description" field="about_description" textarea />
        </ContentSection>

        <ContentSection title="Founder Info">
          <InputField label="Founder Name" field="founder_name" />
          <InputField label="Founder Title" field="founder_title" />
          <InputField label="Founder Bio" field="founder_bio" textarea />
          <InputField label="IMDB URL" field="founder_imdb_url" />
        </ContentSection>

        <ContentSection title="Call to Action Section">
          <InputField label="CTA Title" field="cta_title" />
          <InputField label="CTA Subtitle" field="cta_subtitle" />
          <InputField label="CTA Button Text" field="cta_button_text" />
        </ContentSection>

        <ContentSection title="Footer">
          <InputField label="Footer Tagline" field="footer_tagline" textarea />
          <InputField label="Copyright Text" field="copyright_text" />
        </ContentSection>

        <ContentSection title="Booking Page">
          <InputField label="Page Title" field="booking_title" />
          <InputField label="Page Subtitle" field="booking_subtitle" />
        </ContentSection>
      </div>
    </div>
  );
};

// =====================
// Contact Info Management (Super Admin Only)
// =====================
const ContactManagement = () => {
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    fetchContact();
  }, []);

  const fetchContact = async () => {
    try {
      const response = await axios.get(`${API}/settings/contact`);
      setContact(response.data);
    } catch (error) {
      toast.error('Failed to fetch contact info');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/settings/contact`, contact, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Contact information saved!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save contact info');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contact Information</h1>
          <p className="text-white/50 text-sm mt-1">Manage contact details displayed on the website</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-semibold hover:scale-105 transition-transform disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-6 border border-white/10">
          <h3 className="font-bold text-lg mb-4 text-cyan-400">Primary Contact</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Email Address</label>
              <input
                type="email"
                value={contact?.email || ''}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50"
                placeholder="studio@example.com"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Primary Phone Number</label>
              <input
                type="tel"
                value={contact?.phone || ''}
                onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50"
                placeholder="+91 9876543210"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Secondary Phone Number (Optional)</label>
              <input
                type="tel"
                value={contact?.phone2 || ''}
                onChange={(e) => setContact({ ...contact, phone2: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50"
                placeholder="+91 9876543210"
              />
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-6 border border-white/10">
          <h3 className="font-bold text-lg mb-4 text-orange-400">Location</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Address</label>
              <textarea
                value={contact?.address || ''}
                onChange={(e) => setContact({ ...contact, address: e.target.value })}
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50 resize-none"
                placeholder="123 Studio Street, City, Country"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Google Maps URL</label>
              <input
                type="url"
                value={contact?.location_url || ''}
                onChange={(e) => setContact({ ...contact, location_url: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50"
                placeholder="https://maps.google.com/..."
              />
              <p className="text-xs text-white/40 mt-1">This link will be shown as "View on Map" in the footer</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-6 border border-white/10 lg:col-span-2">
          <h3 className="font-bold text-lg mb-4 text-teal-400">Social Media Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Instagram URL</label>
              <input
                type="url"
                value={contact?.instagram_url || ''}
                onChange={(e) => setContact({ ...contact, instagram_url: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50"
                placeholder="https://instagram.com/..."
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">YouTube URL</label>
              <input
                type="url"
                value={contact?.youtube_url || ''}
                onChange={(e) => setContact({ ...contact, youtube_url: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50"
                placeholder="https://youtube.com/..."
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Twitter/X URL</label>
              <input
                type="url"
                value={contact?.twitter_url || ''}
                onChange={(e) => setContact({ ...contact, twitter_url: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50"
                placeholder="https://twitter.com/..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =====================
// Main Admin Dashboard
// =====================
const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, loading, logout, token } = useAuth();
  const [adminData, setAdminData] = useState(null);

  const fetchAdminData = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminData(response.data.user);
    } catch (error) {
      console.error('Failed to fetch admin data');
    }
  };

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/admin/login');
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (token && isAdmin) {
      fetchAdminData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const isSuperAdmin = adminData?.is_super_admin || adminData?.email === 'leocelestine.s@gmail.com' || adminData?.access_level === 'super';
  const hasFullAccess = isSuperAdmin || adminData?.access_level === 'full';

  // Navigation items based on access level
  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', access: 'all' },
    { path: '/admin/bookings', icon: Calendar, label: 'Bookings', access: 'all' },
  ];

  // Add full access items
  if (hasFullAccess) {
    navItems.push(
      { path: '/admin/services', icon: Briefcase, label: 'Services', access: 'full' },
      { path: '/admin/projects', icon: Image, label: 'Projects', access: 'full' },
    );
  }

  // Add super admin items
  if (isSuperAdmin) {
    navItems.push(
      { path: '/admin/settings', icon: Palette, label: 'Site Settings', access: 'super' },
      { path: '/admin/admins', icon: Users, label: 'Admin Team', access: 'super' },
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0a1a1f] pt-28" data-testid="admin-dashboard">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 fixed left-0 top-28 bottom-0 border-r border-white/5 p-6 hidden lg:block">
          {/* Admin Badge */}
          {isSuperAdmin && (
            <div className="mb-6 p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-400">Super Admin</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  location.pathname === item.path
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
                data-testid={`sidebar-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
                {item.access === 'super' && (
                  <Shield className="w-3 h-3 text-amber-400 ml-auto" />
                )}
              </Link>
            ))}
          </div>

          <div className="absolute bottom-6 left-6 right-6">
            <div className="glass rounded-xl p-4 border border-white/10 mb-4">
              <p className="text-sm text-white/60">Logged in as</p>
              <p className="font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-white/40 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
              data-testid="admin-logout"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </aside>

        {/* Mobile Nav */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 glass border-t border-white/10 px-4 py-2 z-50">
          <div className="flex justify-around">
            {navItems.slice(0, 4).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl ${
                  location.pathname === item.path ? 'text-cyan-400' : 'text-white/50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 p-6 lg:p-10 pb-24 lg:pb-10">
          <Routes>
            <Route index element={<DashboardOverview />} />
            <Route path="bookings" element={<BookingsManagement />} />
            {hasFullAccess && (
              <>
                <Route path="services" element={<ServicesManagement />} />
                <Route path="projects" element={<ProjectsManagement />} />
              </>
            )}
            {isSuperAdmin && (
              <>
                <Route path="settings" element={<SiteSettings />} />
                <Route path="admins" element={<AdminManagement />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
