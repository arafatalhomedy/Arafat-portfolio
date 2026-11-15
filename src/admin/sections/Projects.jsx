import { useEffect, useRef, useState } from "react";
import useLibraryPagination from "../hooks/useLibraryPagination";
import LibraryPagination from "../components/LibraryPagination";
import { apiRequest } from "../api";
import ProjectEditor from "../components/ProjectEditor";

import "../styles/Projects.css";

function safeUrl(value) {
  try {
    const url = new URL(value);

    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function ProjectThumbnail({ image, title }) {
  const [failed, setFailed] = useState(false);
  const source = safeUrl(image);

  if (!source || failed) {
    return (
      <div className="projects-thumbnail-placeholder">
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="8" cy="8" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>

        <span>No screenshot available</span>
      </div>
    );
  }

  return (
    <img
      src={source}
      alt={`${title} screenshot`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function sortProjects(items) {
  return [...items].sort(
    (first, second) =>
      first.sort_order - second.sort_order || first.id - second.id,
  );
}

export default function Projects({ token, onChanged, onSessionExpired }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const newButtonRef = useRef(null);

  const busy = saving || deletingId !== null;

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError("");

    async function loadProjects() {
      try {
        const data = await apiRequest("/api/admin/projects", {
          token,
          signal: controller.signal,
        });

        if (!Array.isArray(data)) {
          throw new Error("The server returned an invalid project list.");
        }

        if (controller.signal.aborted) return;

        setProjects(sortProjects(data));
      } catch (requestError) {
        if (controller.signal.aborted) return;

        if (requestError.status === 401) {
          onSessionExpired();
          return;
        }

        setError(requestError.message);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadProjects();

    return () => controller.abort();
  }, [token, revision, onSessionExpired]);

  const publishedCount = projects.filter(
    (project) => project.is_published,
  ).length;

  const filters = [
    { id: "all", label: "All projects", count: projects.length },
    { id: "published", label: "Published", count: publishedCount },
    {
      id: "drafts",
      label: "Drafts",
      count: projects.length - publishedCount,
    },
  ];

  const query = search.trim().toLowerCase();

  const visibleProjects = projects.filter((project) => {
    const matchesStatus =
      filter === "all" ||
      (filter === "published" && project.is_published) ||
      (filter === "drafts" && !project.is_published);

    const searchableText = [
      project.title,
      project.category,
      project.description,
      ...(project.tags || []),
    ]
      .join(" ")
      .toLowerCase();

    return matchesStatus && searchableText.includes(query);
  });
  const pagination = useLibraryPagination(visibleProjects, {
    minimumCardWidth: 290,
    resetKey: JSON.stringify([search, filter]),
  });
  function openEditor(project = null) {
    setEditingProject(project);
    setMessage("");
    setEditorOpen(true);
  }

  async function saveProject(payload) {
    setSaving(true);
    setError("");

    try {
      const savedProject = await apiRequest(
        editingProject
          ? `/api/admin/projects/${editingProject.id}`
          : "/api/admin/projects",
        {
          method: editingProject ? "PUT" : "POST",
          token,
          body: payload,
        },
      );

      setProjects((current) =>
        sortProjects(
          editingProject
            ? current.map((item) =>
                item.id === savedProject.id ? savedProject : item,
              )
            : [...current, savedProject],
        ),
      );

      setMessage(editingProject ? "Project updated." : "Project created.");

      setEditorOpen(false);
      setEditingProject(null);

      onChanged();
    } catch (requestError) {
      if (requestError.status === 401) {
        onSessionExpired();
      }

      throw requestError;
    } finally {
      setSaving(false);
    }
  }

  async function deleteProject(project) {
    if (
      busy ||
      !window.confirm(`Delete "${project.title}"? This cannot be undone.`)
    ) {
      return;
    }

    setDeletingId(project.id);
    setError("");
    setMessage("");

    try {
      await apiRequest(`/api/admin/projects/${project.id}`, {
        method: "DELETE",
        token,
      });

      setProjects((current) =>
        current.filter((item) => item.id !== project.id),
      );

      setMessage("Project deleted.");
      onChanged();

      newButtonRef.current?.focus();
    } catch (requestError) {
      if (requestError.status === 401) {
        onSessionExpired();
        return;
      }

      setError(requestError.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section ref={pagination.sectionRef} className="projects-page">
      <div className="projects-page-heading">
        <div>
          <p className="projects-eyebrow">YOUR WORK</p>
          <h2>Project library.</h2>
          <p className="projects-page-description">
            Organize your work and choose what you publish.
          </p>
        </div>

        <button
          ref={newButtonRef}
          type="button"
          className="projects-primary-button"
          onClick={() => openEditor()}
          disabled={busy || loading}
        >
          <span aria-hidden="true">+</span>
          New project
        </button>
      </div>

      <div className="projects-toolbar">
        <label className="projects-search">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>

          <input
            type="search"
            aria-label="Search projects"
            placeholder="Search projects, categories, technologies…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <button
          type="button"
          className="projects-secondary-button"
          onClick={() => {
            setMessage("");
            setRevision((value) => value + 1);
          }}
          disabled={loading || busy}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div
        className="projects-filters"
        role="group"
        aria-label="Filter projects"
      >
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={filter === item.id}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
            <span>{item.count}</span>
          </button>
        ))}
      </div>

      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="admin-notice" role="status">
          {message}
        </p>
      )}

      {loading && projects.length === 0 ? (
        <div className="projects-loading" role="status">
          Loading projects…
        </div>
      ) : error && projects.length === 0 ? null : visibleProjects.length ? (
        <div className="projects-grid">
          {pagination.pageItems.map((project) => {
            const link = safeUrl(project.live) || safeUrl(project.github);

            return (
              <article className="projects-card" key={project.id}>
                <div className="projects-card-image">
                  <ProjectThumbnail
                    key={project.image || "empty"}
                    image={project.image}
                    title={project.title}
                  />

                  <span
                    className="projects-status"
                    data-published={project.is_published}
                  >
                    <span aria-hidden="true" />
                    {project.is_published ? "Published" : "Draft"}
                  </span>
                </div>

                <div className="projects-card-body">
                  <p className="projects-card-category">{project.category}</p>

                  <h3>{project.title}</h3>

                  <p className="projects-card-description">
                    {project.description}
                  </p>

                  <ul className="projects-card-tags" aria-label="Technologies">
                    {(project.tags || []).slice(0, 3).map((tag) => (
                      <li key={tag}>{tag}</li>
                    ))}

                    {(project.tags || []).length > 3 && (
                      <li>+{project.tags.length - 3}</li>
                    )}
                  </ul>

                  <div className="projects-card-actions">
                    <button
                      type="button"
                      className="projects-edit-button"
                      onClick={() => openEditor(project)}
                      disabled={busy || loading}
                      aria-label={`Edit ${project.title}`}
                    >
                      Edit project
                    </button>

                    {link && (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="projects-open-link"
                        aria-label={`Open ${project.title}`}
                      >
                        Open ↗
                      </a>
                    )}

                    <button
                      type="button"
                      className="projects-delete-button"
                      onClick={() => deleteProject(project)}
                      disabled={busy || loading}
                      aria-label={`Delete ${project.title}`}
                    >
                      {deletingId === project.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="projects-empty">
          <span className="projects-empty-icon" aria-hidden="true">
            ↗
          </span>

          <h3>
            {projects.length
              ? "No matching projects."
              : "Your next project starts here."}
          </h3>

          <p>
            {projects.length
              ? "Try another search or change the selected filter."
              : "Add a screenshot, tell its story, and showcase your work."}
          </p>

          {projects.length ? (
            <button
              type="button"
              className="projects-secondary-button"
              onClick={() => {
                setSearch("");
                setFilter("all");
              }}
            >
              Clear filters
            </button>
          ) : (
            <button
              type="button"
              className="projects-primary-button"
              onClick={() => openEditor()}
            >
              + Add your first project
            </button>
          )}
        </div>
      )}

      <LibraryPagination
        {...pagination}
        label="projects"
        disabled={busy || loading}
      />

      {editorOpen && (
        <ProjectEditor
          project={editingProject}
          token={token}
          saving={saving}
          onSave={saveProject}
          onDismiss={() => {
            setEditorOpen(false);
            setEditingProject(null);
          }}
        />
      )}
    </section>
  );
}
