import { useEffect } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";

import { useAdminProfile } from "../components/ProfileProvider";
import "../styles/Overview.css";

const collections = [
  {
    key: "projects",
    title: "Projects",
    color: "#a797ff",
    description: "Your work, case studies, and ideas brought to life.",
  },
  {
    key: "skills",
    title: "Skills",
    color: "#72d9d0",
    description: "The technologies and tools behind your work.",
  },
  {
    key: "services",
    title: "Services",
    color: "#f3c17c",
    description: "What you offer and how you help your clients.",
  },
];

const paths = {
  projects: "M3 7h6l2-3h4l2 3h4v13H3z M3 10h18",
  skills: "m8 5-7 7 7 7 m8-14 7 7-7 7 m-3-17-2 20",
  services: "M8 7V4h8v3 M3 7h18v14H3z M3 12h18 M10 12v3h4v-3",
  arrow: "M7 17 17 7 M7 7h10v10",
  refresh:
    "M20 7v5h-5 M4 17v-5h5 M6 7a7 7 0 0 1 11-2l3 3 M4 16l3 3a7 7 0 0 0 11-2",
};

function Icon({ name, className }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}

function AnimatedCount({ value, reduceMotion }) {
  const number = useMotionValue(0);
  const rounded = useTransform(number, Math.round);

  useEffect(() => {
    if (value === null) return;

    if (reduceMotion) {
      number.set(value);
      return;
    }

    const animation = animate(number, value, {
      duration: 0.8,
      ease: "easeOut",
    });

    return () => animation.stop();
  }, [value, reduceMotion, number]);

  return value === null ? (
    <span aria-hidden="true">—</span>
  ) : (
    <motion.span aria-hidden="true">{rounded}</motion.span>
  );
}

export default function Overview({
  username,
  counts,
  error,
  onRefresh,
  onNavigate,
}) {
  const { profile } = useAdminProfile();
  const reduceMotion = useReducedMotion();

  const displayName = profile?.display_name || username || "there";
  const loading = counts === null && !error;

  const total = counts
    ? collections.reduce((sum, item) => sum + (counts[item.key] || 0), 0)
    : null;

  const today = new Date();

  let offset = 0;

  const segments = collections.map((item) => {
    const percentage = total > 0 ? ((counts[item.key] || 0) / total) * 100 : 0;

    const segment = { ...item, percentage, offset };
    offset += percentage;

    return segment;
  });

  const entrance = {
    hidden: {
      opacity: 0,
      y: reduceMotion ? 0 : 18,
    },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduceMotion ? 0 : 0.45,
      },
    },
  };

  return (
    <motion.section
      className="overview-section"
      aria-label="Portfolio overview"
      initial={reduceMotion ? false : "hidden"}
      animate="show"
      variants={{
        show: {
          transition: {
            staggerChildren: reduceMotion ? 0 : 0.08,
          },
        },
      }}
    >
      <div className="overview-toolbar">
        <time dateTime={today.toISOString()}>
          {today.toLocaleDateString("en", {
            weekday: "long",
            day: "numeric",
            month: "short",
          })}
        </time>

        <button
          className="overview-refresh"
          type="button"
          onClick={onRefresh}
          disabled={loading}
        >
          <Icon
            name="refresh"
            className={loading ? "overview-spinning" : undefined}
          />
          {loading ? "Refreshing…" : "Refresh overview"}
        </button>
      </div>

      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}

      <motion.div className="overview-welcome" variants={entrance}>
        <div className="overview-welcome-copy">
          <p className="overview-eyebrow">
            <span />
            PORTFOLIO WORKSPACE
          </p>

          <h2>
            Welcome back,
            <br />
            <span>{displayName}.</span>
          </h2>

          <p className="overview-intro">
            Your projects, skills, and services—all in one place. Choose what
            you want to work on next.
          </p>

          <button
            className="overview-primary"
            type="button"
            onClick={() => onNavigate("projects")}
          >
            Manage projects
            <Icon name="arrow" />
          </button>
        </div>

        <div className="overview-collection" aria-busy={loading}>
          <p className="overview-collection-heading">
            Your published collection
          </p>

          <div className="overview-collection-body">
            <div
              className="overview-chart"
              role="img"
              aria-label={
                total === null
                  ? "Published counts unavailable"
                  : total +
                    " published items: " +
                    collections
                      .map((item) => (counts[item.key] || 0) + " " + item.title)
                      .join(", ")
              }
            >
              <svg viewBox="0 0 120 120" aria-hidden="true">
                <circle
                  className="overview-chart-track"
                  cx="60"
                  cy="60"
                  r="50"
                />

                {segments.map((item) => (
                  <circle
                    key={item.key}
                    className="overview-chart-segment"
                    cx="60"
                    cy="60"
                    r="50"
                    pathLength="100"
                    fill="none"
                    stroke={item.color}
                    strokeDasharray={
                      Math.max(0, item.percentage - 1.5) +
                      " " +
                      (100 - Math.max(0, item.percentage - 1.5))
                    }
                    strokeDashoffset={-item.offset}
                  />
                ))}
              </svg>

              <div className="overview-chart-center" aria-hidden="true">
                <strong>
                  <AnimatedCount value={total} reduceMotion={reduceMotion} />
                </strong>
                <span>published items</span>
              </div>
            </div>

            <ul className="overview-legend">
              {collections.map((item) => (
                <li key={item.key} style={{ "--overview-accent": item.color }}>
                  <span className="overview-dot" />
                  <span>{item.title}</span>
                  <strong>{counts?.[item.key] ?? "—"}</strong>
                </li>
              ))}
            </ul>
          </div>

          <p className="overview-collection-note">
            Counts include published content only.
          </p>
        </div>
      </motion.div>

      <motion.div className="overview-library-heading" variants={entrance}>
        <div>
          <p className="overview-eyebrow">MAKE YOUR NEXT UPDATE</p>
          <h3>Content library</h3>
        </div>

        <span>Choose a collection to manage</span>
      </motion.div>

      <div className="overview-stats" aria-busy={loading}>
        {collections.map((item) => (
          <motion.button
            key={item.key}
            type="button"
            className="overview-stat"
            style={{ "--overview-accent": item.color }}
            variants={entrance}
            whileHover={reduceMotion ? undefined : { y: -5 }}
            whileTap={reduceMotion ? undefined : { scale: 0.985 }}
            onClick={() => onNavigate(item.key)}
            aria-label={
              "Manage " +
              item.title +
              ". " +
              (counts?.[item.key] ?? "Loading") +
              " published."
            }
          >
            <span className="overview-stat-top">
              <span className="overview-stat-icon">
                <Icon name={item.key} />
              </span>
              <span className="overview-stat-label">Published</span>
            </span>

            <span className="overview-stat-value">
              <strong>
                <AnimatedCount
                  value={counts?.[item.key] ?? null}
                  reduceMotion={reduceMotion}
                />
              </strong>
              <span>{item.title}</span>
            </span>

            <span className="overview-stat-description">
              {item.description}
            </span>

            <span className="overview-stat-footer">
              Open library
              <Icon name="arrow" />
            </span>
          </motion.button>
        ))}
      </div>
    </motion.section>
  );
}
