import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SkyKeys } from "@/components/cosmos/SkyKeys";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  axes: ["wdth"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://astronomy-club.usjp.ac.lk"),
  title: {
    default: "J'pura Astronomy Club",
    template: "%s · J'pura Astronomy Club",
  },
  description:
    "The astronomy club of the University of Sri Jayewardenepura. Observation nights, workshops, research and six planets of people who look up.",
  openGraph: {
    title: "J'pura Astronomy Club",
    description:
      "Observation nights, workshops, research and six planets of people who look up. University of Sri Jayewardenepura.",
    url: "/",
    siteName: "J'pura Astronomy Club",
    locale: "en_LK",
    type: "website",
    images: [{ url: "/images/astro_logo_512.png", width: 512, height: 512 }],
  },
};

export const viewport: Viewport = {
  themeColor: "#04060f",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${jetbrains.variable} scroll-smooth`}
    >
      <body>
        {/* The direction contract, emitted as a real HTML comment so it
            survives the production build and can be audited in the shipped
            markup. JSX comments are compiled away and leave nothing behind. */}
        <div
          hidden
          dangerouslySetInnerHTML={{
            __html: `<!--
     IMPECCABLE DIRECTION CONTRACT — seed: jpura-insignia-atlas
     THESIS: The club's logo is a mission patch — a circular seal with an
     azure sky inside it. This site is that patch made navigable: an
     observatory's night, instrumented. It refuses the space-website
     default of purple gradients, neon glow cards, and a dark hero bolted
     onto a light SaaS body.
     OWN-WORLD: One unbroken void (#04060f) from nav to footer. The seal's
     azure (#0080c0 → #6fd0f7) is the only chromatic voice and carries
     whole regions, not accents; sodium amber marks live/now and nothing
     else. Hairline rules replace card borders. Archivo pushed wide for
     display, JetBrains Mono at 11px/0.18em for chart annotations that
     carry real coordinates, dates and counts. Circles and arcs recur.
     STORY: A student sees a real sky, learns in one line whose club this
     is, and finds the next observation night without scrolling twice.
     FIRST VIEWPORT (as promised): Full-bleed live canvas sky, three
     parallax depths, stars coloured by spectral class. Seal at true
     scale over a hairline horizon arc carrying the campus coordinates
     in mono. Wordmark set wide and centred on the arc; the primary
     action sits directly under the lede.
     FIRST VIEWPORT (amended at finish review): the seal stacks above
     the arc rather than over it, and the arc sits at 82svh. The
     annotation row on it carries the coordinates, tonight's moon and
     the next observation night. Two photoreal prop renders that shipped
     in the first build — an astronaut and a satellite — were cut: a
     different medium from the authored sky behind them, and the loudest
     stock-space signal on the page. No props; the sky is the subject.
     FORM: Insignia + star atlas — the incumbent deep-space world
     inherited from code and seal, corrected to the seal's own azure.
     FINISH: unreviewed and undocumented is unfinished; this build ends
     with the finish review, the verdict, and DESIGN.md
-->`,
          }}
        />
        {children}
        <SkyKeys />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#0b1120",
              border: "1px solid rgba(255,255,255,0.10)",
              color: "#f2f6fb",
            },
          }}
        />
      </body>
    </html>
  );
}
