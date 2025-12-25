import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Mic, Sliders, Music, Volume2, Disc, MicVocal, Zap } from 'lucide-react';
import axios from 'axios';
import { resolveImageUrl, handleImageError } from '../utils/imageUtils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_audio-haven-21/artifacts/kjwts159_HOGWARTS%20%20white%20bg%20only%20logo%20.jpg";

const iconMap = {
  'mic': Mic,
  'mic-vocal': MicVocal,
  'sliders': Sliders,
  'music': Music,
  'volume-2': Volume2,
  'disc': Disc,
};

const HomePage = () => {
  const [services, setServices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [content, setContent] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [servicesRes, projectsRes, contentRes] = await Promise.all([
        axios.get(`${API}/services`),
        axios.get(`${API}/projects`),
        axios.get(`${API}/settings/content`)
      ]);
      setServices(servicesRes.data);
      setProjects(projectsRes.data.slice(0, 3));
      setContent(contentRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <div className="relative" data-testid="home-page">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background effects - Teal/Cyan theme */}
        <div className="absolute inset-0 bg-[#0a1a1f]">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-900/30 via-cyan-900/10 to-orange-900/10" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/15 rounded-full blur-[128px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px]" />
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-orange-500/10 rounded-full blur-[100px]" />
        </div>

        {/* Lightning bolt decorations */}
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-[15%] text-amber-400/60"
        >
          <Zap className="w-16 h-16 lightning-bolt" />
        </motion.div>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-32 left-[10%] text-amber-400/40"
        >
          <Zap className="w-10 h-10 lightning-bolt rotate-12" />
        </motion.div>

        {/* Floating glass elements */}
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-32 left-[15%] w-24 h-24 rounded-2xl glass border border-teal-500/20 opacity-40"
        />
        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-48 right-[20%] w-16 h-16 rounded-full glass border border-orange-500/20 opacity-30"
        />
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-32 left-[25%] w-20 h-20 rounded-xl glass border border-cyan-500/20 opacity-30"
        />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-32 pb-24">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              {/* Logo */}
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl overflow-hidden bg-white shadow-[0_0_40px_rgba(0,212,212,0.3)]">
                <img src={content?.logo_url || LOGO_URL} alt={content?.logo_alt || "Hogwarts Music Studio"} className="w-full h-full object-contain" />
              </div>
              <span className="inline-block px-4 py-2 rounded-full glass border border-teal-500/30 text-xs uppercase tracking-[0.2em] text-teal-400 mb-6">
                {content?.hero_badge || 'Professional Audio Post-Production'}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tighter leading-none mb-6"
            >
              <span className="block">{content?.hero_title || 'Crafting'}</span>
              <span className="text-gradient">{content?.hero_title_gradient || 'Sonic Excellence'}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-12 leading-relaxed"
            >
              {content?.hero_subtitle || 'Where vision meets sound. Professional dubbing, mixing, mastering, and music production for films, series, and content creators.'}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                to="/booking"
                data-testid="hero-book-session"
                className="group px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-bold hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(0,212,212,0.3)] flex items-center justify-center gap-2"
              >
                Book a Session
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/projects"
                data-testid="hero-view-work"
                className="group px-8 py-4 rounded-full glass border border-white/20 text-white font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                View Our Work
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
            <div className="w-1 h-2 rounded-full bg-teal-400/60" />
          </div>
        </motion.div>
      </section>

      {/* All Services Section */}
      <section className="relative py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-xs uppercase tracking-[0.2em] text-cyan-400 mb-4 block">{content?.services_badge || 'What We Do'}</span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">{content?.services_title || 'Our Services'}</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => {
              const IconComponent = iconMap[service.icon] || Mic;
              const isOrange = index % 3 === 1; // Alternate orange accent
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`group relative overflow-hidden rounded-3xl border bg-white/5 p-8 transition-all duration-500 card-hover ${
                    isOrange 
                      ? 'border-orange-500/20 hover:border-orange-500/40 hover:shadow-[0_0_40px_-10px_rgba(249,115,22,0.4)]' 
                      : 'border-teal-500/20 hover:border-teal-500/40 hover:shadow-[0_0_40px_-10px_rgba(20,184,166,0.4)]'
                  }`}
                  data-testid={`service-card-${index}`}
                >
                  {/* Service image as floating widget */}
                  {service.image_url && (
                    <div className="relative w-full h-40 rounded-2xl overflow-hidden mb-6 glass">
                      <img 
                        src={resolveImageUrl(service.image_url, 'service')} 
                        alt={service.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                        onError={(e) => handleImageError(e, 'service')}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a1a1f]/70 to-transparent" />
                    </div>
                  )}
                  
                  <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${
                    isOrange 
                      ? 'bg-orange-500/20 border-orange-500/30' 
                      : 'bg-cyan-500/20 border-cyan-500/30'
                  }`}>
                    <IconComponent className={`w-6 h-6 ${isOrange ? 'text-orange-400' : 'text-cyan-400'}`} />
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3">{service.name}</h3>
                  <p className="text-white/50 text-sm mb-4 line-clamp-2">{service.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold ${isOrange ? 'text-orange-400' : 'text-cyan-400'}`}>
                      {service.price || 'Contact for Pricing'}
                    </span>
                    <Link 
                      to={`/booking?service=${encodeURIComponent(service.name)}`}
                      className="text-sm text-white/40 hover:text-white transition-colors"
                    >
                      Book Now →
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="relative py-24 md:py-32 bg-gradient-to-b from-transparent via-teal-900/5 to-transparent">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-xs uppercase tracking-[0.2em] text-orange-400 mb-4 block">{content?.projects_badge || 'Portfolio'}</span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">{content?.projects_title || 'Featured Projects'}</h2>
            <p className="text-white/50 max-w-xl mx-auto">
              {content?.projects_subtitle || 'A glimpse into our recent work across films, music, and multimedia productions.'}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10"
                data-testid={`project-card-${index}`}
              >
                {/* Project image */}
                <img 
                  src={resolveImageUrl(project.image_url, 'project')} 
                  alt={project.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                  onError={(e) => handleImageError(e, 'project')}
                />
                
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a1a1f] via-[#0a1a1f]/30 to-transparent" />
                
                {/* Content */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  <span className="text-xs uppercase tracking-wider text-cyan-400 mb-2">{project.work_type}</span>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-cyan-400 transition-colors">{project.name}</h3>
                  <p className="text-white/50 text-sm line-clamp-2">{project.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link 
              to="/projects"
              data-testid="view-all-projects"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass border border-white/20 text-sm font-medium hover:bg-white/10 transition-all group"
            >
              View All Projects
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section with Lightning */}
      <section className="relative py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-[40px] border border-teal-500/20"
          >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-teal-900/40 via-cyan-900/30 to-orange-900/20" />
            <div className="absolute inset-0 backdrop-blur-3xl" />
            
            {/* Lightning decorations */}
            <motion.div
              animate={{ opacity: [0.2, 0.8, 0.2] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute top-8 right-12 text-amber-400/50"
            >
              <Zap className="w-12 h-12 lightning-bolt" />
            </motion.div>
            <motion.div
              animate={{ opacity: [0.3, 0.9, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
              className="absolute bottom-12 left-16 text-amber-400/40"
            >
              <Zap className="w-8 h-8 lightning-bolt -rotate-12" />
            </motion.div>
            
            {/* Content */}
            <div className="relative p-12 md:p-20 text-center">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                {content?.cta_title || 'Ready to Create'}<br />
                <span className="text-gradient">{content?.cta_title ? '' : 'Something Amazing?'}</span>
              </h2>
              <p className="text-white/50 text-lg max-w-xl mx-auto mb-10">
                {content?.cta_subtitle || "Let's bring your audio vision to life. Book a session today and experience the Hogwarts difference."}
              </p>
              <Link
                to="/booking"
                data-testid="cta-book-session"
                className="inline-flex items-center gap-2 px-10 py-5 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_40px_rgba(0,212,212,0.3)]"
              >
                {content?.cta_button_text || 'Book Your Session'}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
