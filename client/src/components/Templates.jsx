import { useState } from "react";
import { TEMPLATES, templateById } from "../templates/defs.js";
import TemplateViewer from "./TemplateViewer.jsx";

// Learning library: browse BA templates and read each one with its complete
// worked example. New templates are added in src/templates/defs.js — see the
// "how to add" recipe at the top of that file.
export default function Templates() {
  const [openId, setOpenId] = useState(null);

  const open = templateById(openId);
  if (open && open.status === "ready") {
    return <TemplateViewer template={open} onBack={() => setOpenId(null)} />;
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h2 className="section-title">Business analysis · learning library</h2>
          <p className="card-sub">
            Reusable BA templates — each a guidance-annotated worksheet with a complete worked
            example (Banyan ATS). A new template lands here with every topic learned.
          </p>
        </div>
      </div>

      <div className="tpl-grid">
        {TEMPLATES.map((t) => {
          const ready = t.status === "ready";
          return (
            <section key={t.id} className={`card tpl-card ${ready ? "" : "tpl-planned"}`}>
              <div className="tpl-card-top">
                <span className="tpl-code">{t.code}</span>
                <span className={`chip ${ready ? "chip-green" : "chip-grey"}`}>
                  {ready ? "Ready" : "Planned"}
                </span>
              </div>
              <h3>{t.title}</h3>
              <p className="tpl-desc">{t.tagline}</p>
              {ready ? (
                <div className="tpl-actions">
                  <button className="btn btn-small" onClick={() => setOpenId(t.id)}>
                    View template →
                  </button>
                  {t.tags && (
                    <span className="tpl-tags">
                      {t.tags.map((tag) => (
                        <span key={tag} className="chip chip-grey">
                          {tag}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
              ) : (
                <p className="tpl-date">arriving as I learn it</p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
