'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export default function BoardPage() {
  return (
    <main className="min-h-screen bg-[#050716] relative overflow-hidden">
      {/* Soft cosmic gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e27] via-[#0b1236] to-[#050716]" />
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_20%,rgba(124,181,255,0.15),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(124,181,255,0.15),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.08),transparent_35%)]" />

      {/* Star sprinkle */}
      <div className="pointer-events-none absolute inset-0">
        {[...Array(120)].map((_, i) => (
          <motion.span
            key={i}
            className="absolute bg-white rounded-full"
            style={{
              width: Math.random() * 2 + 0.5,
              height: Math.random() * 2 + 0.5,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-24 md:py-28 lg:py-32">
        <div className="flex items-center justify-between mb-10 text-white/70">
          <Link href="/" className="text-sm font-medium hover:text-white transition-colors">
            ← Back to Home
          </Link>
          <span className="text-sm">Board · 2025/26</span>
        </div>

        {/* Top Board Section */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-white tracking-tight"
          >
            Top Board
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 text-lg text-white/70"
          >
            J&apos;pura Astronomy Club · 2025/26
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative max-w-5xl mx-auto overflow-hidden rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.45)] border border-white/10 bg-white/5 backdrop-blur-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
          <Image
            src="/images/top_board.jpg"
            alt="Top Board 2025/26"
            width={1600}
            height={900}
            className="w-full h-auto object-cover"
            priority
          />
          <div className="absolute top-6 right-6">
            <span className="px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.2em] text-white bg-white/10 border border-white/20">
              2025 / 26
            </span>
          </div>
          <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-center gap-3 text-white/80 text-sm">
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">USJ Astronomy Club</span>
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">Top Board</span>
          </div>
        </motion.div>

        <div className="max-w-4xl mx-auto mt-12 text-center text-white/70 mb-24">
          <p className="text-base md:text-lg leading-relaxed">
            The visionary leaders at the helm of our organization, guiding strategic direction and fostering excellence in astronomical pursuits.
          </p>
        </div>

        {/* Executive Board Section */}
        <div className="max-w-4xl mx-auto text-center mb-12 mt-20">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-white tracking-tight"
          >
            Executive Board
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 text-lg text-white/70"
          >
            J&apos;pura Astronomy Club · 2025/26
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative max-w-5xl mx-auto overflow-hidden rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.45)] border border-white/10 bg-white/5 backdrop-blur-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
          <Image
            src="/images/board.jpg"
            alt="Executive Board 2025/26"
            width={1600}
            height={900}
            className="w-full h-auto object-cover"
          />
          <div className="absolute top-6 right-6">
            <span className="px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.2em] text-white bg-white/10 border border-white/20">
              2025 / 26
            </span>
          </div>
          <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-center gap-3 text-white/80 text-sm">
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">USJ Astronomy Club</span>
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">Executive Board</span>
          </div>
        </motion.div>

        <div className="max-w-4xl mx-auto mt-12 text-center text-white/70">
          <p className="text-base md:text-lg leading-relaxed">
            Celebrating the leadership team steering our cosmic journey for the 2025/26 term. This board brings together passion, expertise, and dedication to inspire the next generation of stargazers and innovators.
          </p>
        </div>
      </div>
    </main>
  );
}
