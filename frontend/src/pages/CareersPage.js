import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, GraduationCap, Mail, Phone, MapPin, FileText, Send, Loader2, CheckCircle, Zap, Instagram, Youtube, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CareersPage = () => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [cvFile, setCvFile] = useState(null);
  const [uploadingCv, setUploadingCv] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    position_type: 'intern',
    note: '',
    portfolio_url: '',
    instagram_id: '',
    youtube_link1: '',
    youtube_link2: '',
    youtube_link3: '',
    cv_filename: ''
  });

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await axios.get(`${API}/settings/content`);
      setContent(response.data);
    } catch (error) {
      console.error('Error fetching content:', error);
    }
  };

  const handleCvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF or Word document');
      return;
    }

    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploadingCv(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      const response = await axios.post(`${API}/upload/cv`, formDataUpload);
      setCvFile({ name: file.name, url: response.data.url });
      setFormData({ ...formData, cv_filename: response.data.filename });
      toast.success('CV uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload CV');
    } finally {
      setUploadingCv(false);
    }
  };

  const removeCv = () => {
    setCvFile(null);
    setFormData({ ...formData, cv_filename: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.city || !formData.note) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/applications`, formData);
      setSubmitted(true);
      toast.success('Application submitted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 pt-32" data-testid="careers-success">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-heavy rounded-3xl p-12 max-w-lg text-center border border-teal-500/20"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-10 h-10 text-black" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Application Submitted!</h2>
          <p className="text-white/50 mb-8">
            Thank you for your interest in joining Hogwarts Music Studio! We have received your application and will review it shortly. Check your email for confirmation.
          </p>
          <a
            href="/"
            className="inline-block px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-bold hover:scale-105 transition-transform"
          >
            Back to Home
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" data-testid="careers-page">
      {/* Background */}
      <div className="fixed inset-0 bg-[#0a1a1f] -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/15 via-transparent to-cyan-900/10" />
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[200px]" />
      </div>

      <div className="pt-40 pb-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 rounded-full glass border border-purple-500/30 text-xs uppercase tracking-[0.2em] text-purple-400 mb-6">
              {content?.careers_badge || 'Join Our Team'}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter mb-6">
              {content?.careers_title || 'Work With Us'}
            </h1>
            <p className="text-lg text-white/50 max-w-2xl mx-auto">
              {content?.careers_subtitle || 'Join Hogwarts Music Studio and be part of something extraordinary'}
            </p>
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-3xl p-8 md:p-12 mb-12 border border-white/10"
          >
            <p className="text-white/70 text-lg leading-relaxed text-center max-w-3xl mx-auto">
              {content?.careers_description || "We're always looking for talented individuals to join our team. Whether you're an experienced sound engineer or a passionate intern looking to learn, we have opportunities for you."}
            </p>
          </motion.div>

          {/* Position Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={`glass rounded-3xl p-8 border transition-all cursor-pointer ${
                formData.position_type === 'intern'
                  ? 'border-purple-500/50 bg-purple-500/5'
                  : 'border-white/10 hover:border-white/20'
              }`}
              onClick={() => setFormData({ ...formData, position_type: 'intern' })}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{content?.careers_intern_title || 'Internship Program'}</h3>
                  <span className="text-purple-400 text-sm">Learning & Growth</span>
                </div>
              </div>
              <p className="text-white/50">
                {content?.careers_intern_desc || 'Learn from industry professionals and work on real projects. Perfect for students and aspiring audio engineers.'}
              </p>
              {formData.position_type === 'intern' && (
                <div className="mt-4 flex items-center gap-2 text-purple-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Selected</span>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className={`glass rounded-3xl p-8 border transition-all cursor-pointer ${
                formData.position_type === 'engineer'
                  ? 'border-cyan-500/50 bg-cyan-500/5'
                  : 'border-white/10 hover:border-white/20'
              }`}
              onClick={() => setFormData({ ...formData, position_type: 'engineer' })}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                  <Briefcase className="w-7 h-7 text-black" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{content?.careers_job_title || 'Sound Engineers'}</h3>
                  <span className="text-cyan-400 text-sm">Professional Role</span>
                </div>
              </div>
              <p className="text-white/50">
                {content?.careers_job_desc || 'Join our team of professional sound engineers. We offer competitive salaries and the chance to work on exciting projects.'}
              </p>
              {formData.position_type === 'engineer' && (
                <div className="mt-4 flex items-center gap-2 text-cyan-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Selected</span>
                </div>
              )}
            </motion.div>
          </div>

          {/* Application Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-heavy rounded-3xl p-8 md:p-12 border border-white/10"
          >
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold mb-2">{content?.careers_form_title || 'Apply Now'}</h2>
              <p className="text-white/50">{content?.careers_form_subtitle || "Tell us about yourself and we'll get back to you"}</p>
            </div>

            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-cyan-500/50 transition-colors"
                    placeholder="Your name"
                    data-testid="input-name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-5 py-4 text-white focus:border-cyan-500/50 transition-colors"
                      placeholder="you@email.com"
                      data-testid="input-email"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-5 py-4 text-white focus:border-cyan-500/50 transition-colors"
                      placeholder="+91 9876543210"
                      data-testid="input-phone"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">City *</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-5 py-4 text-white focus:border-cyan-500/50 transition-colors"
                      placeholder="Your city"
                      data-testid="input-city"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Portfolio Link (Optional)</label>
                <input
                  type="url"
                  value={formData.portfolio_url}
                  onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-cyan-500/50 transition-colors"
                  placeholder="https://yourportfolio.com"
                  data-testid="input-portfolio"
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Tell us about yourself and what you want to achieve *
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={5}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-cyan-500/50 transition-colors resize-none"
                  placeholder="Share your experience, skills, and what you hope to learn or contribute..."
                  data-testid="input-note"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold hover:scale-[1.02] transition-transform disabled:opacity-50"
                data-testid="btn-submit"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Application
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CareersPage;
