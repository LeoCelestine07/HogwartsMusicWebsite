import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Mail, Phone, FileText, CheckCircle, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { Calendar as CalendarComponent } from '../components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const timeSlots = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'
];

const BookingPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    service_id: '',
    service_name: '',
    description: '',
    preferred_date: null,
    preferred_time: ''
  });

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    const serviceName = searchParams.get('service');
    if (serviceName && services.length > 0) {
      const service = services.find(s => s.name === serviceName);
      if (service) {
        setFormData(prev => ({
          ...prev,
          service_id: service.id,
          service_name: service.name
        }));
      }
    }
  }, [searchParams, services]);

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API}/services`);
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleServiceSelect = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    setFormData(prev => ({
      ...prev,
      service_id: serviceId,
      service_name: service?.name || ''
    }));
  };

  const handleDateSelect = (date) => {
    setFormData(prev => ({ ...prev, preferred_date: date }));
  };

  const handleTimeSelect = (time) => {
    setFormData(prev => ({ ...prev, preferred_time: time }));
  };

  const validateStep = (currentStep) => {
    if (currentStep === 1) {
      return formData.full_name && formData.email && formData.phone;
    }
    if (currentStep === 2) {
      return formData.service_id && formData.description;
    }
    if (currentStep === 3) {
      return formData.preferred_date && formData.preferred_time;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) {
      toast.error('Please select date and time');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        preferred_date: formData.preferred_date.toISOString().split('T')[0]
      };
      
      await axios.post(`${API}/bookings`, payload);
      setSubmitted(true);
      toast.success('Booking confirmed! Check your email for details.');
    } catch (error) {
      toast.error('Failed to create booking. Please try again.');
      console.error('Booking error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" data-testid="booking-success">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-heavy rounded-3xl p-12 md:p-16 max-w-lg text-center border border-white/20"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-10 h-10 text-black" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Booking Confirmed!</h2>
          <p className="text-white/50 mb-8">
            We've sent a confirmation email to <strong className="text-white">{formData.email}</strong>. 
            Our team will contact you shortly to finalize the details.
          </p>
          <div className="glass rounded-2xl p-6 mb-8 text-left border border-white/10">
            <p className="text-sm text-white/40 mb-2">Booking Summary</p>
            <p className="font-semibold">{formData.service_name}</p>
            <p className="text-white/60 text-sm">
              {formData.preferred_date?.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} at {formData.preferred_time}
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-4 rounded-full bg-white text-black font-bold hover:scale-105 transition-transform"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen" data-testid="booking-page">
      {/* Background */}
      <div className="fixed inset-0 bg-[#030305] -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 via-transparent to-purple-900/10" />
        <div className="absolute top-1/3 right-1/3 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="pt-40 pb-20 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <span className="inline-block px-4 py-2 rounded-full glass border border-white/10 text-xs uppercase tracking-[0.2em] text-cyan-400 mb-6">
              Book a Session
            </span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
              Schedule Your<br />
              <span className="text-gradient">Studio Session</span>
            </h1>
            <p className="text-white/50">No account required. Fill out the form and we'll handle the rest.</p>
          </motion.div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center gap-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      step >= s
                        ? 'bg-gradient-to-br from-cyan-400 to-purple-500 text-black'
                        : 'glass border border-white/10 text-white/40'
                    }`}
                  >
                    {s}
                  </div>
                  {s < 3 && (
                    <div className={`w-16 h-0.5 mx-2 ${step > s ? 'bg-gradient-to-r from-cyan-400 to-purple-500' : 'bg-white/10'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Container */}
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-heavy rounded-3xl p-8 md:p-12 border border-white/20"
          >
            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <User className="w-6 h-6 text-cyan-400" />
                  Your Information
                </h2>
                
                <div>
                  <label className="block text-sm text-white/60 mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-white/30 focus:border-cyan-500/50 transition-colors"
                    data-testid="input-full-name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-white/60 mb-2">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@example.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-5 py-4 text-white placeholder:text-white/30 focus:border-cyan-500/50 transition-colors"
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
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+91 9876543210"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-5 py-4 text-white placeholder:text-white/30 focus:border-cyan-500/50 transition-colors"
                      data-testid="input-phone"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Service Selection */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <FileText className="w-6 h-6 text-cyan-400" />
                  Service Details
                </h2>
                
                <div>
                  <label className="block text-sm text-white/60 mb-2">Select Service *</label>
                  <Select value={formData.service_id} onValueChange={handleServiceSelect}>
                    <SelectTrigger 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 h-auto text-white"
                      data-testid="select-service"
                    >
                      <SelectValue placeholder="Choose a service" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a12] border border-white/10">
                      {services.map((service) => (
                        <SelectItem 
                          key={service.id} 
                          value={service.id}
                          className="text-white hover:bg-white/10"
                        >
                          <div className="flex justify-between items-center w-full">
                            <span>{service.name}</span>
                            <span className="text-cyan-400 text-sm ml-4">
                              {service.price || 'Project Based'}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm text-white/60 mb-2">Project Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Tell us about your project, requirements, and any specific details..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-white/30 focus:border-cyan-500/50 transition-colors resize-none"
                    data-testid="input-description"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Date & Time */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-cyan-400" />
                  Select Date & Time
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm text-white/60 mb-4">Preferred Date *</label>
                    <div className="glass rounded-2xl p-4 border border-white/10">
                      <CalendarComponent
                        mode="single"
                        selected={formData.preferred_date}
                        onSelect={handleDateSelect}
                        disabled={(date) => date < new Date() || date.getDay() === 0}
                        className="rounded-xl"
                        data-testid="calendar"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-white/60 mb-4">Preferred Time *</label>
                    <div className="grid grid-cols-2 gap-3">
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => handleTimeSelect(time)}
                          data-testid={`time-slot-${time.replace(/\s+/g, '-').toLowerCase()}`}
                          className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                            formData.preferred_time === time
                              ? 'bg-gradient-to-r from-cyan-400 to-purple-500 text-black'
                              : 'glass border border-white/10 text-white/60 hover:text-white hover:border-white/20'
                          }`}
                        >
                          <Clock className="w-4 h-4 inline mr-2" />
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-10 pt-8 border-t border-white/10">
              {step > 1 ? (
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-2 px-6 py-3 rounded-full glass border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all"
                  data-testid="btn-back"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              ) : (
                <div />
              )}
              
              {step < 3 ? (
                <button
                  onClick={() => validateStep(step) ? setStep(step + 1) : toast.error('Please fill all required fields')}
                  className="flex items-center gap-2 px-8 py-3 rounded-full bg-white text-black font-semibold hover:scale-105 transition-transform"
                  data-testid="btn-next"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-bold hover:scale-105 transition-transform disabled:opacity-50"
                  data-testid="btn-submit"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      Confirm Booking
                      <CheckCircle className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
