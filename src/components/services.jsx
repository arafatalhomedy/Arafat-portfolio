import { motion, useReducedMotion } from "motion/react";
import ServiceCard from "./ServiceCard";
import "../styles/Services.css";
import {
  PortfolioContentStatus,
  usePortfolioContent,
} from "./PortfolioContent";

export default function Services() {
  const { services, loading, error, reload } = usePortfolioContent();

  const reduceMotion = useReducedMotion();

  if (services.length === 0) {
    return (
      <PortfolioContentStatus
        id="services"
        title="What I build."
        loading={loading}
        error={error}
        onRetry={reload}
        emptyMessage="Services will be available soon."
      />
    );
  }

  return (
    <section id="services" className="services-section">
      <div className="services-container">
        <motion.div
          className="services-heading"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <p className="services-eyebrow">
              <span />
              WHAT I BUILD & EXPLORE
            </p>

            <h2 className="services-title">
              Modern web.
              <br />
              <span>Intelligent possibilities.</span>
            </h2>
          </div>

          <p className="services-intro">
            Combining web development with a growing understanding of AI to turn
            ideas into useful digital experiences.
          </p>
        </motion.div>

        <div className="services-grid">
          {services.map((service, index) => (
            <ServiceCard key={service.id} service={service} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
