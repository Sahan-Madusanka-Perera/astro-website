'use client';

import { motion } from 'framer-motion';
import { Telescope, Users, Award, Rocket } from 'lucide-react';

const features = [
  {
    icon: Telescope,
    title: 'Star Observations',
    description: 'Regular stargazing sessions with telescopes and expert guidance',
  },
  {
    icon: Users,
    title: 'Workshops & Seminars',
    description: 'Learn from experts about astronomy, astrophotography, and more',
  },
  {
    icon: Award,
    title: 'Competitions & Events',
    description: 'Participate in astronomy competitions and community events',
  },
  {
    icon: Rocket,
    title: 'Field Trips',
    description: 'Visit observatories and dark sky locations for better observations',
  },
];

export function AboutSection() {
  return (
    <section id="about" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            About Our Club
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We are a passionate community of astronomy enthusiasts at the
            University of Sri Jayewardenepura, dedicated to exploring the
            wonders of the universe.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 md:p-12 text-white text-center"
        >
          <h3 className="text-3xl font-bold mb-4">Join Our Community</h3>
          <p className="text-lg mb-6 text-white/90">
            Whether you're a beginner or an experienced astronomer, everyone is
            welcome to join our club and explore the universe together.
          </p>
          <button className="px-8 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Become a Member
          </button>
        </motion.div>
      </div>
    </section>
  );
}
