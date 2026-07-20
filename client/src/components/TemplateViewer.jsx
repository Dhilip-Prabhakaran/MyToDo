// Read-only view of a learning template: guidance and prompts for each
// section, with the complete worked example (Banyan ATS) shown as the
// document body — plain prose per section, easy to paste updated text into.
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
          {s.example ? (
            <>
              <p className="doc-example-label">Example · Banyan ATS</p>
              <div className="doc-body">{s.example}</div>
            </>
          ) : (
            <p className="hint">{s.placeholder}</p>
          )}
        </section>
      ))}
    </div>
  );
}
