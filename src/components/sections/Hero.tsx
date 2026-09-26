import { ArrowDownIcon, DownloadSimpleIcon } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { CONTACT } from "../../i18n/content";
import { useLang } from "../../i18n/LanguageProvider";
import { gsap, ScrollTrigger, scrollToSection } from "../../lib/scroll";
import { ScriptWrite } from "../ScriptWrite";

const FRAME_COUNT = 72;
/**
 * The sequence deliberately opens on an almost empty frame.
 *
 * The source clip carries real motion blur while the subject is walking: a
 * Laplacian measurement puts frame 27 at less than half the edge energy of the
 * settled frames (263 against 590-670). Opening mid-walk therefore freezes a
 * visibly soft image at the top of the page, and no encoding quality can
 * recover detail the footage never had. Opening on frame 0 costs an empty first
 * paint, but every frame the visitor stops on afterwards is a sharp one, and
 * blur during the walk reads as motion rather than as a defect.
 */
const START_FRAME = 0;
/**
 * The subject crosses most of the frame during these 45 stills, so a fixed
 * crop cannot keep him clear of the headline: anchored left he ends up off the
 * right edge, anchored right he starts underneath the type. Instead the crop
 * pans left as he walks right, like a camera tracking him, which holds him at
 * roughly two thirds across for the whole sequence.
 *
 * The start offset exposes a strip on the left; capped at 15% it always lands
 * inside the fully opaque end of the scrim, so it never reads as an edge.
 */
const PAN_START = 0.15;
const frameSrc = (index: number) => `/hero/frames/f${String(index + 1).padStart(3, "0")}.webp`;

/**
 * Scroll-scrubbed frame sequence.
 *
 * The source footage is an 8s clip of the site owner walking into frame. Tying
 * a <video> element's currentTime to scroll stalls badly on Safari and mobile,
 * so the clip is pre-extracted to 72 WebP stills (~700KB total) and painted on
 * a canvas instead. Scrubbing an already-decoded bitmap is frame-accurate.
 *
 * Below `md`, and under reduced motion, the sequence is replaced by a single
 * poster image: no decode work, no download of 72 files.
 */
function useFrameSequence(active: boolean) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;

    const images: HTMLImageElement[] = [];
    const state = { frame: START_FRAME };
    let disposed = false;

    const paint = () => {
      const image = images[Math.round(state.frame)];
      if (!image?.complete || image.naturalWidth === 0) return;
      const scale = Math.max(
        canvas.width / image.naturalWidth,
        canvas.height / image.naturalHeight,
      );
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;

      const panFrom = canvas.width * PAN_START;
      const panTo = Math.min(0, canvas.width - width);
      const walked = (state.frame - START_FRAME) / (FRAME_COUNT - 1 - START_FRAME);
      const dx = panFrom + (panTo - panFrom) * Math.min(1, Math.max(0, walked));

      context.fillStyle = "#0b0b0c";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, dx, (canvas.height - height) / 2, width, height);
    };

    let sized = false;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(canvas.clientWidth * dpr);
      canvas.height = Math.floor(canvas.clientHeight * dpr);
      // Resizing the backing store resets context state, so the smoothing hint
      // has to be reapplied here rather than once at setup.
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      sized = true;
      paint();
    };
    resize();

    for (let i = 0; i < FRAME_COUNT; i += 1) {
      const image = new Image();
      image.decoding = "async";
      // Frames decode out of order, so every frame repaints if it is the one
      // currently on screen. Waiting on a single frame would leave the canvas
      // blank whenever that frame is not the one the scroll position wants.
      image.onload = () => {
        if (disposed) return;
        if (Math.round(state.frame) === i) {
          if (!sized) resize();
          else paint();
          setReady(true);
        }
      };
      image.src = frameSrc(i);
      images.push(image);
    }

    window.addEventListener("resize", resize);

    const ctx = gsap.context(() => {
      gsap.to(state, {
        frame: FRAME_COUNT - 1,
        ease: "none",
        onUpdate: paint,
        scrollTrigger: {
          trigger: "#hero",
          start: "top top",
          // Ends before the section does, so the arrival pose holds for a beat
          // instead of completing exactly as the hero leaves the viewport.
          end: "72% top",
          scrub: 0.6,
        },
      });
    });

    return () => {
      disposed = true;
      window.removeEventListener("resize", resize);
      ctx.revert();
    };
  }, [active]);

  return { canvasRef, ready };
}

