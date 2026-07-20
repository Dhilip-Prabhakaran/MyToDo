// A tiny, dependency-free Markdown renderer for the learning templates.
// Supports exactly what the BA docs use: pipe tables, bullet lists, `###`
// headings, blank-line-separated paragraphs, and **bold** inline. Content is
// authored in the repo (trusted), so there is no HTML injection — everything
// renders through React elements, never dangerouslySetInnerHTML.

const splitRow = (line) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());

const isSeparatorRow = (line) => {
  if (!line.includes("-")) return false;
  const cells = splitRow(line);
  return cells.length > 0 && cells.every((c) => /^:?-+:?$/.test(c));
};

// Parse markdown text into an array of block descriptors. Exported for tests.
export function parseMarkdown(text) {
  const lines = (text || "").split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    // Table: a pipe row immediately followed by a |---|---| separator.
    if (line.includes("|") && i + 1 < lines.length && isSeparatorRow(lines[i + 1])) {
      const header = splitRow(line);
      i += 2; // skip header + separator
      const rows = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim() !== "") {
        rows.push(splitRow(lines[i]));
        i++;
      }
      blocks.push({ type: "table", header, rows });
      continue;
    }

    // Bullet list: consecutive lines starting with "- " or "* ".
    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      blocks.push({ type: "list", items });
      continue;
    }

    // Heading: #, ##, ###, …
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      blocks.push({ type: "heading", level: h[1].length, text: h[2] });
      i++;
      continue;
    }

    // Otherwise a single-line paragraph.
    blocks.push({ type: "p", text: line });
    i++;
  }

  return blocks;
}

// Inline: split on ** and toggle bold. Trusted content, so no other parsing.
function inline(text) {
  return text.split(/\*\*/).map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}

export default function Markdown({ text }) {
  const blocks = parseMarkdown(text);
  return (
    <div className="doc-md">
      {blocks.map((b, k) => {
        if (b.type === "heading") {
          return (
            <p key={k} className="md-h">
              {inline(b.text)}
            </p>
          );
        }
        if (b.type === "list") {
          return (
            <ul key={k} className="md-list">
              {b.items.map((it, j) => (
                <li key={j}>{inline(it)}</li>
              ))}
            </ul>
          );
        }
        if (b.type === "table") {
          return (
            <div key={k} className="md-table-wrap">
              <table className="md-table">
                <thead>
                  <tr>
                    {b.header.map((c, j) => (
                      <th key={j}>{inline(c)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {b.rows.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci}>{inline(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return (
          <p key={k} className="md-p">
            {inline(b.text)}
          </p>
        );
      })}
    </div>
  );
}
