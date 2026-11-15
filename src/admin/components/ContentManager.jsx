import { useEffect, useRef, useState } from "react";
import useLibraryPagination from "../hooks/useLibraryPagination";
import LibraryPagination from "./LibraryPagination";
import { apiRequest } from "../api";
import ContentEditor from "./ContentEditor";

import "../styles/ContentManager.css";

const definitions = {
  skills: {
    title: "Skill library.",
    eyebrow: "YOUR TOOLKIT",
    singular: "skill",
    plural: "Skills",
    symbol: "</>",
    description: "Organize your technologies and development tools.",
    searchPlaceholder: "Search skills, labels, categories…",
    emptyTitle: "Build your development toolkit.",
    emptyDescription:
      "Add the technologies and languages you want to showcase.",
    fields: [
      {
        name: "title",
        label: "Skill name",
        required: true,
        maxLength: 120,
        placeholder: "React",
      },
      {
        name: "label",
        label: "Display label",
        maxLength: 100,
        placeholder: "Frontend development",
      },
      {
        name: "icon",
        label: "Icon URL",
        type: "url",
        placeholder: "https://example.com/react.svg",
      },
      {
        name: "categories",
        label: "Categories",
        type: "checkboxes",
        options: ["Frontend", "Backend", "Languages"],
        hint: "Choose at least one category before publishing.",
      },
    ],
  },

  services: {
    title: "Service library.",
    eyebrow: "WHAT YOU OFFER",
    singular: "service",
    plural: "Services",
    symbol: "◇",
    description: "Present your services clearly and keep them up to date.",
    searchPlaceholder: "Search services, categories, tags…",
    emptyTitle: "Show what you can build.",
    emptyDescription:
      "Add your services with clear descriptions and focus areas.",
    fields: [
      {
        name: "title",
        label: "Service title",
        required: true,
        maxLength: 120,
        placeholder: "Full-Stack Web Development",
      },
      {
        name: "category",
        label: "Category",
        maxLength: 120,
        placeholder: "DEVELOPMENT",
      },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        required: true,
        maxLength: 5000,
        placeholder: "Describe the service and how it helps your clients.",
      },
      {
        name: "icon",
        label: "Service icon",
        type: "select",
        defaultValue: "web",
        options: [
          { value: "web", label: "Web development" },
          { value: "ai", label: "Artificial intelligence" },
        ],
      },
      {
        name: "tags",
        label: "Focus areas",
        type: "array",
        placeholder: "React, Node.js, REST APIs",
        hint: "Separate items with commas.",
      },
    ],
  },
};

function sortItems(items) {
  return [...items].sort(
    (first, second) =>
      first.sort_order - second.sort_order || first.id - second.id,
  );
}

