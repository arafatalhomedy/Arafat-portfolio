import { useEffect, useRef, useState } from "react";
import { uploadProjectImage } from "../api";
import "../styles/ProjectEditor.css";

function makeForm(project) {
  return {
    title: project?.title || "",
    category: project?.category || "WEB APPLICATION",
    description: project?.description || "",
    image: project?.image || "",
    tags: (project?.tags || []).join(", "),
    github: project?.github || "",
    live: project?.live || "",
    sort_order: String(project?.sort_order ?? 0),
    is_published: Boolean(project?.is_published),
  };
}

function isImageUrl(value) {
  try {
    return ["https:", "http:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
  inputRef,
  maxLength = 2048,
}) {
  return (
    <label className="project-editor-field">
      <span>
        {label}
        {required ? " *" : ""}
      </span>

      <input
        ref={inputRef}
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
      />
    </label>
  );
}

export default function ProjectEditor({
  project,
  token,
  saving: projectSaving,
  onSave,
  onDismiss,
}) {
  const [form, setForm] = useState(() => makeForm(project));
  const [error, setError] = useState("");
  const [previewFailed, setPreviewFailed] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [localPreview, setLocalPreview] = useState("");
  const [uploading, setUploading] = useState(false);

  const imageInputRef = useRef(null);
  const uploadedImageRef = useRef(null);

  const saving = projectSaving || uploading;

  useEffect(() => {
    if (!imageFile) {
      setLocalPreview("");
      return;
    }

    const url = URL.createObjectURL(imageFile);
    setLocalPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  function chooseScreenshot(event) {
    const file = event.target.files?.[0];

    // Allows selecting the same file again.
    event.target.value = "";

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("The image must be smaller than 10 MB.");
      return;
    }

    setError("");
    setPreviewFailed(false);
    setImageFile(file);
    uploadedImageRef.current = null;
  }

  function removeScreenshot() {
    setImageFile(null);
    updateField("image", "");
    setPreviewFailed(false);
    uploadedImageRef.current = null;
  }
  const initialForm = useRef(JSON.stringify(makeForm(project)));
  const dialogRef = useRef(null);
  const titleRef = useRef(null);

  const dirty =
    Boolean(imageFile) || JSON.stringify(form) !== initialForm.current;

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;

    dialog.showModal();
    document.body.style.overflow = "hidden";

    titleRef.current?.focus();

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (!dirty) return;

    function warnBeforeLeaving(event) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", warnBeforeLeaving);

    return () => {
      window.removeEventListener("beforeunload", warnBeforeLeaving);
    };
  }, [dirty]);

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (name === "image") {
      setPreviewFailed(false);
    }
  }

  function requestClose() {
    if (saving) return;

    if (dirty && !window.confirm("Discard your unsaved project changes?")) {
      return;
    }

    onDismiss();
  }

  function handleBackdropClick(event) {
    if (event.target !== event.currentTarget) return;

    const bounds = event.currentTarget.getBoundingClientRect();

    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    ) {
      requestClose();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    setError("");

    const payload = {
      ...form,
      title: form.title.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      image: form.image.trim(),
      github: form.github.trim(),
      live: form.live.trim(),
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      sort_order: Number(form.sort_order),
    };

    setUploading(true);

    try {
      if (imageFile) {
        // Reuse the upload if saving the project failed previously.
        if (uploadedImageRef.current?.file !== imageFile) {
          const url = await uploadProjectImage(imageFile, token);

          uploadedImageRef.current = {
            file: imageFile,
            url,
          };
        }

        payload.image = uploadedImageRef.current.url;
      }

      await onSave(payload);
    } catch (requestError) {
      setError(
        requestError.status === 401
          ? "Your session expired. Sign in again to upload."
          : requestError.message,
      );
    } finally {
      setUploading(false);
    }
  }

  const previewSource = localPreview || form.image.trim();
  const showPreview =
    Boolean(localPreview || isImageUrl(form.image.trim())) && !previewFailed;

  return (
    <dialog
      ref={dialogRef}
      className="project-editor"
      aria-labelledby="project-editor-title"
      onClick={handleBackdropClick}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
    >
      <header className="project-editor-header">
        <div>
          <p>PROJECT DETAILS</p>
          <h2 id="project-editor-title">
            {project ? "Edit project" : "New project"}
          </h2>
        </div>

        <button
          type="button"
          className="project-editor-close"
          onClick={requestClose}
          disabled={saving}
          aria-label="Close project editor"
        >
          ×
        </button>
      </header>

      <form
        id="project-editor-form"
        className="project-editor-body"
        onSubmit={handleSubmit}
        aria-busy={saving}
      >
        {error && (
          <p className="project-editor-error" role="alert">
            {error}
          </p>
        )}

        <fieldset disabled={saving}>
          <section className="project-editor-section">
            <h3>01 / The essentials</h3>

            <Field
              inputRef={titleRef}
              label="Project title"
              name="title"
              value={form.title}
              onChange={updateField}
              maxLength={120}
              placeholder="Carhub"
              required
            />

            <Field
              label="Category"
              name="category"
              value={form.category}
              onChange={updateField}
              maxLength={120}
              placeholder="WEB APPLICATION"
            />

            <label className="project-editor-field">
              <span>Description *</span>

              <textarea
                name="description"
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                placeholder="What does this project do? What did you build?"
                rows={5}
                maxLength={5000}
                required
              />
            </label>

            <Field
              label="Technologies"
              name="tags"
              value={form.tags}
              onChange={updateField}
              placeholder="React, Node.js, SQLite"
            />

            <p className="project-editor-hint">
              Separate technologies with commas.
            </p>
          </section>
          <section className="project-editor-section">
            <h3>02 / Screenshot</h3>

            <div className="project-editor-preview">
              {showPreview ? (
                <img
                  key={previewSource}
                  src={previewSource}
                  alt="Project screenshot preview"
                  onError={() => setPreviewFailed(true)}
                />
              ) : (
                <div>
                  <span aria-hidden="true">↑</span>
                  <p>
                    {previewFailed
                      ? "This image could not be previewed."
                      : "Choose a screenshot from your device."}
                  </p>
                </div>
              )}
            </div>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Choose project screenshot"
              onChange={chooseScreenshot}
              hidden
            />

            <div className="project-image-actions">
              <button
                type="button"
                className="project-image-choose"
                onClick={() => imageInputRef.current?.click()}
              >
                <span aria-hidden="true">↑</span>
                {imageFile || form.image ? "Change image" : "Choose image"}
              </button>

              {(imageFile || form.image) && (
                <button
                  type="button"
                  className="project-image-remove"
                  onClick={removeScreenshot}
                >
                  Remove
                </button>
              )}
            </div>

            <p className="project-editor-hint project-image-filename">
              {imageFile
                ? `${imageFile.name} · ${(imageFile.size / 1024 / 1024).toFixed(2)} MB`
                : "JPG, PNG, or WebP · Maximum 10 MB"}
            </p>

            <p className="project-editor-hint">
              Your image uploads when you save the project.
            </p>
          </section>

          <section className="project-editor-section">
            <h3>03 / Project links</h3>

            <Field
              label="Live website"
              name="live"
              type="url"
              value={form.live}
              onChange={updateField}
              placeholder="https://your-project.com"
            />

            <Field
              label="GitHub repository"
              name="github"
              type="url"
              value={form.github}
              onChange={updateField}
              placeholder="https://github.com/username/project"
            />
          </section>

          <section className="project-editor-section">
            <h3>04 / Publishing</h3>

            <label className="project-editor-field">
              <span>Display order</span>

              <input
                type="number"
                min={0}
                max={999999}
                step={1}
                value={form.sort_order}
                onChange={(event) =>
                  updateField("sort_order", event.target.value)
                }
                required
              />
            </label>

            <p className="project-editor-hint">Lower numbers appear first.</p>

            <label className="project-editor-publish">
              <div>
                <strong>Published</strong>
                <span>Leave off to keep this project as a draft.</span>
              </div>

              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(event) =>
                  updateField("is_published", event.target.checked)
                }
              />
            </label>
          </section>
        </fieldset>
      </form>

      <footer className="project-editor-footer">
        <button
          type="button"
          className="project-editor-cancel"
          onClick={requestClose}
          disabled={saving}
        >
          Cancel
        </button>

        <button
          type="submit"
          form="project-editor-form"
          className="project-editor-save"
          disabled={saving}
        >
          {saving
            ? "Saving…"
            : project
              ? "Save changes"
              : form.is_published
                ? "Publish project"
                : "Save draft"}
        </button>
      </footer>
    </dialog>
  );
}
