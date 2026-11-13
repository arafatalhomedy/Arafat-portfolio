import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";

import "../styles/Footer.css";

const navigation = [
  { label: "Home", href: "#head" },
  { label: "Services", href: "#services" },
  { label: "Skills", href: "#skills" },
  { label: "Projects", href: "#projects" },
  { label: "Contact", href: "#connect" },
];

const socials = [
  {
    label: "GitHub",
    href: "https://github.com/arafatalhomedy",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/arafat-ali-8686-ali/",
  },
];

function ArrowIcon() {
  return (
    <svg
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
      <path d="M7 17 17 7M7 7h10v10" />
    </svg>
  );
}

export default function Footer() {
  const reduceMotion = useReducedMotion();

  const pointerX = useMotionValue(-500);
  const pointerY = useMotionValue(-500);

  const smoothX = useSpring(pointerX, {
    stiffness: 120,
    damping: 25,
  });

  const smoothY = useSpring(pointerY, {
    stiffness: 120,
    damping: 25,
  });

  const spotlight = useMotionTemplate`
    radial-gradient(
      260px circle at ${smoothX}px ${smoothY}px,
      rgba(112, 95, 255, 0.16),
      transparent 75%
    )
  `;

  const handlePointerMove = (event) => {
    if (reduceMotion || event.pointerType !== "mouse") {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();

    pointerX.set(event.clientX - bounds.left);
    pointerY.set(event.clientY - bounds.top);
  };

  return (
    <footer
      className="signature-footer"
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        pointerX.set(-500);
        pointerY.set(-500);
      }}
    >
      <motion.div
        className="signature-footer-glow"
        style={{ backgroundImage: spotlight }}
        aria-hidden="true"
      />

      <motion.div
        className="signature-footer-line"
        initial={reduceMotion ? false : { scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{
          duration: reduceMotion ? 0 : 1,
          ease: "easeOut",
        }}
        aria-hidden="true"
      />

      <div className="signature-footer-inner">
        <div className="signature-footer-top">
          <div className="signature-footer-identity">
            <p className="signature-footer-role">
              FULL-STACK DEVELOPER
              <span aria-hidden="true"> / </span>
              ASPIRING AI ENGINEER
            </p>

            <motion.a
              href="#head"
              className="signature-footer-name"
              aria-label="Arafat Ali — back to top"
              initial={reduceMotion ? false : "hidden"}
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                visible: {
                  transition: {
                    staggerChildren: reduceMotion ? 0 : 0.035,
                  },
                },
              }}
            >
              {Array.from("Arafat Ali.").map((letter, index) => (
                <motion.span
                  key={index}
                  className={
                    letter === " "
                      ? "signature-footer-space"
                      : "signature-footer-letter"
                  }
                  aria-hidden="true"
                  variants={{
                    hidden: { opacity: 0, y: 24 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileHover={
                    reduceMotion || letter === " "
                      ? undefined
                      : {
                          y: -7,
                          rotate: -3,
                          transition: {
                            type: "spring",
                            stiffness: 300,
                            damping: 15,
                          },
                        }
                  }
                >
                  {letter === " " ? "\u00A0" : letter}
                </motion.span>
              ))}
            </motion.a>
          </div>

          <motion.a
            href="#head"
            className="signature-footer-top-button"
            aria-label="Back to top"
            whileHover={reduceMotion ? undefined : { y: -5, rotate: -6 }}
            whileTap={reduceMotion ? undefined : { scale: 0.94 }}
          >
            <span className="signature-footer-top-icon">
              <ArrowIcon />
            </span>
          </motion.a>
        </div>

        <div className="signature-footer-bottom">
          <nav className="signature-footer-nav" aria-label="Footer navigation">
            {navigation.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="signature-footer-socials">
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {social.label}
                <ArrowIcon />
              </a>
            ))}
          </div>

          <p className="signature-footer-copyright">
            © {new Date().getFullYear()} Arafat Ali
          </p>
        </div>
      </div>
    </footer>
  );
}
