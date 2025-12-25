import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, Users, Clock, Headphones, Target, ExternalLink, Zap } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_audio-haven-21/artifacts/kjwts159_HOGWARTS%20%20white%20bg%20only%20logo%20.jpg";

const AboutPage = () => {
  const [content, setContent] = useState(null);

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

  const values = [
    { icon: Target, title: 'Precision', description: 'Every detail matters. We obsess over audio quality to deliver flawless results.', color: 'cyan' },
    { icon: Headphones, title: 'Immersion', description: 'Creating soundscapes that transport listeners into the heart of every story.', color: 'orange' },
    { icon: Users, title: 'Collaboration', description: 'Working closely with creators to bring their unique vision to life.', color: 'teal' },
  ];

  const timeline = [
    { year: '2018', title: 'Founded', description: 'Started as a small dubbing studio with a passion for sound.' },
    { year: '2020', title: 'Expansion', description: 'Upgraded to state-of-the-art equipment and expanded services.' },
    { year: '2022', title: 'Growth', description: 'Served 50+ clients including indie filmmakers and production houses.' },
    { year: '2024', title: 'Present', description: 'Full-service audio post-production with cutting-edge technology.' },
  ];

  const stats = [
    { value: content?.stat1_value || '6+', label: content?.stat1_label || 'Years Experience' },
    { value: content?.stat2_value || '50+', label: content?.stat2_label || 'Projects Delivered' },
    { value: content?.stat3_value || '100%', label: content?.stat3_label || 'Client Satisfaction' },
  ];

  return (
    <div className="relative min-h-screen" data-testid="about-page">
      {/* Background */}
      <div className="fixed inset-0 bg-[#0a1a1f] -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/15 via-transparent to-orange-900/10" />
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-[150px]" />
      </div>

      {/* Hero */}
      <section className="pt-40 pb-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-block px-4 py-2 rounded-full glass border border-teal-500/30 text-xs uppercase tracking-[0.2em] text-teal-400 mb-6">
                About Us
              </span>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-6">
                Crafting Sound<br />
                <span className="text-gradient">Since 2018</span>
              </h1>
              <p className="text-lg text-white/60 leading-relaxed mb-8">
                Hogwarts Music Studio is a professional audio post-production facility dedicated to delivering exceptional sound experiences. From dubbing and mixing to full music production, we bring technical expertise and creative vision to every project.
              </p>
              <div className="flex flex-wrap gap-8">
                {stats.map((stat, index) => (
                  <div key={index}>
                    <span className="text-4xl font-bold text-gradient">{stat.value}</span>
                    <p className="text-white/40 text-sm mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Glass card with studio info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="glass-heavy rounded-3xl p-8 md:p-10 border border-teal-500/20">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white mb-6 shadow-[0_0_30px_rgba(0,212,212,0.3)]">
                  <img src={LOGO_URL} alt="Hogwarts Music Studio" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Our Philosophy</h3>
                <p className="text-white/50 leading-relaxed mb-6">
                  We believe that great sound is invisible — it doesn't call attention to itself but instead amplifies the emotional impact of every scene, every note, every word. Our mission is to be the sonic architects behind your creative vision.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-cyan-400" />
                    <span className="text-white/70">Industry-standard equipment</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-orange-400" />
                    <span className="text-white/70">Fast turnaround times</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-teal-400" />
                    <span className="text-white/70">Dedicated support team</span>
                  </div>
                </div>
              </div>

              {/* Floating decorative elements */}
              <motion.div
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -right-4 text-amber-400/50"
              >
                <Zap className="w-10 h-10 lightning-bolt" />
              </motion.div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-xl glass border border-orange-500/20 opacity-30 -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-24 px-6 md:px-12 bg-gradient-to-b from-transparent via-cyan-900/5 to-transparent">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-xs uppercase tracking-[0.2em] text-orange-400 mb-4 block">Meet The Founder</span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">The Vision Behind Hogwarts</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-heavy rounded-3xl p-8 md:p-12 border border-orange-500/20"
          >
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500 to-orange-500 p-1 flex-shrink-0">
                <div className="w-full h-full rounded-full bg-[#0a1a1f] flex items-center justify-center">
                  <span className="text-4xl font-bold text-gradient">LC</span>
                </div>
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold mb-2">Leo Celestine</h3>
                <p className="text-cyan-400 font-medium mb-4">Music Composer & Founder</p>
                <p className="text-white/60 leading-relaxed mb-6">
                  With a passion for sonic storytelling and years of experience in music composition, Leo founded Hogwarts Music Studio to bring world-class audio production to indie filmmakers and content creators. His vision is to make professional sound accessible to all creative endeavors.
                </p>
                <a
                  href="https://www.imdb.com/name/nm15867951/?ref_=ext_shr_lnk"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="founder-imdb-link"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold hover:scale-105 transition-transform shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on IMDb
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-xs uppercase tracking-[0.2em] text-teal-400 mb-4 block">Our Values</span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">What Drives Us</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => {
              const colorClasses = {
                cyan: 'border-cyan-500/20 hover:border-cyan-500/40 bg-cyan-500/20',
                orange: 'border-orange-500/20 hover:border-orange-500/40 bg-orange-500/20',
                teal: 'border-teal-500/20 hover:border-teal-500/40 bg-teal-500/20',
              };
              const iconColor = {
                cyan: 'text-cyan-400',
                orange: 'text-orange-400',
                teal: 'text-teal-400',
              };
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`glass rounded-3xl p-8 border ${colorClasses[value.color].split(' ').slice(0, 2).join(' ')} transition-all card-hover text-center`}
                >
                  <div className={`w-16 h-16 rounded-2xl ${colorClasses[value.color].split(' ').slice(2).join(' ')} border border-white/10 flex items-center justify-center mx-auto mb-6`}>
                    <value.icon className={`w-7 h-7 ${iconColor[value.color]}`} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{value.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 px-6 md:px-12 bg-gradient-to-b from-transparent via-teal-900/5 to-transparent">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-xs uppercase tracking-[0.2em] text-cyan-400 mb-4 block">Our Journey</span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">The Story So Far</h2>
          </motion.div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-400/50 via-teal-500/50 to-orange-500/50" />

            {timeline.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative flex items-center mb-12 ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                {/* Dot */}
                <div className="absolute left-8 md:left-1/2 w-4 h-4 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 -translate-x-1/2 z-10" />
                
                {/* Content */}
                <div className={`ml-20 md:ml-0 md:w-5/12 ${index % 2 === 0 ? 'md:pr-16 md:text-right' : 'md:pl-16'}`}>
                  <span className="text-cyan-400 font-bold text-lg">{item.year}</span>
                  <h3 className="text-xl font-bold mt-1 mb-2">{item.title}</h3>
                  <p className="text-white/50 text-sm">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
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
              animate={{ opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute top-6 right-8 text-amber-400/40"
            >
              <Zap className="w-8 h-8 lightning-bolt" />
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Let's Create Something<br />
              <span className="text-gradient">Extraordinary</span>
            </h2>
            <p className="text-white/50 mb-8">
              Ready to elevate your project with professional audio? We'd love to hear from you.
            </p>
            <Link
              to="/booking"
              data-testid="about-cta-button"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-bold hover:scale-105 transition-transform shadow-[0_0_20px_rgba(0,212,212,0.3)]"
            >
              Start a Project
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
