import { Hero } from '@/components/home/Hero';
import { AboutSection } from '@/components/home/AboutSection';
import { FeaturedEvents } from '@/components/home/FeaturedEvents';
import { EventCalendar } from '@/components/events/EventCalendar';
import { PlanetsSection } from '@/components/home/PlanetsSection';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { GalleryGrid } from '@/components/gallery/GalleryGrid';

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <div id="planets" className="-mt-28 pt-28">
        <PlanetsSection />
      </div>
      <AboutSection />
      <FeaturedEvents />
      <EventCalendar />
      
      {/* Gallery Section */}
      <section id="gallery" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Gallery
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore our collection of celestial captures and club moments
            </p>
          </div>
          <GalleryGrid />
        </div>
      </section>

      <Footer />
    </main>
  );
}
