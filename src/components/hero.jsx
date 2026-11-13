import "../styles/Hero.css";

function ArrowIcon() {
  return (
    <svg
      width="20"
      height="20"
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

export default function Hero() {
  return (
    <section id="head" className="portfolio-hero">
      <div className="hero-glow" aria-hidden="true" />

      <div className="hero-content">
        <p className="hero-eyebrow">
          <span />
          THE PORTFOLIO OF
        </p>

        <h1 className="hero-name">
          Arafat <span>Ali.</span>
        </h1>
        <div className="hero-role">
          <span>Full-Stack Developer</span>
          <span className="hero-role-divider" aria-hidden="true" />
          <span>Aspiring AI Engineer</span>
        </div>

        <p className="hero-description">
          Building modern web applications and exploring what AI can bring to
          them. My focus is on full-stack development, AI integration, and
          developing practical skills in training machine learning models.
        </p>

        <div className="hero-buttons">
          <a href="#projects" className="hero-primary-button">
            Explore my work
            <ArrowIcon />
          </a>

          <a href="#connect" className="hero-secondary-button">
            Let’s connect
            <ArrowIcon />
          </a>
        </div>

        <div className="hero-bottom">
          <div className="hero-socials">
            <a
              href="https://github.com/arafatalhomedy"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub <ArrowIcon />
            </a>

            <a
              href="https://www.linkedin.com/in/arafat-ali-8686-ali/"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn <ArrowIcon />
            </a>
          </div>

          <a href="#services" className="hero-scroll-link">
            Scroll to explore
            <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>
    </section>
  );
}
