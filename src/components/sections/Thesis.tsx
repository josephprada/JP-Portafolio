import { motion, useReducedMotion } from "motion/react";
import { BRAND } from "../../i18n/content";
import { useLang } from "../../i18n/LanguageProvider";
import { ScriptWrite } from "../ScriptWrite";

/** Headline lines from this index on are the script phrase. */
const SCRIPT_FROM = 3;

/**
 * Editorial manifesto block: type only, no asset. The line-by-line reveal is
 * doing narrative work here, since the last line is the turn of the argument.
 */
export function Thesis() {
  const { t } = useLang();
  const reduce = useReducedMotion();

  return (
    <section id="tesis" className="relative border-t bg-ink py-28 md:py-40">
      <div className="shell">
        <h2 className="display max-w-[18ch] text-[13vw] sm:text-[11vw] md:text-[7.5rem] lg:text-[9rem]">
          {t.thesis.headline.slice(0, SCRIPT_FROM).map((line, index) => (
            <motion.span
              key={line}
              initial={reduce ? false : { opacity: 0, y: "0.24em" }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.75, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
              className="block"
            >
              {line}
            </motion.span>
          ))}
          {/* The turn of the argument is set in script and stays inside the h2,
              so the heading still reads as one sentence to assistive tech. The
              lines share one wrapper so the write-on wipes them as a unit. */}
          <motion.span
            initial={reduce ? false : { opacity: 0, y: "0.24em" }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.75, delay: SCRIPT_FROM * 0.07, ease: [0.16, 1, 0.3, 1] }}
            className="mt-[-6px] -ml-1.5 block font-script text-[clamp(3.25rem,11vw,8.625rem)] leading-[0.95] font-normal tracking-normal text-accent normal-case"
          >
            <ScriptWrite duration={2.2} delay={0.4} className="block w-fit origin-left -rotate-4">
              {t.thesis.headline.slice(SCRIPT_FROM).map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </ScriptWrite>
          </motion.span>
        </h2>

        <div className="mt-14 ml-auto max-w-[62ch] text-base md:mt-20 md:text-lg">
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="body-copy"
          >
            {t.thesis.body}
          </motion.p>

          {/* Decorative: the name is already the page's subject. */}
          <div aria-hidden="true" className="mt-6 flex items-center gap-3.5">
            <span className="block h-px w-10 bg-accent" />
            <span className="font-script text-[3.5rem] leading-none text-paper">
              {BRAND.signature}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
