import { motion, useReducedMotion } from "motion/react";

function ServiceIcon({ type }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {type === "web" && (
        <>
          <rect x="2" y="3" width="20" height="18" rx="3" />
          <path d="M2 8h20m-15 5-2 2 2 2m10-4 2 2-2 2m-4-5-2 6" />
        </>
      )}

      {type === "ai" && (
        <>
          <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" />
          <path d="M20 2v4m-2-2h4M4 18v4m-2-2h4" />
        </>
      )}

      {type === "model" && (
        <>
          <circle cx="5" cy="5" r="2" />
          <circle cx="19" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="5" cy="19" r="2" />
          <circle cx="19" cy="19" r="2" />
          <path d="m6.5 6.5 4 4m3-0 4-4m-11 11 4-4m3 0 4 4" />
        </>
      )}
    </svg>
  );
}

export default function ServiceCard({ service, index }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      className="service-card"
      initial={reduceMotion ? false : { opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
      }}
      whileHover={
        reduceMotion ? undefined : { y: -8, transition: { duration: 0.25 } }
      }
    >
      <div className="service-card-top">
        <div className="service-card-icon">
          <ServiceIcon type={service.icon} />
        </div>

        <span className="service-card-number" aria-hidden="true">
          {service.id}
        </span>
      </div>

      <p className="service-card-category">{service.category}</p>

      <h3 className="service-card-title">{service.title}</h3>

      <p className="service-card-description">{service.description}</p>

      <ul className="service-card-tags" aria-label="Focus areas">
        {service.tags.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>
    </motion.article>
  );
}
