import { useId, useRef, useState } from "react";
import { usePortfolioContent } from "./PortfolioContent";

import "../styles/ProfilePhoto.css";

export default function ProfilePhoto() {
  const { avatarUrl } = usePortfolioContent();
  const [failedUrl, setFailedUrl] = useState("");
  const [open, setOpen] = useState(false);

  const containerRef = useRef(null);
  const panelId = useId();

  const hasPhoto = avatarUrl && failedUrl !== avatarUrl;

  function resetTilt() {
    const element = containerRef.current;
    if (!element) return;

    element.style.setProperty("--portrait-rx", "0deg");
    element.style.setProperty("--portrait-ry", "0deg");
    element.style.setProperty("--portrait-light-x", "50%");
    element.style.setProperty("--portrait-light-y", "30%");
  }

  function followPointer(event) {
    if (event.pointerType !== "mouse") return;

    const element = containerRef.current;
    const panel = element?.querySelector(".portrait-panel");
    if (!element || !panel) return;

    const box = panel.getBoundingClientRect();

    const x = Math.max(0, Math.min(1, (event.clientX - box.left) / box.width));

    const y = Math.max(0, Math.min(1, (event.clientY - box.top) / box.height));

    element.style.setProperty(
      "--portrait-rx",
      `${((0.5 - y) * 12).toFixed(2)}deg`,
    );

    element.style.setProperty(
      "--portrait-ry",
      `${((x - 0.5) * 16).toFixed(2)}deg`,
    );

    element.style.setProperty("--portrait-light-x", `${x * 100}%`);
    element.style.setProperty("--portrait-light-y", `${y * 100}%`);
  }

  return (
    <div
      ref={containerRef}
      className="portrait"
      data-open={open}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setOpen(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") {
          setOpen(false);
          resetTilt();
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
          resetTilt();
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          setOpen(false);
          resetTilt();
        }
      }}
    >
      <button
        type="button"
        className="portrait-trigger"
        aria-label="Show Arafat Ali's profile"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((previous) => !previous)}
      >
        {hasPhoto ? (
          <img src={avatarUrl} alt="" onError={() => setFailedUrl(avatarUrl)} />
        ) : (
          <span>AA</span>
        )}

        <span className="portrait-trigger-spark" aria-hidden="true">
          ✦
        </span>
      </button>

      <div
        id={panelId}
        className="portrait-panel"
        aria-hidden={!open}
        onPointerMove={followPointer}
        onPointerLeave={resetTilt}
      >
        <div className="portrait-card">
          <div className="portrait-photo">
            {hasPhoto ? (
              <img src={avatarUrl} alt="Arafat Ali" />
            ) : (
              <span className="portrait-fallback">AA</span>
            )}

            <div className="portrait-photo-shade" />

            <span className="portrait-edition">THE PERSON BEHIND THE CODE</span>

            <span className="portrait-corner" aria-hidden="true">
              ↗
            </span>

            <div className="portrait-caption">
              <span className="portrait-caption-label">HELLO, I’M</span>
              <strong>
                Arafat Ali<span>.</span>
              </strong>
            </div>
          </div>

          <div className="portrait-footer">
            <div>
              <p>Software Engineer</p>
              <span>Building ideas into experiences.</span>
            </div>

            <span className="portrait-footer-icon" aria-hidden="true">
              {"</>"}
            </span>
          </div>

          <div className="portrait-reflection" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
