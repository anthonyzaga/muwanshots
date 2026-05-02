import React from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import content from '../content/content.json';

const Contact = () => {
  const { contact } = content;

  return (
    <section id="contact" className="py-24 bg-luxury-dark relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-luxury-gold/5 blur-[120px] rounded-full translate-x-1/2" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">
              Let’s Create <span className="text-luxury-gold italic">Magic</span> Together.
            </h2>
            <p className="text-luxury-silver/70 text-lg mb-12 max-w-md font-light leading-relaxed">
              Available for weddings, professional indoor studio sessions, and cinematic outdoor shoots across Uganda.
            </p>

            <div className="space-y-6">
              <a href={`tel:${contact.phone}`} className="flex items-center gap-6 group">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-luxury-gold group-hover:bg-white group-hover:text-luxury-black transition-all duration-300">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-xs text-luxury-silver/50 uppercase tracking-widest mb-1">Call Us</p>
                  <p className="text-white font-medium">{contact.phone}</p>
                </div>
              </a>

              <a href={`mailto:${contact.email}`} className="flex items-center gap-6 group">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-luxury-gold group-hover:bg-white group-hover:text-luxury-black transition-all duration-300">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-xs text-luxury-silver/50 uppercase tracking-widest mb-1">Email</p>
                  <p className="text-white font-medium">{contact.email}</p>
                </div>
              </a>

              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-luxury-gold">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-xs text-luxury-silver/50 uppercase tracking-widest mb-1">Location</p>
                  <p className="text-white font-medium">{contact.location}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-effect p-10 md:p-16 rounded-[2rem] text-center"
          >
            <h3 className="text-3xl font-bold text-white mb-6">Book Your Session</h3>
            <p className="text-luxury-silver/60 mb-10">
              Instant booking via WhatsApp. We typically respond within minutes.
            </p>
            <a
              href={contact.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full inline-flex items-center justify-center gap-3 py-5 text-lg"
            >
              <MessageCircle size={24} />
              Message on WhatsApp
            </a>

            <div className="mt-12 flex justify-center gap-8">
              <a href={contact.instagram} target="_blank" rel="noopener noreferrer" className="text-luxury-silver hover:text-white transition-colors">
                <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href={contact.tiktok} target="_blank" rel="noopener noreferrer" className="text-luxury-silver hover:text-white transition-colors">
                <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.03 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-1.13-.35-2.43-.2-3.41.49-.9.62-1.4 1.72-1.36 2.81.01.68.2 1.36.56 1.94.48.78 1.34 1.33 2.25 1.41.97.11 1.99-.14 2.76-.77.72-.56 1.13-1.44 1.14-2.36V.02z"/>
                </svg>
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
