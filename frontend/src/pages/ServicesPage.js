import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Mic, MicVocal, Sliders, Music, Volume2, Disc, Zap } from 'lucide-react';
import axios from 'axios';
import { resolveImageUrl, handleImageError } from '../utils/imageUtils';

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
      <div className="fixed inset-0 bg-[#0a1a1f] -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/15 via-transparent to-orange-900/10" />
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-teal-500/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-cyan-500/8 rounded-full blur-[150px]" />
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
            <span className="inline-block px-4 py-2 rounded-full glass border border-cyan-500/30 text-xs uppercase tracking-[0.2em] text-cyan-400 mb-6">
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
                const isOrange = index % 3 === 1;
                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`group relative overflow-hidden rounded-3xl border bg-white/5 transition-all duration-500 card-hover ${
                      isOrange 
                        ? 'border-orange-500/20 hover:border-orange-500/40 hover:shadow-[0_0_40px_-10px_rgba(249,115,22,0.4)]' 
                        : 'border-teal-500/20 hover:border-teal-500/40 hover:shadow-[0_0_40px_-10px_rgba(20,184,166,0.4)]'
                    }`}
                    data-testid={`service-widget-${service.id}`}
                  >
                    {/* Image as glass widget */}
                    {service.image_url && (
                      <div className="relative h-48 overflow-hidden">
                        <img 
                          src={resolveImageUrl(service.image_url, 'service')} 
                          alt={service.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                          onError={(e) => handleImageError(e, 'service')}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1a1f] via-transparent to-transparent" />
                        
                        {/* Price badge */}
                        <div className={`absolute top-4 right-4 px-4 py-2 rounded-full glass-heavy border ${
                          isOrange ? 'border-orange-500/30' : 'border-cyan-500/30'
                        }`}>
                          <span className={`text-sm font-bold ${isOrange ? 'text-orange-400' : 'text-cyan-400'}`}>
                            {service.price || 'Project Based'}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="p-8">
                      <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${
                        isOrange 
                          ? 'bg-orange-500/20 border-orange-500/30' 
                          : 'bg-cyan-500/20 border-cyan-500/30'
                      }`}>
                        <IconComponent className={`w-6 h-6 ${isOrange ? 'text-orange-400' : 'text-cyan-400'}`} />
                      </div>
                      
                      <h3 className="text-2xl font-bold mb-3 group-hover:text-gradient transition-all">{service.name}</h3>
                      <p className="text-white/50 text-sm mb-6 leading-relaxed">{service.description}</p>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        {service.price_type === 'fixed' ? (
                          <span className={`font-bold text-lg ${isOrange ? 'text-orange-400' : 'text-cyan-400'}`}>{service.price}</span>
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
            className="glass-heavy rounded-3xl p-12 md:p-16 border border-teal-500/20 relative overflow-hidden"
          >
            <motion.div
              animate={{ opacity: [0.2, 0.7, 0.2] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute top-6 right-8 text-amber-400/40"
            >
              <Zap className="w-8 h-8 lightning-bolt" />
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Not Sure Which Service You Need?
            </h2>
            <p className="text-white/50 mb-8">
              Let's discuss your project and find the perfect solution for your audio needs.
            </p>
            <Link
              to="/booking"
              data-testid="services-contact-cta"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-bold hover:scale-105 transition-transform shadow-[0_0_20px_rgba(0,212,212,0.3)]"
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
