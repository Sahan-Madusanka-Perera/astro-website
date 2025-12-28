'use client';

import { Rocket, Mail, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Rocket className="h-8 w-8 text-purple-400" />
              <span className="font-bold text-lg">USJ Astronomy Club</span>
            </div>
            <p className="text-gray-400">
              Exploring the cosmos together at the University of Sri
              Jayewardenepura. Join us for stargazing, workshops, and more!
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-4">Contact Us</h3>
            <div className="space-y-3 text-gray-400">
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 mt-0.5 shrink-0" />
                <span>
                  University of Sri Jayewardenepura
                  <br />
                  Gangodawila, Nugegoda, Sri Lanka
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 shrink-0" />
                <a
                  href="mailto:astronomy@sjp.ac.lk"
                  className="hover:text-purple-400 transition-colors"
                >
                  astronomy@sjp.ac.lk
                </a>
              </div>
            </div>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-bold text-lg mb-4">Follow Us</h3>
            <div className="flex gap-4">
              <a
                href="#"
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
          <p>
            © {new Date().getFullYear()} University of Sri Jayewardenepura
            Astronomy Club. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
