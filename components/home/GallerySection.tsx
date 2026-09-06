import { GalleryGrid } from '@/components/gallery/GalleryGrid';
import { Section, Shell, SectionHead } from '@/components/layout/Section';

export function GallerySection() {
  return (
    <Section id="gallery" className="bg-void py-28 md:py-40">
      <Shell>
        <SectionHead
          title={<>What we caught.</>}
          lede="Members' astrophotography and the nights behind it — long exposures, lunar close-ups, and a good number of photographs of people looking pleased in the dark."
        />
        <div className="mt-16 md:mt-20">
          <GalleryGrid />
        </div>
      </Shell>
    </Section>
  );
}
