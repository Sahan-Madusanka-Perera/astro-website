import type { Metadata } from 'next';
import { StarField } from '@/components/cosmos/StarField';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Shell, SectionHead } from '@/components/layout/Section';
import { BoardArchive } from '@/components/board/BoardArchive';
import { getClubData } from '@/lib/club/queries';

/* Every year's board — its hierarchy or photographs — and its planet teams,
   all managed in Admin → Boards, which refreshes this page on every save. */

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Board',
  description: 'Every year’s board of the J’pura Astronomy Club, and who ran each planet.',
};

export default async function BoardPage() {
  const { boards, planets, members } = await getClubData();

  return (
    <>
      <Navbar />
      <main id="main" className="relative isolate min-h-screen overflow-hidden bg-void">
        <StarField density={110} meteorRate={3} />

        <Shell className="relative z-10 pt-28 pb-24 md:pt-36 md:pb-32">
          <SectionHead
            title={<>The people<br />who run it.</>}
            lede="Every year the club elects its board: advisors, a top board, the planet directors and project heads. This is the archive — who was steering, and when."
            aside={
              <p className="label-chart">
                {boards.length} {boards.length === 1 ? 'year' : 'years'} on record
              </p>
            }
          />
          <BoardArchive boards={boards} planets={planets} members={members} />
        </Shell>
      </main>
      <Footer />
    </>
  );
}
