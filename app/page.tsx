import { Hero } from '@/components/home/Hero';
import { PlanetsSection } from '@/components/home/PlanetsSection';
import { AboutSection } from '@/components/home/AboutSection';
import { EventsSection } from '@/components/home/EventsSection';
import { GallerySection } from '@/components/home/GallerySection';
import { MagazineSection } from '@/components/home/MagazineSection';
import { FromOrbitSection } from '@/components/sky/FromOrbitSection';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { currentBoard, getClubData } from '@/lib/club/queries';

// Planets and their teams are edited in the admin, which refreshes this page on save.
export const revalidate = 60;

/* The scroll is paced deliberately: the sky opens, the divisions name
   themselves, the programme explains itself, azure takes the whole width once,
   then events and pictures do the practical work. The club's own photographs
   lead; the wider sky follows, and the footer closes it. */
export default async function HomePage() {
  const club = await getClubData();
  const board = currentBoard(club.boards);
  const planets = club.planets.map((planet) => ({
    planet,
    people: club.members.filter((m) => m.planet_id === planet.id && m.board_id === board?.id).length,
  }));

  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />
        <PlanetsSection planets={planets} />
        <AboutSection />
        <EventsSection />
        <GallerySection />
        <MagazineSection />
        <FromOrbitSection />
      </main>
      <Footer />
    </>
  );
}
