import { useEffect, useRef, useState } from "react";

import "../styles/ContentEditor.css";

function makeForm(definition, item) {
  const form = {
    sort_order: String(item?.sort_order ?? 0),
    is_published: Boolean(item?.is_published),
  };

  for (const field of definition.fields) {
    const value = item?.[field.name];

    if (field.type === "array") {
      form[field.name] = (value || []).join(", ");
    } else if (field.type === "checkboxes") {
      form[field.name] = [...(value || [])];
    } else {
      form[field.name] = value ?? field.defaultValue ?? "";
    }
  }

  return form;
}

function IconPreview({ icon, title }) {
  const [failed, setFailed] = useState(false);

  let valid = false;

  try {
    valid = ["https:", "http:"].includes(new URL(icon).protocol);
  } catch {
    valid = false;
  }

  return (
    <span className="content-editor-icon">
      {valid && !failed ? (
        <img
          src={icon}
          alt="Skill icon preview"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden="true">
          {title.trim().slice(0, 2).toUpperCase() || "</>"}
        </span>
      )}
    </span>
  );
}

export default function ContentEditor({
  kind,
  definition,
  item,
  saving,
  onSave,
  onDismiss,
}) {
  const [form, setForm] = useState(() => makeForm(definition, item));
  const [error, setError] = useState("");

  const initialForm = useRef(JSON.stringify(makeForm(definition, item)));

  const dialogRef = useRef(null);
  const titleRef = useRef(null);
  const errorRef = useRef(null);

  const dirty = JSON.stringify(form) !== initialForm.current;

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
  }

  function toggleCategory(name, category, checked) {
    setForm((current) => ({
      ...current,
      [name]: checked
        ? [...current[name], category]
        : current[name].filter((value) => value !== category),
    }));
  }

  function requestClose() {
    if (saving) return;

    if (
      dirty &&
      !window.confirm(`Discard your unsaved ${definition.singular} changes?`)
    ) {
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
      sort_order: Number(form.sort_order),
      is_published: form.is_published,
    };

    for (const field of definition.fields) {
      const value = form[field.name];

      payload[field.name] =
        field.type === "array"
          ? value
              .split(",")
              .map((entry) => entry.trim())
              .filter(Boolean)
          : field.type === "checkboxes"
            ? value
            : value.trim();
    }

    try {
      await onSave(payload);
    } catch (requestError) {
      if (requestError.status === 401) return;

      setError(requestError.message);

      window.requestAnimationFrame(() => {
        errorRef.current?.scrollIntoView({
          block: "nearest",
        });
      });
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="content-editor"
      aria-labelledby="content-editor-title"
      onClick={handleBackdropClick}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
    >
      <header className="content-editor-header">
        <div>
          <p>{definition.singular.toUpperCase()} DETAILS</p>

          <h2 id="content-editor-title">
            {item ? "Edit" : "New"} {definition.singular}
          </h2>
        </div>

        <button
          type="button"
          className="content-editor-close"
          onClick={requestClose}
          disabled={saving}
          aria-label={`Close ${definition.singular} editor`}
        >
          ×
        </button>
      </header>

      <form
        id="content-editor-form"
        className="content-editor-body"
        onSubmit={handleSubmit}
        aria-busy={saving}
      >
        {error && (
          <p ref={errorRef} className="content-editor-error" role="alert">
            {error}
          </p>
        )}

        <fieldset className="content-editor-fields" disabled={saving}>
          <div className="content-editor-preview">
            {kind === "skills" ? (
              <IconPreview
                key={form.icon}
                icon={form.icon}
                title={form.title}
              />
            ) : (
              <span className="content-editor-icon" aria-hidden="true">
                {form.icon === "ai" ? "✦" : "</>"}
              </span>
            )}

            <div>
              <strong>
                {form.title.trim() || `Your ${definition.singular}`}
              </strong>
              <span>{form.is_published ? "Published" : "Draft"}</span>
            </div>
          </div>

          {definition.fields.map((field) => {
            if (field.type === "checkboxes") {
              return (
                <fieldset
                  className="content-editor-categories"
                  key={field.name}
                >
                  <legend>{field.label}</legend>

                  <div>
                    {field.options.map((option) => (
                      <label key={option}>
                        <input
                          type="checkbox"
                          checked={form[field.name].includes(option)}
                          onChange={(event) =>
                            toggleCategory(
                              field.name,
                              option,
                              event.target.checked,
                            )
                          }
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>

                  <p className="content-editor-hint">{field.hint}</p>
                </fieldset>
              );
            }

            return (
              <div className="content-editor-field" key={field.name}>
                <label htmlFor={`editor-${field.name}`}>
                  {field.label}
                  {field.required ? " *" : ""}
                </label>

                {field.type === "textarea" ? (
                  <textarea
                    id={`editor-${field.name}`}
                    value={form[field.name]}
                    onChange={(event) =>
                      updateField(field.name, event.target.value)
                    }
                    placeholder={field.placeholder}
                    required={field.required}
                    maxLength={field.maxLength}
                    rows={5}
                  />
                ) : field.type === "select" ? (
                  <select
                    id={`editor-${field.name}`}
                    value={form[field.name]}
                    onChange={(event) =>
                      updateField(field.name, event.target.value)
                    }
                  >
                    {field.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    ref={field.name === "title" ? titleRef : undefined}
                    id={`editor-${field.name}`}
                    type={field.type === "url" ? "url" : "text"}
                    value={form[field.name]}
                    onChange={(event) =>
                      updateField(field.name, event.target.value)
                    }
                    placeholder={field.placeholder}
                    required={field.required}
                    maxLength={field.maxLength ?? 2048}
                  />
                )}

                {field.hint && (
                  <p className="content-editor-hint">{field.hint}</p>
                )}
              </div>
            );
          })}

          <section className="content-editor-publishing">
            <h3>Publishing</h3>

            <div className="content-editor-field">
              <label htmlFor="editor-order">Display order</label>

              <input
                id="editor-order"
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

              <p className="content-editor-hint">Lower numbers appear first.</p>
            </div>

            <label className="content-editor-publish">
              <div>
                <strong>Published</strong>
                <span>
                  Leave off to keep this {definition.singular} as a draft.
                </span>
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

      <footer className="content-editor-footer">
        <button
          type="button"
          className="content-editor-cancel"
          onClick={requestClose}
          disabled={saving}
        >
          Cancel
        </button>

        <button
          type="submit"
          form="content-editor-form"
          className="content-editor-save"
          disabled={saving}
        >
          {saving
            ? "Saving…"
            : item
              ? "Save changes"
              : form.is_published
                ? `Publish ${definition.singular}`
                : "Save draft"}
        </button>
      </footer>
    </dialog>
  );
}
