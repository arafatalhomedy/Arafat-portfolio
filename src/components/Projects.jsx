import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import {
  PortfolioContentStatus,
  usePortfolioContent,
} from "./PortfolioContent";

import "../styles/Projects.css";

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
      <path d="M7 17 17 7M7 7h10v10" />
    </svg>
  );
}

export default function Projects() {
  const { projects, loading, error, reload } = usePortfolioContent();

  const [selectedIndex, setSelected] = useState(0);
  const [direction, setDirection] = useState(1);

  const reduceMotion = useReducedMotion();

  const selected = Math.min(selectedIndex, Math.max(0, projects.length - 1));

  const project = projects[selected];

  const chooseProject = (index, movement) => {
    if (index === selected) return;

    setDirection(movement ?? (index > selected ? 1 : -1));
    setSelected(index);
  };

  const moveProject = (movement) => {
    const next = (selected + movement + projects.length) % projects.length;

    chooseProject(next, movement);
  };

  const transitions = {
    enter: (movement) => ({
      opacity: 0,
      x: reduceMotion ? 0 : movement * 24,
    }),
    visible: {
      opacity: 1,
      x: 0,
    },
    exit: (movement) => ({
      opacity: 0,
      x: reduceMotion ? 0 : movement * -24,
    }),
  };
  if (!project) {
    return (
      <PortfolioContentStatus
        id="projects"
        title="Selected work."
        loading={loading}
        error={error}
        onRetry={reload}
        emptyMessage="New projects are coming soon."
      />
    );
  }
  return (
    <section id="projects" className="work-section">
      <div className="work-container">
        <div className="work-heading">
          <div>
            <p className="work-eyebrow">
              <span />
              SELECTED WORK
            </p>

            <h2>
              Built with purpose.
              <span> Made to work.</span>
            </h2>
          </div>

          <a
            className="work-github"
            href="https://github.com/arafatalhomedy"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
            <ArrowIcon />
          </a>
        </div>

        <div className="work-navigation">
          <div className="work-tabs" role="group" aria-label="Select a project">
            {projects.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className="work-tab"
                aria-pressed={selected === index}
                aria-controls="work-preview"
                onClick={(event) => {
                  chooseProject(index);

                  event.currentTarget.scrollIntoView({
                    behavior: reduceMotion ? "instant" : "smooth",
                    block: "nearest",
                    inline: "nearest",
                  });
                }}
              >
                <span className="work-tab-number">{item.display_number}</span>

                {item.title}

                {selected === index && (
                  <motion.span
                    className="work-tab-line"
                    layoutId="work-active-tab"
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : {
                            type: "spring",
                            stiffness: 400,
                            damping: 32,
                          }
                    }
                  />
                )}
              </button>
            ))}
          </div>

          <div className="work-arrows">
            <button
              type="button"
              onClick={() => moveProject(-1)}
              aria-label="Previous project"
            >
              ←
            </button>

            <button
              type="button"
              onClick={() => moveProject(1)}
              aria-label="Next project"
            >
              →
            </button>
          </div>
        </div>

        <div id="work-preview" className="work-stage">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.article
              key={project.id}
              className="work-project"
              custom={direction}
              variants={transitions}
              initial="enter"
              animate="visible"
              exit="exit"
              transition={{
                duration: reduceMotion ? 0 : 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
              aria-labelledby={`work-title-${project.id}`}
            >
              <a
                className="work-image-link"
                href={project.image}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open full ${project.title} screenshot`}
              >
                <img
                  className="work-image"
                  src={project.image}
                  alt={`${project.title} screenshot`}
                />

                <span className="work-image-label">
                  Explore preview
                  <ArrowIcon />
                </span>
              </a>

              <div className="work-details">
                <div className="work-project-meta">
                  <span>{project.category}</span>

                  <span aria-hidden="true">
                    {project.display_number} /{" "}
                    {String(projects.length).padStart(2, "0")}
                  </span>
                </div>

                <h3 id={`work-title-${project.id}`}>{project.title}</h3>

                <p className="work-description">{project.description}</p>

                {project.tags.length > 0 && (
                  <ul className="work-tags" aria-label="Technologies">
                    {project.tags.map((tag) => (
                      <li key={tag}>{tag}</li>
                    ))}
                  </ul>
                )}

                <div className="work-actions">
                  <a
                    className="work-primary-link"
                    href={project.live || project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {project.live ? "Open project" : "View repository"}

                    <ArrowIcon />
                  </a>

                  {project.live && (
                    <a
                      className="work-source-link"
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Source code
                      <ArrowIcon />
                    </a>
                  )}
                </div>
              </div>
            </motion.article>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
