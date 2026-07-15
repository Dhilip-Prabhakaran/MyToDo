import { useState } from "react";
import { api } from "../api.js";
import { fmtDate } from "../insights.js";

// Colour-code known register values so the example reads at a glance.
function badgeClass(kind, value) {
  const v = value.toLowerCase();
  if (kind === "influence") {
    if (v.startsWith("high")) return "chip-red";
    if (v.startsWith("medium")) return "chip-gold";
    return "chip-grey";
  }
  if (kind === "user") {
    // Check "limited" first — "scorecard" contains the substring "core".
    if (v.includes("limited")) return "chip-gold";
    if (v.includes("core")) return "chip-green";
    return "chip-grey";
  }
  return "chip-grey";
}

function ExampleTable({ table }) {
  return (
    <div className="doc-table-wrap">
      <table className="doc-table">
        <thead>
          <tr>
            {table.columns.map((c) => (
              <th key={c.label}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => {
                const col = table.columns[ci];
                return (
                  <td key={ci}>
                    {col.badge ? (
                      <span className={`chip ${badgeClass(col.badge, cell)}`}>{cell}</span>
                    ) : (
                      cell
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExampleCards({ cards }) {
  return (
    <div className="doc-cards">
      {cards.map((card, i) => (
        <div key={i} className="doc-card">
          {card.title && (
            <div className="doc-card-head">
              <span className="doc-card-name">{card.title}</span>
              {card.subtitle && <span className="doc-card-role">{card.subtitle}</span>}
            </div>
          )}
          {card.fields.map((f, fi) => (
            <div key={fi} className={`doc-field ${f.highlight ? "highlight" : ""}`}>
              <span className="doc-field-label">{f.label}</span>
              {f.items ? (
                <ul className="doc-field-list">
                  {f.items.map((it, ii) => (
                    <li key={ii}>{it}</li>
                  ))}
                </ul>
              ) : (
                <p className="doc-field-text">{f.text}</p>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// One section's worked example — table, structured cards, or prose,
// whichever the section supplies. Falls back to the blank-copy placeholder.
function SectionExample({ section }) {
  if (section.exampleTable || section.exampleCards || section.example) {
    return (
      <>
        <p className="doc-example-label">Example · Banyan ATS</p>
        {section.exampleTable ? (
          <ExampleTable table={section.exampleTable} />
        ) : section.exampleCards ? (
          <ExampleCards cards={section.exampleCards} />
        ) : (
          <div className="doc-body">{section.example}</div>
        )}
      </>
    );
  }
  return <p className="hint">{section.placeholder}</p>;
}

// Write the next version of this template's working document: one textarea
// per section (prefilled from the version being extended) plus a change note.
// Saving APPENDS — earlier versions are never touched.
function DocEditor({ template, base, onSaved, onCancel }) {
  const [note, setNote] = useState("");
  const [sections, setSections] = useState(() =>
    Object.fromEntries(template.sections.map((s) => [s.key, base?.sections?.[s.key] || ""]))
  );
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await api.addDocVersion(template.id, { sections, note });
    setSaving(false);
    onSaved();
  };

  return (
    <form onSubmit={submit}>
      <section className="card">
        <div className="card-head">
          <h3>{base ? `New version (v${base.version + 1})` : "My document · v1"}</h3>
          <div className="form-actions">
            <button type="submit" className="btn btn-small" disabled={saving}>
              {saving ? "Saving…" : "Save version"}
            </button>
            <button type="button" className="btn btn-ghost btn-small" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
        <input
          className="doc-note-input"
          placeholder="What changed in this version? (optional, e.g. “tightened scope after review”)"
          value={note}
          maxLength={200}
          onChange={(e) => setNote(e.target.value)}
        />
      </section>

      {template.sections.map((s) => (
        <section key={s.key} className="card doc-section">
          <p className="eyebrow">Section {s.num}</p>
          <h3>{s.title}</h3>
          <p className="doc-guidance">{s.guidance}</p>
          <textarea
            className="doc-edit-ta"
            rows={6}
            placeholder={s.placeholder}
            value={sections[s.key]}
            onChange={(e) => setSections({ ...sections, [s.key]: e.target.value })}
          />
        </section>
      ))}

      <section className="card">
        <div className="form-actions">
          <button type="submit" className="btn" disabled={saving}>
            {saving ? "Saving…" : "Save version"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </section>
    </form>
  );
}

// Template viewer + your living document. The template's guidance stays put;
// the body of each section is YOUR latest version (Banyan reference example a
// click away), with the full version history in a rail on the right.
export default function TemplateViewer({ template, onBack, data, refresh }) {
  const [selectedId, setSelectedId] = useState(null); // null = latest
  const [editing, setEditing] = useState(false);

  const versions = (data?.docVersions || [])
    .filter((v) => v.templateId === template.id)
    .sort((a, b) => b.version - a.version);
  const latest = versions[0] || null;
  const viewing = (selectedId && versions.find((v) => v.id === selectedId)) || latest;
  const isLatest = viewing && latest && viewing.id === latest.id;

  return (
    <div className="doc-editor">
      <div className="doc-toolbar">
        <button className="nav-btn nav-today" onClick={onBack}>
          ← Library
        </button>
        <span className="doc-toolbar-crumb">
          Template {template.code} · {template.title}
        </span>
        {latest ? (
          <span className="chip chip-green">My document · v{latest.version}</span>
        ) : (
          <span className="chip chip-gold">Worked example · Banyan ATS</span>
        )}
        {!editing && (
          <button className="btn btn-small doc-newver" onClick={() => setEditing(true)}>
            {latest ? "＋ New version" : "Start my document"}
          </button>
        )}
      </div>

      {editing ? (
        <DocEditor
          template={template}
          base={latest}
          onSaved={() => {
            setEditing(false);
            setSelectedId(null);
            refresh();
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <div className="doc-layout">
          <div className="doc-main">
            <section className="card doc-header">
              <p className="eyebrow">Business analysis · Template {template.code}</p>
              <h2>{template.title}</h2>
              <p className="doc-guidance">{template.tagline}</p>
              <details className="doc-howto">
                <summary>How to use this template</summary>
                <ul>
                  {template.howToUse.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </details>
            </section>

            {viewing && !isLatest && (
              <div className="ver-banner">
                Viewing v{viewing.version} · {fmtDate(viewing.createdAt.slice(0, 10))} — an older
                snapshot.{" "}
                <button className="btn-icon" onClick={() => setSelectedId(null)}>
                  Back to latest
                </button>
              </div>
            )}

            <section className="card">
              <p className="eyebrow">Front matter</p>
              <h3>Document control</h3>
              <div className="doc-meta-view">
                {template.meta.map((m) => (
                  <div key={m.key} className="doc-meta-item">
                    <span className="doc-meta-label">{m.label}</span>
                    <span className="doc-meta-value">{template.exampleMeta?.[m.key] || "—"}</span>
                    <span className="doc-meta-hint">{m.placeholder}</span>
                  </div>
                ))}
              </div>
            </section>

            {template.sections.map((s) => (
              <section key={s.key} className="card doc-section">
                <p className="eyebrow">Section {s.num}</p>
                <h3>{s.title}</h3>
                <p className="doc-guidance">{s.guidance}</p>
                {s.prompts && (
                  <p className="doc-prompts">
                    <strong>Prompts</strong> · {s.prompts}
                  </p>
                )}
                {viewing ? (
                  <>
                    <p className="doc-mine-label">My document · v{viewing.version}</p>
                    {viewing.sections[s.key] ? (
                      <div className="doc-body mine">{viewing.sections[s.key]}</div>
                    ) : (
                      <p className="hint">Not filled in this version.</p>
                    )}
                    <details className="doc-ref">
                      <summary>Reference example · Banyan ATS</summary>
                      <SectionExample section={s} />
                    </details>
                  </>
                ) : (
                  <SectionExample section={s} />
                )}
              </section>
            ))}
          </div>

          {versions.length > 0 && (
            <aside className="doc-rail">
              <section className="card">
                <div className="card-head">
                  <h3>Versions</h3>
                </div>
                <ul className="ver-list">
                  {versions.map((v) => (
                    <li key={v.id}>
                      <button
                        className={`ver-item ${viewing?.id === v.id ? "active" : ""}`}
                        onClick={() => setSelectedId(v.id === latest.id ? null : v.id)}
                      >
                        <span className="ver-top">
                          <span className="ver-num">v{v.version}</span>
                          <span className="ver-date">{fmtDate(v.createdAt.slice(0, 10))}</span>
                          {v.id === latest.id && <span className="chip chip-green">latest</span>}
                        </span>
                        {v.note && <span className="ver-note">{v.note}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  className="btn-icon btn-danger"
                  title="Remove the newest version (a mistaken save)"
                  onClick={async () => {
                    if (confirm(`Delete v${latest.version}? Older versions are kept.`)) {
                      await api.deleteDocVersion(latest.id);
                      setSelectedId(null);
                      refresh();
                    }
                  }}
                >
                  Delete v{latest.version}
                </button>
              </section>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
