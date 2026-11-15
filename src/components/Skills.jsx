import { useLayoutEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
} from "motion/react";

import {
  PortfolioContentStatus,
  usePortfolioContent,
} from "./PortfolioContent";
import "../styles/Skills.css";

const filters = ["All", "Frontend", "Backend", "Languages"];

// Reposition onto an identical copy without a visible reset.
function wrapPosition(position, cycle) {
  if (!cycle) return 0;

  const minimum = -cycle * 1.5;

  return ((((position - minimum) % cycle) + cycle) % cycle) + minimum;
}

function ArrowIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}

export default function Skills() {
  const { skills, loading, error, reload } = usePortfolioContent();

  if (skills.length === 0) {
    return (
      <PortfolioContentStatus
        id="skills"
        title="My development stack."
        loading={loading}
        error={error}
        onRetry={reload}
        emptyMessage="My toolkit is being updated."
      />
    );
  }

  return <SkillsCarousel skills={skills} />;
}

function SkillsCarousel({ skills }) {
  const [activeFilter, setActiveFilter] = useState("All");
  const [autoPlay, setAutoPlay] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);

  const [geometry, setGeometry] = useState({
    step: 0,
    cycle: 0,
    loop: false,
  });

  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const firstCardRef = useRef(null);

  const animationRef = useRef(null);
  const draggingRef = useRef(false);
  const movingRef = useRef(false);

  const x = useMotionValue(0);
  const reduceMotion = useReducedMotion();
  const inView = useInView(viewportRef, { amount: 0.4 });

  const visibleSkills =
    activeFilter === "All"
      ? skills
      : skills.filter((skill) => skill.categories.includes(activeFilter));

  const effectsEnabled =
    autoPlay && !reduceMotion && inView && !hovered && !focused && !dragging;

  // Measure card spacing whenever the filter or width changes.
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const card = firstCardRef.current;

    if (!viewport || !track || !card) {
      animationRef.current?.stop();

      movingRef.current = false;
      draggingRef.current = false;

      setDragging(false);
      setGeometry({
        step: 0,
        cycle: 0,
        loop: false,
      });

      x.set(0);
      return;
    }

    const measure = () => {
      animationRef.current?.stop();
      movingRef.current = false;

      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;

      const width = parseFloat(getComputedStyle(card).width) || 0;

      const step = width + gap;
      const cycle = step * visibleSkills.length;
      const contentWidth = cycle - gap;

      const loop = contentWidth > viewport.clientWidth + 1;

      setGeometry({ step, cycle, loop });
      x.set(loop ? -cycle : 0);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(viewport);

    return () => {
      observer.disconnect();
      animationRef.current?.stop();
      movingRef.current = false;
    };
  }, [activeFilter, visibleSkills.length, x]);

  // Constant-speed movement rather than start/stop scrolling.
  useAnimationFrame((_, delta) => {
    if (
      !effectsEnabled ||
      !geometry.loop ||
      draggingRef.current ||
      movingRef.current ||
      document.hidden
    ) {
      return;
    }

    const pixelsPerSecond = 28;
    const distance = (pixelsPerSecond * Math.min(delta, 32)) / 1000;

    x.set(wrapPosition(x.get() - distance, geometry.cycle));
  });

  const slide = (direction) => {
    if (!geometry.loop) return;

    animationRef.current?.stop();
    movingRef.current = true;

    const start = wrapPosition(x.get(), geometry.cycle);
    x.set(start);

    animationRef.current = animate(x, start - direction * geometry.step, {
      duration: reduceMotion ? 0 : 0.7,
      ease: [0.22, 1, 0.36, 1],
      onComplete: () => {
        x.set(wrapPosition(x.get(), geometry.cycle));
        movingRef.current = false;
      },
    });
  };

  const startDrag = () => {
    animationRef.current?.stop();
    movingRef.current = false;
    draggingRef.current = true;
    setDragging(true);
  };

  const finishDrag = () => {
    draggingRef.current = false;
    setDragging(false);

    x.set(geometry.loop ? wrapPosition(x.get(), geometry.cycle) : 0);
  };

  return (
    <section
      id="skills"
      className="skills-section"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocused(false);
        }
      }}
    >
      <div className="skills-container">
        <div className="skills-heading">
          <div>
            <p className="skills-eyebrow">
              <span />
              MY TOOLKIT
            </p>

            <h2 className="skills-title">
              My development <span>stack.</span>
            </h2>
          </div>

          <span className="skills-count">{skills.length} technologies</span>
        </div>

        <div className="skills-toolbar">
          <div
            className="skills-filters"
            role="group"
            aria-label="Filter skills"
          >
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                className="skills-filter"
                aria-pressed={activeFilter === filter}
                onClick={() => setActiveFilter(filter)}
              >
                {activeFilter === filter && (
                  <motion.span
                    className="skills-filter-highlight"
                    layoutId="skills-active-filter"
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : {
                            type: "spring",
                            stiffness: 420,
                            damping: 32,
                          }
                    }
                  />
                )}

                <span className="skills-filter-label">{filter}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="skills-autoplay"
            aria-label="Automatic skill animations"
            aria-pressed={autoPlay}
            onClick={() => setAutoPlay((playing) => !playing)}
          >
            <span aria-hidden="true">{autoPlay ? "Ⅱ" : "▶"}</span>
            Auto {autoPlay ? "on" : "off"}
          </button>
        </div>

        <div className="skills-stage">
          <div
            ref={viewportRef}
            className="skills-viewport"
            tabIndex={0}
            role="region"
            aria-label="Skills carousel. Drag, swipe, or use arrow keys."
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") {
                event.preventDefault();
                slide(1);
              }

              if (event.key === "ArrowLeft") {
                event.preventDefault();
                slide(-1);
              }
            }}
          >
            {visibleSkills.length === 0 && (
              <p className="portfolio-content-inline" role="status">
                No skills in this category yet.
              </p>
            )}
            <motion.ul
              ref={trackRef}
              className="skills-track"
              data-loop={geometry.loop}
              data-dragging={dragging}
              style={{ x }}
              drag={geometry.loop ? "x" : false}
              dragConstraints={{
                left: -geometry.cycle * 2,
                right: 0,
              }}
              dragElastic={0}
              dragMomentum={false}
              onDragStart={startDrag}
              onDragEnd={finishDrag}
            >
              {[0, 1, 2].flatMap((copy) =>
                visibleSkills.map((skill, index) => (
                  <motion.li
                    key={`${copy}-${skill.id}`}
                    ref={copy === 1 && index === 0 ? firstCardRef : undefined}
                    className="skill-tile"
                    data-clone-hidden={!geometry.loop && copy !== 1}
                    aria-hidden={copy !== 1}
                    whileHover={
                      reduceMotion || dragging ? undefined : { y: -5 }
                    }
                    transition={{ duration: 0.25 }}
                  >
                    <motion.span
                      className="skill-tile-icon"
                      whileHover={
                        reduceMotion || dragging
                          ? undefined
                          : { scale: 1.1, rotate: -6 }
                      }
                    >
                      {skill.icon ? (
                        <img src={skill.icon} alt="" draggable={false} />
                      ) : (
                        <span className="nextjs-symbol" aria-hidden="true">
                          {skill.title === "Next.js"
                            ? "N"
                            : skill.title.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </motion.span>

                    <h3>{skill.title}</h3>
                    <p>{skill.label || skill.categories.join(" / ")}</p>

                    {(geometry.loop || index < visibleSkills.length - 1) && (
                      <span className="skill-connector" aria-hidden="true">
                        <motion.span
                          className="skill-connector-light"
                          initial={false}
                          animate={
                            effectsEnabled
                              ? {
                                  left: ["0%", "100%"],
                                  opacity: [0, 1, 0],
                                }
                              : {
                                  left: "50%",
                                  opacity: 0.4,
                                }
                          }
                          transition={
                            effectsEnabled
                              ? {
                                  duration: 1.8,
                                  repeat: Infinity,
                                  delay: index * 0.12,
                                  ease: "easeInOut",
                                }
                              : { duration: 0 }
                          }
                        />
                      </span>
                    )}
                  </motion.li>
                )),
              )}
            </motion.ul>
          </div>
        </div>

        <div className="skills-footer">
          <span className="skills-hint">
            <span aria-hidden="true">↔</span>
            Drag or swipe to explore
          </span>

          <div className="skills-controls">
            <button
              type="button"
              className="skills-arrow skills-arrow-left"
              onClick={() => slide(-1)}
              disabled={!geometry.loop}
              aria-label="Previous skill"
            >
              <ArrowIcon />
            </button>

            <button
              type="button"
              className="skills-arrow"
              onClick={() => slide(1)}
              disabled={!geometry.loop}
              aria-label="Next skill"
            >
              <ArrowIcon />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