function ContentSymbol({ item, kind }) {
  const [failed, setFailed] = useState(false);

  if (kind === "services") {
    return <span aria-hidden="true">{item.icon === "ai" ? "✦" : "</>"}</span>;
  }

  let validUrl = false;

  try {
    validUrl = ["https:", "http:"].includes(new URL(item.icon).protocol);
  } catch {
    validUrl = false;
  }

  if (validUrl && !failed) {
    return (
      <img
        src={item.icon}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  return <span aria-hidden="true">{item.title.slice(0, 2).toUpperCase()}</span>;
}

export default function ContentManager({
  kind,
  token,
  onChanged,
  onSessionExpired,
}) {
  const config = definitions[kind];

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

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

    async function loadItems() {
      try {
        const data = await apiRequest(`/api/admin/${kind}`, {
          token,
          signal: controller.signal,
        });

        if (!Array.isArray(data)) {
          throw new Error("The server returned an invalid content list.");
        }

        if (controller.signal.aborted) return;

        setItems(sortItems(data));
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

    loadItems();

    return () => controller.abort();
  }, [kind, token, revision, onSessionExpired]);

  const publishedCount = items.filter((item) => item.is_published).length;

  const filters = [
    {
      id: "all",
      label: `All ${config.plural.toLowerCase()}`,
      count: items.length,
    },
    {
      id: "published",
      label: "Published",
      count: publishedCount,
    },
    {
      id: "drafts",
      label: "Drafts",
      count: items.length - publishedCount,
    },
  ];

  const query = search.trim().toLowerCase();

  const visibleItems = items.filter((item) => {
    const matchesStatus =
      filter === "all" ||
      (filter === "published" && item.is_published) ||
      (filter === "drafts" && !item.is_published);

    const searchableText = [
      item.title,
      item.label,
      item.category,
      item.description,
      ...(item.categories || []),
      ...(item.tags || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return matchesStatus && searchableText.includes(query);
  });
  const pagination = useLibraryPagination(visibleItems, {
    minimumCardWidth: 280,
    resetKey: JSON.stringify([kind, search, filter]),
  });
  function openEditor(item = null) {
    setEditingItem(item);
    setMessage("");
    setEditorOpen(true);
  }

  async function saveItem(payload) {
    setSaving(true);
    setError("");

    try {
      const savedItem = await apiRequest(
        editingItem
          ? `/api/admin/${kind}/${editingItem.id}`
          : `/api/admin/${kind}`,
        {
          method: editingItem ? "PUT" : "POST",
          token,
          body: payload,
        },
      );

      setItems((current) =>
        sortItems(
          editingItem
            ? current.map((item) =>
                item.id === savedItem.id ? savedItem : item,
              )
            : [...current, savedItem],
        ),
      );

      setMessage(
        editingItem
          ? "Changes saved."
          : `${config.singular === "skill" ? "Skill" : "Service"} created.`,
      );

      setEditorOpen(false);
      setEditingItem(null);

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

  async function deleteItem(item) {
    if (
      busy ||
      !window.confirm(`Delete "${item.title}"? This cannot be undone.`)
    ) {
      return;
    }

    setDeletingId(item.id);
    setError("");
    setMessage("");

    try {
      await apiRequest(`/api/admin/${kind}/${item.id}`, {
        method: "DELETE",
        token,
      });

      setItems((current) => current.filter((entry) => entry.id !== item.id));

      setMessage("Item deleted.");
      onChanged();

      window.requestAnimationFrame(() => {
        newButtonRef.current?.focus();
      });
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
    <section ref={pagination.sectionRef} className="collection-page">
      <div className="collection-heading">
        <div>
          <p className="collection-eyebrow">{config.eyebrow}</p>
          <h2>{config.title}</h2>
          <p className="collection-description">{config.description}</p>
        </div>

        <button
          ref={newButtonRef}
          type="button"
          className="collection-primary"
          onClick={() => openEditor()}
          disabled={busy || loading}
        >
          <span aria-hidden="true">+</span>
          New {config.singular}
        </button>
      </div>

      <div className="collection-toolbar">
        <label className="collection-search">
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
            aria-label={`Search ${config.plural.toLowerCase()}`}
            placeholder={config.searchPlaceholder}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <button
          type="button"
          className="collection-secondary"
          onClick={() => {
            setMessage("");
            setRevision((value) => value + 1);
          }}
          disabled={busy || loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div
        className="collection-filters"
        role="group"
        aria-label={`Filter ${config.plural.toLowerCase()}`}
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

      {loading && items.length === 0 ? (
        <div className="collection-empty" role="status">
          Loading {config.plural.toLowerCase()}…
        </div>
      ) : error && items.length === 0 ? null : visibleItems.length ? (
        <div className="collection-grid">
          {pagination.pageItems.map((item) => {
            const badges =
              kind === "skills" ? item.categories || [] : item.tags || [];

            return (
              <article className="collection-card" key={item.id}>
                <div className="collection-card-top">
                  <span className="collection-symbol">
                    <ContentSymbol
                      key={`${kind}-${item.icon || "empty"}`}
                      item={item}
                      kind={kind}
                    />
                  </span>

                  <span
                    className="collection-status"
                    data-published={item.is_published}
                  >
                    <span aria-hidden="true" />
                    {item.is_published ? "Published" : "Draft"}
                  </span>
                </div>

                <p className="collection-card-category">
                  {kind === "skills"
                    ? "TECHNOLOGY"
                    : item.category || "SERVICE"}
                </p>

                <h3>{item.title}</h3>

                <p className="collection-card-description">
                  {kind === "skills"
                    ? item.label || "Part of your development toolkit."
                    : item.description}
                </p>

                <ul
                  className="collection-badges"
                  aria-label={kind === "skills" ? "Categories" : "Focus areas"}
                >
                  {badges.slice(0, 4).map((badge) => (
                    <li key={badge}>{badge}</li>
                  ))}

                  {badges.length > 4 && <li>+{badges.length - 4}</li>}
                </ul>

                <div className="collection-card-actions">
                  <button
                    type="button"
                    className="collection-edit"
                    onClick={() => openEditor(item)}
                    disabled={busy || loading}
                    aria-label={`Edit ${item.title}`}
                  >
                    Edit {config.singular}
                  </button>

                  <button
                    type="button"
                    className="collection-delete"
                    onClick={() => deleteItem(item)}
                    disabled={busy || loading}
                    aria-label={`Delete ${item.title}`}
                  >
                    {deletingId === item.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="collection-empty">
          <span className="collection-empty-icon" aria-hidden="true">
            {config.symbol}
          </span>

          <h3>{items.length ? "No matching results." : config.emptyTitle}</h3>

          <p>
            {items.length
              ? "Try another search or change the selected filter."
              : config.emptyDescription}
          </p>

          {items.length ? (
            <button
              type="button"
              className="collection-secondary"
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
              className="collection-primary"
              onClick={() => openEditor()}
            >
              + Add your first {config.singular}
            </button>
          )}
        </div>
      )}

      <LibraryPagination
        {...pagination}
        label={config.plural.toLowerCase()}
        disabled={busy || loading}
      />

      {editorOpen && (
        <ContentEditor
          kind={kind}
          definition={config}
          item={editingItem}
          saving={saving}
          onSave={saveItem}
          onDismiss={() => {
            setEditorOpen(false);
            setEditingItem(null);
          }}
        />
      )}
    </section>
  );
}