export function Hero() {
  const { t } = useLang();
  const reduce = useReducedMotion();
  const [canScrub, setCanScrub] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const sync = () => setCanScrub(query.matches && !reduce);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, [reduce]);

  const { canvasRef, ready } = useFrameSequence(canScrub);

  /** The headline lifts and fades as the figure walks in, handing over focus. */
  const copyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!canScrub) return;
    const ctx = gsap.context(() => {
      gsap.to(copyRef.current, {
        y: -60,
        opacity: 0.08,
        ease: "none",
        scrollTrigger: { trigger: "#hero", start: "40% top", end: "bottom top", scrub: true },
      });
    });
    return () => ctx.revert();
  }, [canScrub]);

  useEffect(() => {
    ScrollTrigger.refresh();
  }, []);

  return (
    /*
     * Mobile has no frame scrub — only a poster — so a multi-viewport sticky
     * runway is pure dead air. One screen tall below `md`; from `md` up the
     * sticky scrub theatre matches the original desktop behaviour exactly
     * (260vh runway, sticky 100dvh frame, overflow hidden).
     */
    <section id="hero" className="relative h-[100svh] md:h-[260vh]">
      <div className="relative h-full w-full overflow-clip md:sticky md:top-0 md:h-[100dvh] md:overflow-hidden">
        {/* Purely presentational: the headline below carries the meaning. */}
        <div aria-hidden="true" className="absolute inset-0">
          {canScrub ? (
            <canvas
              ref={canvasRef}
              className="h-full w-full"
              style={{ opacity: ready ? 1 : 0, transition: "opacity 600ms ease" }}
            />
          ) : (
            <>
              {/* Two elements rather than <picture> so each breakpoint gets its
                  own crop.

                  Horizontal framing lives in the asset, not in CSS. Phone
                  viewports are proportionally wider than this 304x658 crop, so
                  object-cover scales it to the container width exactly and
                  leaves no horizontal overflow, and object-position can only
                  shift an image along an axis where it actually overflows. The
                  X component below is therefore inert by construction: to move
                  the subject sideways, re-cut the crop window with the ffmpeg
                  command in the README. Do not reach for object-position or a
                  translate, neither will move anything.

                  The `top` half is not inert. It stops object-cover from
                  centring the vertical overflow and slicing the head off. */}
              <img
                src="/hero/poster-mobile.webp"
                alt=""
                className="h-full w-full object-cover object-right-top md:hidden"
              />
              <img
                src="/hero/poster.webp"
                alt=""
                className="hidden h-full w-full object-cover md:block"
              />
            </>
          )}
        </div>

        {/* Scrim: holds the headline at AAA contrast on the left while leaving
            the right side of the frame clear enough for the figure to read. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-ink from-20% via-ink/75 via-52% to-ink/0"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-ink to-transparent"
        />

        <div className="shell relative flex h-full flex-col justify-center pt-24 pb-16">
          <div ref={copyRef} className="max-w-4xl">
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="label mb-2 flex items-center gap-3"
            >
              <span className="inline-block h-px w-10 bg-accent" />
              {t.hero.role}
            </motion.p>

            {/* Tighter than the .display default because neither name carries a
                diacritic, but not so tight that the two words fuse into a slab. */}
            <h1 className="display text-[19vw] leading-[0.94] sm:text-[15vw] md:text-[11rem] lg:text-[13rem]">
              {/* The script first name is sized in em against the surname (170px
                  over 196px in the design) so the pair scales as one unit at
                  every breakpoint, and it overlaps the surname's top edge. The
                  outer span keeps the same entrance tween as before; the write-on
                  clip-path lives on an inner span so it never touches it. */}
              <motion.span
                initial={reduce ? false : { opacity: 0, y: "0.3em" }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 -mb-[0.565em] -ml-[0.047em] block font-script text-[0.87em] leading-[1.1] font-normal tracking-normal text-paper normal-case"
              >
                <ScriptWrite immediate className="inline-block origin-bottom-left -rotate-5">
                  {t.hero.firstName}
                </ScriptWrite>
              </motion.span>
              <motion.span
                initial={reduce ? false : { opacity: 0, y: "0.3em" }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.09, ease: [0.16, 1, 0.3, 1] }}
                className="block"
              >
                <span className="text-accent">{t.hero.lastName}</span>
              </motion.span>
            </h1>

            <motion.p
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="body-copy mt-8 text-lg md:text-xl"
            >
              {t.hero.lede}
            </motion.p>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 flex flex-wrap items-center gap-3"
            >
              <button
                type="button"
                onClick={() => scrollToSection("metodo")}
                className="group inline-flex items-center gap-2.5 bg-accent px-7 py-4 font-medium text-paper transition-transform duration-200 hover:bg-accent-dim active:scale-[0.98]"
              >
                {t.hero.primaryCta}
                <ArrowDownIcon
                  size={18}
                  weight="bold"
                  className="transition-transform duration-300 group-hover:translate-y-0.5"
                />
              </button>
              <a
                href={CONTACT.cv}
                download
                className="inline-flex items-center gap-2.5 border border-paper/30 px-7 py-4 font-medium text-paper transition-colors duration-200 hover:border-paper hover:bg-paper hover:text-ink active:scale-[0.98]"
              >
                {t.hero.secondaryCta}
                <DownloadSimpleIcon size={18} weight="bold" />
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
