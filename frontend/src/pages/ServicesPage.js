import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Mic, MicVocal, Sliders, Music, Volume2, Disc } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const iconMap = {
  'mic': Mic,
  'mic-vocal': MicVocal,
  'sliders': Sliders,
  'music': Music,
  'volume-2': Volume2,
  'disc': Disc,
};

const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API}/services`);
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen" data-testid="services-page">
      {/* Background */}
      <div className="fixed inset-0 bg-[#030305] -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-cyan-900/10" />
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[150px]" />
      </div>

      {/* Hero */}
      <section className="pt-40 pb-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <span className="inline-block px-4 py-2 rounded-full glass border border-white/10 text-xs uppercase tracking-[0.2em] text-cyan-400 mb-6">
              Our Services
            </span>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">
              Professional Audio<br />
              <span className="text-gradient">Solutions</span>
            </h1>
            <p className="text-lg text-white/50 max-w-2xl mx-auto">
              From dubbing to mastering, we offer comprehensive audio post-production services tailored to your creative vision.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-3xl glass h-96 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, index) => {
                const IconComponent = iconMap[service.icon] || Mic;
                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 hover:border-white/30 transition-all duration-500 hover:shadow-[0_0_40px_-10px_rgba(0,240,255,0.3)] card-hover"
                    data-testid={`service-widget-${service.id}`}
                  >
                    {/* Image as glass widget */}
                    {service.image_url && (
                      <div className="relative h-48 overflow-hidden">
                        <img 
                          src={service.image_url} 
                          alt={service.name}
                          className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#030305] via-transparent to-transparent" />
                        
                        {/* Price badge */}
                        <div className="absolute top-4 right-4 px-4 py-2 rounded-full glass-heavy border border-white/20">
                          <span className="text-sm font-bold text-cyan-400">
                            {service.price || 'Project Based'}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="p-8">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-purple-500/20 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <IconComponent className="w-6 h-6 text-cyan-400" />
                      </div>
                      
                      <h3 className="text-2xl font-bold mb-3 group-hover:text-gradient transition-all">{service.name}</h3>
                      <p className="text-white/50 text-sm mb-6 leading-relaxed">{service.description}</p>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        {service.price_type === 'fixed' ? (
                          <span className="text-cyan-400 font-bold text-lg">{service.price}</span>
                        ) : (
                          <span className="text-white/40 text-sm">Contact for Project-Based Pricing</span>
                        )}
                        <Link 
                          to={`/booking?service=${encodeURIComponent(service.name)}`}
                          className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors group/link"
                          data-testid={`book-service-${service.id}`}
                        >
                          Book Now
                          <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-heavy rounded-3xl p-12 md:p-16 border border-white/20"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Not Sure Which Service You Need?
            </h2>
            <p className="text-white/50 mb-8">
              Let's discuss your project and find the perfect solution for your audio needs.
            </p>
            <Link
              to="/booking"
              data-testid="services-contact-cta"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-black font-bold hover:scale-105 transition-transform"
            >
              Get in Touch
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;
