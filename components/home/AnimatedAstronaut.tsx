'use client';

import { motion } from 'framer-motion';

export function AnimatedAstronaut() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Astronaut Container with Float Animation */}
      <motion.div
        className="relative"
        animate={{
          y: [0, -20, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Astronaut SVG/Image Placeholder */}
        <motion.div
          className="w-64 h-64 md:w-80 md:h-80 relative"
          animate={{
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Simple Astronaut Illustration */}
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Helmet */}
            <circle cx="100" cy="80" r="45" fill="#E0E7FF" />
            <ellipse cx="100" cy="75" rx="35" ry="25" fill="#1E293B" opacity="0.3" />
            
            {/* Body */}
            <ellipse cx="100" cy="130" rx="35" ry="45" fill="#F0F4FF" />
            
            {/* Arms */}
            <ellipse cx="65" cy="125" rx="12" ry="35" fill="#E0E7FF" transform="rotate(-20 65 125)" />
            <ellipse cx="135" cy="125" rx="12" ry="35" fill="#E0E7FF" transform="rotate(20 135 125)" />
            
            {/* Legs */}
            <ellipse cx="85" cy="165" rx="10" ry="25" fill="#E0E7FF" />
            <ellipse cx="115" cy="165" rx="10" ry="25" fill="#E0E7FF" />
            
            {/* Backpack */}
            <rect x="90" y="120" width="20" height="30" rx="5" fill="#C7D2FE" />
            
            {/* Details */}
            <circle cx="100" cy="135" r="8" fill="#818CF8" />
          </svg>
        </motion.div>

        {/* Floating Stars Around Astronaut */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-yellow-300 rounded-full"
            style={{
              left: `${50 + Math.cos((i * Math.PI) / 4) * 120}%`,
              top: `${50 + Math.sin((i * Math.PI) / 4) * 120}%`,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </motion.div>

      {/* Orbiting Elements */}
      <motion.div
        className="absolute w-full h-full"
        animate={{ rotate: 360 }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <div className="absolute top-0 left-1/2 w-4 h-4 -ml-2">
          <div className="w-full h-full bg-purple-400 rounded-full" />
        </div>
      </motion.div>

      <motion.div
        className="absolute w-full h-full"
        animate={{ rotate: -360 }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <div className="absolute bottom-0 left-1/2 w-3 h-3 -ml-1.5">
          <div className="w-full h-full bg-blue-400 rounded-full" />
        </div>
      </motion.div>
    </div>
  );
}
