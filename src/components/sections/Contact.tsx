import { ArrowUpRightIcon, InstagramLogoIcon, WhatsappLogoIcon } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { CONTACT } from "../../i18n/content";
import { useLang } from "../../i18n/LanguageProvider";
import { ScriptWrite } from "../ScriptWrite";

/**
 * Closing block. No form: the fastest path for a recruiter is a mail client
 * that already knows who they are, so the page hands over real coordinates
 * instead of asking them to fill fields.
 */
export function Contact() {
  const { t } = useLang();
  const reduce = useReducedMotion();

  const rows: {
    label: string;
    value: string;
    href?: string;
    external?: boolean;
    download?: boolean;
  }[] = [
    { label: t.contact.emailLabel, value: CONTACT.email, href: `mailto:${CONTACT.email}` },
    { label: t.contact.phoneLabel, value: CONTACT.phone, href: CONTACT.phoneHref },
    {
      label: t.contact.instagramLabel,
      value: CONTACT.instagramHandle,
      href: CONTACT.instagram,
      external: true,
    },
    {
      label: t.contact.skillImageLabel,
      value: "jp-skill-image.zip",
      href: CONTACT.skillImage,
      download: true,
    },
    { label: t.contact.locationLabel, value: t.contact.location },
  ];

  return (
    <section id="contacto" className="relative border-t bg-ink pt-28 pb-20 md:pt-40 md:pb-24">
      <div className="shell">
        <motion.h2
          initial={reduce ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          /* Script headline. It can contain a space in English ("Let's talk"),
             but stays a single line in Spanish, so it must scale with the
             viewport rather than rely on wrapping: an earlier fixed-rem Anton
             version overran the shell and was silently cut by the body's
             overflow-x. The clamp caps at 12.5rem (200px) where the shell stops
             growing. */
          className="-ml-2.5 font-script text-[clamp(6rem,24vw,12.5rem)] leading-none font-normal tracking-normal text-accent"
        >
          <ScriptWrite duration={2} delay={0.3} className="inline-block origin-left -rotate-4">
            {t.contact.headline}
          </ScriptWrite>
        </motion.h2>

        <div className="mt-14 grid grid-cols-1 gap-12 md:mt-20 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="body-copy text-base md:text-lg">{t.contact.lede}</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-3">
              <a
                href={`mailto:${CONTACT.email}`}
                className="group inline-flex items-center justify-center gap-2.5 bg-accent px-8 py-4 font-medium text-paper transition-colors duration-200 hover:bg-accent-dim active:scale-[0.98]"
              >
                {t.contact.cta}
                <ArrowUpRightIcon
                  size={18}
                  weight="bold"
                  className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>
              <a
                href="https://wa.me/573175249226"
                target="_blank"
                rel="noreferrer noopener"
                className="group inline-flex items-center justify-center gap-2.5 border border-paper/30 px-8 py-4 font-medium text-paper transition-colors duration-200 hover:border-paper hover:bg-paper hover:text-ink active:scale-[0.98]"
              >
                WhatsApp
                <WhatsappLogoIcon
                  size={18}
                  weight="bold"
                  className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>
              <a
                href={CONTACT.instagram}
                target="_blank"
                rel="noreferrer noopener"
                className="group inline-flex items-center justify-center gap-2.5 border border-paper/30 px-8 py-4 font-medium text-paper transition-colors duration-200 hover:border-paper hover:bg-paper hover:text-ink active:scale-[0.98]"
              >
                {t.contact.instagramCta}
                <InstagramLogoIcon
                  size={18}
                  weight="bold"
                  className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>
            </div>
          </div>

          <dl className="lg:col-span-6 lg:col-start-7">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex flex-col gap-1 border-t border-paper/12 py-6 sm:flex-row sm:items-baseline sm:gap-8"
              >
                <dt className="label w-32 shrink-0">{row.label}</dt>
                <dd className="text-lg">
                  {row.href ? (
                    <a
                      href={row.href}
                      {...(row.external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
                      {...(row.download ? { download: true } : {})}
                      className="underline decoration-paper/25 underline-offset-4 transition-colors hover:decoration-accent hover:text-accent"
                    >
                      {row.value}
                    </a>
                  ) : (
                    row.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
