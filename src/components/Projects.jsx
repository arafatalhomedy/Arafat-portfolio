import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import assets from "../assets";
import carhubPreview from "../assets/carhub.jpg";
import attoorPreview from "../assets/attoor.jpg";

import "../styles/Projects.css";

const projects = [
  {
    id: "01",
    title: "Carhub",
    category: "CAR RENTAL PLATFORM",
    description:
      "A responsive car rental platform for browsing vehicles, comparing rental plans, choosing pickup and return details, and managing bookings and favorites.",
    image: carhubPreview,
    tags: [],
    github: "https://github.com/arafatalhomedy/CarWeb",
    live: "https://car-web-sandy.vercel.app/",
  },
  {
    id: "02",
    title: "Attoor",
    category: "CONSTRUCTION & ENGINEERING WEBSITE",
    description:
      "A company website for Attoor.CEGS that presents its construction and engineering services, showcases projects, and helps prospective clients contact the team.",
    image: attoorPreview,
    tags: [],
    github: "https://github.com/arafatalhomedy/attoor-website",
    live: "https://arafatalhomedy.github.io/attoor-website/#/",
  },
  {
    id: "03",
    title: "ATS CV Checker",
    category: "WEB APPLICATION",
    description:
      "Compare resumes with job descriptions, uncover missing keywords, and understand how well a CV matches a role.",
    image: assets.cv_checker,
    tags: ["React", "Python", "Flask"],
    github: "https://github.com/arafatalhomedy/ATC-CV-Checker",
    live: "https://arafatalhomedy.github.io/ATC-CV-Checker/",
  },
  {
    id: "04",
    title: "Letter Safari",
    category: "EDUCATIONAL GAME",
    description:
      "A jungle adventure that teaches children letters and phonics through matching games, animal rescues, and spoken sounds.",
    image: assets.leter_safari,
    tags: ["Python", "Pygame", "NumPy"],
    github: "https://github.com/arafatalhomedy/letter_safari_project",
    live: null,
  },
];

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
  const [selected, setSelected] = useState(0);
  const [direction, setDirection] = useState(1);

  const reduceMotion = useReducedMotion();
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
                <span className="work-tab-number">{item.id}</span>

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
                    {project.id} / {String(projects.length).padStart(2, "0")}
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
