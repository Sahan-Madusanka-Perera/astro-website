import { Hero } from '@/components/home/Hero';
import { PlanetsSection } from '@/components/home/PlanetsSection';
import { AboutSection } from '@/components/home/AboutSection';
import { EventsSection } from '@/components/home/EventsSection';
import { GallerySection } from '@/components/home/GallerySection';
import { FromOrbitSection } from '@/components/sky/FromOrbitSection';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

/* The scroll is paced deliberately: the sky opens, the divisions name
   themselves, the programme explains itself, azure takes the whole width once,
   then events and pictures do the practical work. The club's own photographs
   lead; the wider sky follows, and the footer closes it. */
export default function HomePage() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />
        <PlanetsSection />
        <AboutSection />
        <EventsSection />
        <GallerySection />
        <FromOrbitSection />
      </main>
      <Footer />
    </>
  );
}
