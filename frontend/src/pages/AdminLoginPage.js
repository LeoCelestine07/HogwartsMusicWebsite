import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Shield, KeyRound, User } from 'lucide-react';
import { toast } from 'sonner';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../components/ui/input-otp';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { adminLogin } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'otp'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      await adminLogin(formData.email, formData.password);
      toast.success('Welcome back, Admin!');
      navigate('/admin');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/admin/request-otp`, { email: formData.email });
      toast.success('OTP sent to your email!');
      setMode('otp');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send OTP. Make sure you are using the authorized admin email.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter complete OTP');
      return;
    }
    if (!formData.name || !formData.password) {
      toast.error('Please fill name and password');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/admin/verify-otp`, {
        email: formData.email,
        otp,
        name: formData.name,
        password: formData.password
      });
      
      localStorage.setItem('token', response.data.token);
      toast.success('Admin account created!');
      navigate('/admin');
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6" data-testid="admin-login-page">
      {/* Background */}
      <div className="fixed inset-0 bg-[#030305] -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-transparent to-purple-900/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[200px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-heavy rounded-3xl p-8 md:p-10 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {mode === 'login' ? 'Admin Login' : mode === 'register' ? 'Admin Registration' : 'Verify OTP'}
            </h1>
            <p className="text-white/50 text-sm">
              {mode === 'login' 
                ? 'Sign in to access the admin dashboard' 
                : mode === 'register' 
                ? 'Register with authorized email' 
                : 'Enter the OTP sent to your email'}
            </p>
          </div>

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm text-white/60 mb-2">Admin Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="admin@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-5 py-4 text-white placeholder:text-white/30 focus:border-purple-500/50 transition-colors"
                    data-testid="admin-login-email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-4 text-white placeholder:text-white/30 focus:border-purple-500/50 transition-colors"
                    data-testid="admin-login-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold hover:scale-[1.02] transition-transform disabled:opacity-50"
                data-testid="admin-login-submit"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Register Form */}
          {mode === 'register' && (
            <form onSubmit={handleRequestOTP} className="space-y-5">
              <div>
                <label className="block text-sm text-white/60 mb-2">Authorized Admin Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="leocelestine.s@gmail.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-5 py-4 text-white placeholder:text-white/30 focus:border-purple-500/50 transition-colors"
                    data-testid="admin-register-email"
                  />
                </div>
                <p className="text-xs text-white/40 mt-2">
                  Only the authorized email can register as admin
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold hover:scale-[1.02] transition-transform disabled:opacity-50"
                data-testid="admin-request-otp"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Request OTP
                    <KeyRound className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* OTP Verification */}
          {mode === 'otp' && (
            <div className="space-y-5">
              <div className="text-center">
                <p className="text-white/50 text-sm mb-4">
                  OTP sent to <span className="text-cyan-400">{formData.email}</span>
                </p>
                <InputOTP 
                  maxLength={6} 
                  value={otp} 
                  onChange={setOtp}
                  data-testid="admin-otp-input"
                >
                  <InputOTPGroup className="gap-2 justify-center">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot 
                        key={i} 
                        index={i} 
                        className="w-12 h-14 text-xl bg-white/5 border-white/10 rounded-xl"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Your Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Admin Name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-5 py-4 text-white placeholder:text-white/30 focus:border-purple-500/50 transition-colors"
                    data-testid="admin-register-name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Create Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-4 text-white placeholder:text-white/30 focus:border-purple-500/50 transition-colors"
                    data-testid="admin-register-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold hover:scale-[1.02] transition-transform disabled:opacity-50"
                data-testid="admin-verify-otp"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Verify & Create Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Toggle Mode */}
          <div className="mt-8 text-center">
            {mode === 'login' ? (
              <button
                onClick={() => setMode('register')}
                className="text-purple-400 hover:text-purple-300 text-sm"
              >
                First time? Register as Admin →
              </button>
            ) : (
              <button
                onClick={() => { setMode('login'); setOtp(''); }}
                className="text-white/40 hover:text-white/60 text-sm"
              >
                ← Back to Login
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLoginPage;
