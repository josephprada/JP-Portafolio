import { motion, useReducedMotion } from "motion/react";
import { BRAND } from "../../i18n/content";
import { useLang } from "../../i18n/LanguageProvider";

/**
 * Asymmetric bento. Four cells with deliberately different surfaces: an accent
 * wash, a photograph, a plain panel and a ruled panel, so the grid does not
 * collapse into four identical text boxes.
 */
export function Product() {
  const { t } = useLang();
  const reduce = useReducedMotion();
  const [first, second, third] = t.product.blocks;

  const cell = (index: number) => ({
    initial: reduce ? false : ({ opacity: 0, y: 28 } as const),
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.25 },
    transition: { duration: 0.7, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <section id="producto" className="relative border-t bg-ink py-28 md:py-40">
      <div className="shell">
        <h2 className="display max-w-[20ch] text-[9vw] sm:text-[7vw] md:text-[4.5rem] lg:text-[5.5rem]">
          {t.product.headline}{" "}
          {/* Closing phrase in script, kept inside the h2 so the heading still
              reads as one sentence. Origin left keeps the rotation from pushing
              the first line past the shell's left edge. */}
          <span className="mt-2 block origin-left -rotate-3 font-script text-[clamp(3rem,10vw,7rem)] leading-[0.95] font-normal tracking-normal text-accent normal-case">
            {t.product.headlineAccent}
          </span>
        </h2>
        <p className="body-copy mt-6 text-base md:text-lg">{t.product.lede}</p>

        <div className="mt-16 grid grid-cols-1 items-stretch gap-4 md:mt-20 lg:grid-cols-12">
          <motion.div
            {...cell(0)}
            className="flex flex-col justify-center border border-accent/30 bg-gradient-to-br from-accent/18 via-accent/[0.05] to-transparent p-8 md:p-12 lg:col-span-7"
          >
            <h3 className="display text-3xl md:text-5xl">{first.title}</h3>
            <p className="body-copy mt-6 text-sm md:text-base">{first.body}</p>
          </motion.div>

          <motion.div {...cell(1)} className="relative lg:col-span-5">
            <img
              src="/work/portrait.webp"
              alt="Joseph Prada"
              loading="lazy"
              width={520}
              height={616}
              className="h-72 w-full border border-paper/12 object-cover object-top lg:h-full"
            />
            {/* Decorative signature over the photo. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-4 left-5 origin-left -rotate-6 font-script text-[clamp(2.75rem,6vw,4rem)] leading-none text-paper"
            >
              {BRAND.signature}
            </span>
          </motion.div>

          <motion.div
            {...cell(2)}
            className="flex flex-col justify-center border border-paper/12 bg-ink-raised p-8 md:p-10 lg:col-span-5"
          >
            <h3 className="display text-3xl md:text-4xl">{second.title}</h3>
            <p className="body-copy mt-5 text-sm md:text-base">{second.body}</p>
          </motion.div>

          <motion.div
            {...cell(3)}
            className="relative flex flex-col justify-center overflow-hidden border border-paper/12 p-8 md:p-12 lg:col-span-7"
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-[0.5]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, color-mix(in srgb, #f2efe9 7%, transparent) 0 1px, transparent 1px 64px)",
              }}
            />
            <div className="relative max-w-3xl">
              <h3 className="display text-3xl md:text-4xl">{third.title}</h3>
              <p className="body-copy mt-5 text-sm md:text-base">{third.body}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
