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

// Read-only view of a learning template: guidance and prompts for each
// section, with the complete worked example (Banyan ATS) shown as the
// document body.
export default function TemplateViewer({ template, onBack }) {
  return (
    <div className="doc-editor">
      <div className="doc-toolbar">
        <button className="nav-btn nav-today" onClick={onBack}>
          ← Library
        </button>
        <span className="doc-toolbar-crumb">
          Template {template.code} · {template.title}
        </span>
        <span className="chip chip-gold">Worked example · Banyan ATS</span>
      </div>

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
          <SectionExample section={s} />
        </section>
      ))}
    </div>
  );
}
