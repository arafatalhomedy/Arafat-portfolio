import { motion, useReducedMotion } from "motion/react";

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

export default function ProjectCard({ project, index }) {
  const reduceMotion = useReducedMotion();
  const previewUrl = project.live || project.github;

  return (
    <motion.article
      className="project-card"
      initial={reduceMotion ? false : { opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.55,
        delay: index * 0.12,
      }}
      whileHover={
        reduceMotion
          ? undefined
          : {
              y: -6,
              transition: { duration: 0.25 },
            }
      }
    >
      <a
        className="project-preview"
        href={previewUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={
          project.live
            ? `Open ${project.title} live demo`
            : `View ${project.title} repository`
        }
      >
        <img
          src={project.image}
          alt={`${project.title} screenshot`}
          loading="lazy"
        />

        <span className="project-preview-shade" />

        <span className="project-number" aria-hidden="true">
          {project.id}
        </span>

        <span className="project-preview-button">
          <ArrowIcon />
        </span>
      </a>

      <div className="project-content">
        <p className="project-category">{project.category}</p>

        <h3 className="project-name">{project.title}</h3>

        <p className="project-description">{project.description}</p>

        <ul
          className="project-tags"
          aria-label={`${project.title} technologies`}
        >
          {project.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>

        <div className="project-links">
          <a
            className="project-code-link"
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View ${project.title} source code`}
          >
            Source code
            <ArrowIcon />
          </a>

          {project.live && (
            <a
              className="project-demo-link"
              href={project.live}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${project.title} live demo`}
            >
              Live demo
              <ArrowIcon />
            </a>
          )}
        </div>
      </div>
    </motion.article>
  );
}
