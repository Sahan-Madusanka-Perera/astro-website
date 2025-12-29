'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { PLANETS } from '@/lib/planets-data';

export function PlanetsSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-black via-indigo-950/20 to-black relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Planets</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Explore the different divisions of our astronomy club
          </p>
        </motion.div>

        {/* Planets Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 md:gap-12">
          {PLANETS.map((planet, index) => (
            <motion.div
              key={planet.id}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link
                href={`/planets/${planet.slug}`}
                className="group block"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="relative aspect-square rounded-full overflow-hidden shadow-2xl"
                  style={{
                    boxShadow: `0 0 40px ${planet.color}40`,
                  }}
                >
                  <Image
                    src={planet.icon}
                    alt={planet.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {/* Hover overlay */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: `linear-gradient(135deg, ${planet.color}40, transparent)`,
                    }}
                  />
                </motion.div>
                
                {/* Planet Name */}
                <motion.h3
                  className="text-center mt-4 text-sm md:text-base font-semibold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r transition-all duration-300"
                  style={{
                    '--tw-gradient-from': planet.color,
                    '--tw-gradient-to': planet.color + '80',
                  } as any}
                >
                  {planet.name.replace('Planet of ', '')}
                </motion.h3>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
