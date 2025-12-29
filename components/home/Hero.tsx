'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-visible bg-[#0a0e27]">
      {/* Animated Background Stars */}
      <div className="absolute inset-0">
        {[...Array(100)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white rounded-full"
            style={{
              width: Math.random() * 3 + 'px',
              height: Math.random() * 3 + 'px',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.1, 1, 0.1],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Main Content Container */}
      <div className="container mx-auto px-4 relative z-10 flex flex-col items-center justify-center min-h-screen pt-20">
        {/* Astronaut floating in center */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            y: [0, -20, 0],
            x: [0, 10, 0],
          }}
          transition={{ 
            opacity: { duration: 1, delay: 0.3 },
            scale: { duration: 1, delay: 0.3 },
            y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
            x: { duration: 8, repeat: Infinity, ease: "easeInOut" },
          }}
          className="relative w-96 h-96 md:w-[36rem] md:h-[36rem] mb-12 z-30"
        >
          <Image
            src="/images/astronaut.png"
            alt="Floating Astronaut"
            fill
            className="object-contain drop-shadow-2xl"
            priority
          />
        </motion.div>

        {/* Title Behind/Around Astronaut */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-center mb-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
        >
          <h1 className="text-7xl md:text-8xl lg:text-[10rem] font-black text-white/10 tracking-tighter leading-none">
            J'PURA
          </h1>
          <h1 className="text-7xl md:text-8xl lg:text-[10rem] font-black text-white/10 tracking-tighter leading-none -mt-4">
            ASTRO
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="text-2xl md:text-3xl text-white/80 font-light text-center mb-8 z-30"
        >
          Explore the infinite.
        </motion.p>

        {/* Earth with Orbits at bottom */}
        <div className="absolute bottom-[-320px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px]">
          {/* Orbit Rings */}
          <motion.div
            className="absolute inset-0 rounded-full border border-blue-500/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-[10%] rounded-full border border-purple-500/20"
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-[20%] rounded-full border border-cyan-500/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          />

          {/* Earth */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              rotate: [0, 360],
            }}
            transition={{ 
              opacity: { duration: 1, delay: 0.5 },
              scale: { duration: 1, delay: 0.5 },
              rotate: { duration: 120, repeat: Infinity, ease: "linear" }
            }}
            className="absolute inset-[15%] rounded-full overflow-hidden shadow-2xl"
            style={{
              background: `radial-gradient(circle at 30% 30%, rgba(100, 150, 255, 0.4), transparent),
                          url('https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=1200')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              boxShadow: '0 0 100px rgba(59, 130, 246, 0.5), inset 0 0 100px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Earth glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-transparent to-transparent" />
          </motion.div>

          {/* Orbit particles */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full"
              style={{
                left: '50%',
                top: `${i * 10 + 10}%`,
              }}
              animate={{
                rotate: 360,
                x: [0, 100, 0, -100, 0],
                y: [0, 50, 100, 50, 0],
              }}
              transition={{
                duration: 15 + i * 5,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}

          {/* Satellite Orbital Path - Dotted Circle */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ transform: 'scale(0.75)' }}
          >
            <motion.circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="rgba(139, 92, 246, 0.4)"
              strokeWidth="2"
              strokeDasharray="8 12"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: 1, 
                opacity: [0.3, 0.6, 0.3],
                rotate: [0, 360]
              }}
              transition={{ 
                pathLength: { duration: 2, delay: 1 },
                opacity: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 90, repeat: Infinity, ease: "linear" }
              }}
              style={{ transformOrigin: '50% 50%' }}
            />
          </svg>

          {/* Orbiting Satellite */}
          <motion.div
            className="absolute w-16 h-16 md:w-20 md:h-20"
            style={{
              left: '50%',
              top: '50%',
              x: '-50%',
              y: '-50%',
            }}
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 50,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <motion.div
              className="absolute"
              style={{
                left: '50%',
                top: '-240px',
                x: '-50%',
              }}
              animate={{
                rotate: [0, -360],
                scale: [1, 1.1, 1],
              }}
              transition={{
                rotate: { duration: 50, repeat: Infinity, ease: "linear" },
                scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              <div className="relative w-16 h-16 md:w-20 md:h-20">
                <Image
                  src="/images/satellite.png"
                  alt="Orbiting Satellite"
                  fill
                  className="object-contain drop-shadow-[0_0_20px_rgba(139,92,246,0.6)]"
                />
                {/* Satellite glow pulse */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-purple-500/30 blur-xl"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* See Events Button */}
        <motion.a
          href="#events"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="relative z-40 mt-8 px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full font-semibold text-white transition-all duration-300 border border-white/20 flex items-center gap-2 group"
        >
          See events
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </motion.a>
      </div>
    </section>
  );
}
