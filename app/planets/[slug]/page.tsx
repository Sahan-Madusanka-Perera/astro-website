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
    <main className="min-h-screen bg-[#0a0e27] relative overflow-hidden">
      {/* Enhanced Cosmic Background */}
      <div className="absolute inset-0">
        {/* Layered gradients */}
        <div className="absolute inset-0 bg-linear-to-br from-purple-900/20 via-transparent to-blue-900/20" />
        <div className="absolute inset-0 bg-linear-to-tl from-pink-900/10 via-transparent to-cyan-900/10" />
        
        {/* Large nebula glow matching planet color */}
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-200 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: planet.color }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
            scale: [1.3, 1, 1.3],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Background Stars */}
      <div className="absolute inset-0">
        {[...Array(100)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white rounded-full"
            style={{
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
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
            className="relative w-48 h-48 mx-auto mb-8 rounded-full overflow-hidden"
            style={{
              boxShadow: `0 0 80px ${planet.color}60`,
            }}
          >
            <Image
              src={planet.icon}
              alt={planet.name}
              fill
              className="object-cover"
              priority
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
          <div className="max-w-3xl mx-auto bg-linear-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 md:p-10 border border-white/20 shadow-2xl relative overflow-hidden">
            {/* Card glow effect */}
            <div 
              className="absolute inset-0 opacity-20 rounded-3xl blur-2xl"
              style={{ backgroundColor: planet.color }}
            />
            
            <div className="relative flex flex-col md:flex-row items-center gap-8">
              <motion.div 
                className="relative w-56 h-56 rounded-full overflow-hidden shrink-0 ring-4 shadow-2xl"
                style={{ 
                  '--tw-ring-color': planet.color + '60',
                  boxShadow: `0 20px 60px ${planet.color}40`
                } as React.CSSProperties}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Image
                  src={planet.director.image}
                  alt={planet.director.name}
                  fill
                  className="object-cover"
                />
              </motion.div>
              <div className="text-center md:text-left flex-1">
                <h3 className="text-3xl font-bold text-white mb-2">
                  {planet.director.name}
                </h3>
                <p 
                  className="text-xl font-semibold mb-4"
                  style={{ color: planet.color }}
                >
                  Director
                </p>
                {planet.director.bio && (
                  <p className="text-gray-300 mb-6 text-lg leading-relaxed">{planet.director.bio}</p>
                )}
                {planet.director.email && (
                  <motion.a
                    href={`mailto:${planet.director.email}`}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 shadow-lg"
                    style={{ 
                      backgroundColor: planet.color + '20',
                      color: planet.color,
                      border: `2px solid ${planet.color}40`
                    }}
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: `0 10px 30px ${planet.color}40`
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Mail className="w-5 h-5" />
                    Send Email
                  </motion.a>
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {planet.managers.map((manager, index) => (
              <motion.div
                key={manager.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                className="bg-linear-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300 shadow-xl group relative overflow-hidden"
                whileHover={{ y: -5 }}
              >
                {/* Card hover glow */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-xl"
                  style={{ backgroundColor: planet.color }}
                />
                
                <div className="relative">
                  <motion.div 
                    className="relative w-36 h-36 mx-auto mb-4 rounded-full overflow-hidden ring-4 shadow-xl"
                    style={{ 
                      '--tw-ring-color': planet.color + '40',
                      boxShadow: `0 10px 30px ${planet.color}30`
                    } as React.CSSProperties}
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Image
                      src={manager.image}
                      alt={manager.name}
                      fill
                      className="object-cover"
                    />
                  </motion.div>
                  <h3 className="text-xl font-bold text-white text-center mb-1">
                    {manager.name}
                  </h3>
                  <p 
                    className="text-center mb-4 font-medium"
                    style={{ color: planet.color }}
                  >
                    Manager
                  </p>
                  {manager.email && (
                    <motion.a
                      href={`mailto:${manager.email}`}
                      className="flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-full font-medium transition-all duration-300 mx-auto w-fit"
                      style={{ 
                        backgroundColor: planet.color + '20',
                        color: planet.color,
                        border: `1px solid ${planet.color}40`
                      }}
                      whileHover={{ 
                        scale: 1.05,
                        boxShadow: `0 5px 20px ${planet.color}30`
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Mail className="w-4 h-4" />
                      Contact
                    </motion.a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Responsibilities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Responsibilities
          </h2>
          <div className="bg-linear-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 md:p-10 border border-white/20 shadow-2xl relative overflow-hidden">
            {/* Card glow effect */}
            <div 
              className="absolute inset-0 opacity-10 rounded-3xl blur-2xl"
              style={{ backgroundColor: planet.color }}
            />
            
            <ul className="space-y-5 relative">
              {planet.responsibilities.map((responsibility, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                  className="flex items-start gap-4 group"
                >
                  <motion.span
                    className="w-3 h-3 rounded-full mt-2 shrink-0 shadow-lg"
                    style={{ 
                      backgroundColor: planet.color,
                      boxShadow: `0 0 20px ${planet.color}80`
                    }}
                    whileHover={{ scale: 1.5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  />
                  <span className="text-gray-200 text-lg leading-relaxed group-hover:text-white transition-colors">
                    {responsibility}
                  </span>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
