'use client';

import { use } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';
import { PLANETS } from '@/lib/planets-data';
import { notFound } from 'next/navigation';

export default function PlanetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const planet = PLANETS.find((p) => p.slug === slug);

  if (!planet) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-indigo-950/20 to-black">
      {/* Background Stars */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
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
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Back Button */}
        <Link
          href="/#planets"
          className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>

        {/* Planet Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="relative w-48 h-48 mx-auto mb-8"
            style={{
              boxShadow: `0 0 80px ${planet.color}60`,
            }}
          >
            <Image
              src={planet.icon}
              alt={planet.name}
              fill
              className="object-contain"
            />
          </motion.div>

          <h1
            className="text-5xl md:text-6xl font-bold mb-4"
            style={{
              background: `linear-gradient(135deg, ${planet.color}, ${planet.color}80)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {planet.name}
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {planet.description}
          </p>
        </motion.div>

        {/* Director Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Director
          </h2>
          <div className="max-w-2xl mx-auto bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative w-48 h-48 rounded-full overflow-hidden flex-shrink-0 ring-4 ring-white/20">
                <Image
                  src={planet.director.image}
                  alt={planet.director.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {planet.director.name}
                </h3>
                <p className="text-lg text-gray-300 mb-4">Director</p>
                {planet.director.bio && (
                  <p className="text-gray-400 mb-4">{planet.director.bio}</p>
                )}
                {planet.director.email && (
                  <a
                    href={`mailto:${planet.director.email}`}
                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    {planet.director.email}
                  </a>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Managers Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Managers
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {planet.managers.map((manager, index) => (
              <motion.div
                key={manager.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden ring-4 ring-white/20">
                  <Image
                    src={manager.image}
                    alt={manager.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-white text-center mb-1">
                  {manager.name}
                </h3>
                <p className="text-gray-300 text-center mb-3">Manager</p>
                {manager.email && (
                  <a
                    href={`mailto:${manager.email}`}
                    className="flex items-center justify-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Mail className="w-3 h-3" />
                    Contact
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Responsibilities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Responsibilities
          </h2>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <ul className="space-y-4">
              {planet.responsibilities.map((responsibility, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                  className="flex items-start gap-3 text-gray-300"
                >
                  <span
                    className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: planet.color }}
                  />
                  <span>{responsibility}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
