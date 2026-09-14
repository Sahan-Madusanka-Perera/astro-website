/* ---------------------------------------------------------------------------
   GSAP, on demand.

   The scroll choreography is an enhancement, never a dependency of the page:
   GSAP and its two plugins are imported only after the page is interactive,
   in their own chunk, and every animated element ships visible without them.
   On a slow connection the site reads first and moves second.
--------------------------------------------------------------------------- */

export type Motion = {
  gsap: typeof import('gsap').gsap;
  ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger;
  SplitText: typeof import('gsap/SplitText').SplitText;
};

let loading: Promise<Motion> | null = null;

export function loadMotion(): Promise<Motion> {
  loading ??= Promise.all([
    import('gsap'),
    import('gsap/ScrollTrigger'),
    import('gsap/SplitText'),
  ]).then(([{ gsap }, { ScrollTrigger }, { SplitText }]) => {
    gsap.registerPlugin(ScrollTrigger, SplitText);
    // A phone's address bar showing and hiding is not a layout change worth
    // recalculating every trigger for.
    ScrollTrigger.config({ ignoreMobileResize: true });

    // Events, the gallery and the magazine all arrive after the triggers are
    // measured and push everything below them down the page. Re-measure once
    // the page has stopped changing height, so scrubbed sequences stay tied
    // to where their sections actually are.
    let settle: ReturnType<typeof setTimeout> | undefined;
    new ResizeObserver(() => {
      clearTimeout(settle);
      settle = setTimeout(() => ScrollTrigger.refresh(), 200);
    }).observe(document.body);

    return { gsap, ScrollTrigger, SplitText };
  });
  return loading;
}
