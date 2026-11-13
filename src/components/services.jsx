import { motion, useReducedMotion } from "motion/react";
import ServiceCard from "./ServiceCard";
import "../styles/Services.css";

const services = [
  {
    id: "01",
    icon: "web",
    category: "DEVELOPMENT",
    title: "Full-Stack Web Development",
    description:
      "Building responsive interfaces and connecting them with backend logic to create complete, practical web applications.",
    tags: ["React", "Node.js", "REST APIs"],
  },
  {
    id: "02",
    icon: "ai",
    category: "INTEGRATION",
    title: "AI-Powered Applications",
    description:
      "Exploring how existing AI models and APIs can bring useful features to web applications, from analyzing content to creating smarter user experiences.",
    tags: ["AI Integration", "Python", "Web Apps"],
  },
];

export default function Services() {
  const reduceMotion = useReducedMotion();

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
