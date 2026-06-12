"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { X } from "lucide-react";

export type ExpandableCardItem = {
  title: string;
  description: string;
  ctaText: string;
  ctaHref?: string;
  ctaOnClick?: () => void;
  icon: ReactNode;
  content: ReactNode;
};

export function ExpandableFeatureCards({ items }: { items: ExpandableCardItem[] }) {
  const [active, setActive] = useState<ExpandableCardItem | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    if (active) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  useOutsideClick(ref, () => setActive(null));

  return (
    <>
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {active && (
          <div className="fixed inset-0 z-50 grid place-items-center p-4">
            <motion.button
              key={`button-${active.title}-${id}`}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.05 } }}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-card text-foreground shadow lg:hidden"
              onClick={() => setActive(null)}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </motion.button>
            <motion.div
              layoutId={`card-${active.title}-${id}`}
              ref={ref}
              className="flex h-full w-full max-w-[500px] flex-col overflow-hidden rounded-3xl border border-border bg-card sm:h-auto sm:max-h-[90vh]"
            >
              <motion.div
                layoutId={`image-${active.title}-${id}`}
                className="flex h-40 w-full items-center justify-center bg-gradient-to-br from-primary/15 to-accent/40 text-primary"
              >
                <div className="[&_svg]:h-12 [&_svg]:w-12">{active.icon}</div>
              </motion.div>
              <div className="flex flex-col gap-4 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <motion.h3
                      layoutId={`title-${active.title}-${id}`}
                      className="text-lg font-semibold text-foreground"
                    >
                      {active.title}
                    </motion.h3>
                    <motion.p
                      layoutId={`description-${active.description}-${id}`}
                      className="mt-1 text-sm text-muted-foreground"
                    >
                      {active.description}
                    </motion.p>
                  </div>
                  {active.ctaHref ? (
                    <motion.a
                      layoutId={`button-${active.title}-${id}`}
                      href={active.ctaHref}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      {active.ctaText}
                    </motion.a>
                  ) : (
                    <motion.button
                      layoutId={`button-${active.title}-${id}`}
                      onClick={() => {
                        active.ctaOnClick?.();
                        setActive(null);
                      }}
                      className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      {active.ctaText}
                    </motion.button>
                  )}
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="overflow-y-auto pr-1 text-sm leading-relaxed text-foreground/80"
                >
                  {active.content}
                </motion.div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ul className="mx-auto w-full max-w-2xl space-y-2">
        {items.map((card) => (
          <motion.li
            layoutId={`card-${card.title}-${id}`}
            key={card.title}
            onClick={() => setActive(card)}
            className="flex cursor-pointer flex-col items-start gap-3 rounded-xl border border-border bg-card/90 p-4 backdrop-blur hover:bg-accent/40 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <motion.div
                layoutId={`image-${card.title}-${id}`}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-primary"
              >
                {card.icon}
              </motion.div>
              <div className="text-left">
                <motion.h3
                  layoutId={`title-${card.title}-${id}`}
                  className="text-sm font-semibold text-foreground"
                >
                  {card.title}
                </motion.h3>
                <motion.p
                  layoutId={`description-${card.description}-${id}`}
                  className="text-xs text-muted-foreground"
                >
                  {card.description}
                </motion.p>
              </div>
            </div>
            <motion.button
              layoutId={`button-${card.title}-${id}`}
              className="rounded-full border border-border bg-background px-4 py-1.5 text-xs font-semibold text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
            >
              {card.ctaText}
            </motion.button>
          </motion.li>
        ))}
      </ul>
    </>
  );
}
