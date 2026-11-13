import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import "../styles/Contact.css";

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

export default function Contact() {
  const reduceMotion = useReducedMotion();
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState({
    type: "",
    message: "",
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (sending) return;

    const form = event.currentTarget;
    const formData = new FormData(form);

    formData.append("access_key", "b93374d5-7d7d-4d2f-a171-33320e0d4d20");

    setSending(true);
    setFeedback({ type: "", message: "" });

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Your message could not be sent. Please try again.",
        );
      }

      form.reset();

      setFeedback({
        type: "success",
        message: "Message sent. Thank you for reaching out!",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="connect" className="contact-section">
      <div className="contact-container">
        <motion.div
          className="contact-intro"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <p className="contact-eyebrow">
            <span />
            LET’S CONNECT
          </p>

          <h2 className="contact-title">
            Have an idea?
            <br />
            <span>Let’s build it.</span>
          </h2>

          <p className="contact-description">
            Have a project in mind, want to collaborate, or just say hello? Send
            me a message.
          </p>

          <div className="contact-socials">
            <a
              href="https://github.com/arafatalhomedy"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
              <ArrowIcon />
            </a>

            <a
              href="https://www.linkedin.com/in/arafat-ali-8686-ali/"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
              <ArrowIcon />
            </a>
          </div>
        </motion.div>

        <motion.form
          className="contact-form"
          onSubmit={handleSubmit}
          aria-busy={sending}
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.55,
            delay: reduceMotion ? 0 : 0.12,
          }}
        >
          <div className="contact-form-heading">
            <h3>Start a conversation</h3>
            <span aria-hidden="true">
              <ArrowIcon />
            </span>
          </div>

          <p className="contact-form-note">All fields are required.</p>

          <div className="contact-fields-row">
            <div className="contact-field">
              <label htmlFor="contact-name">Your name</label>

              <input
                id="contact-name"
                name="name"
                type="text"
                placeholder="Enter your name"
                autoComplete="name"
                maxLength={100}
                required
              />
            </div>

            <div className="contact-field">
              <label htmlFor="contact-email">Email address</label>

              <input
                id="contact-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                maxLength={254}
                required
              />
            </div>
          </div>

          <div className="contact-field">
            <label htmlFor="contact-message">Your message</label>

            <textarea
              id="contact-message"
              name="message"
              placeholder="Tell me a little about your idea..."
              rows={4}
              maxLength={5000}
              required
            />
          </div>

          <motion.button
            className="contact-submit"
            type="submit"
            disabled={sending}
            whileHover={reduceMotion || sending ? undefined : { scale: 1.01 }}
            whileTap={reduceMotion || sending ? undefined : { scale: 0.99 }}
          >
            {sending ? "Sending message…" : "Send message"}

            {sending ? (
              <span className="contact-spinner" aria-hidden="true" />
            ) : (
              <ArrowIcon />
            )}
          </motion.button>

          <p
            className="contact-feedback"
            data-type={feedback.type}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {feedback.message}
          </p>
        </motion.form>
      </div>
    </section>
  );
}
