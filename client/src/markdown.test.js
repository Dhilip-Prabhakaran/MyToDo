import { describe, it, expect } from "vitest";
import { parseMarkdown } from "./components/Markdown.jsx";

describe("parseMarkdown", () => {
  it("parses a pipe table with header and rows", () => {
    const md = [
      "| Name | Role | Influence |",
      "|---|---|---|",
      "| Arthi | Admin | High |",
      "| Mani | Manager | High |",
    ].join("\n");
    const blocks = parseMarkdown(md);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toEqual({
      type: "table",
      header: ["Name", "Role", "Influence"],
      rows: [
        ["Arthi", "Admin", "High"],
        ["Mani", "Manager", "High"],
      ],
    });
  });

  it("tolerates a spaced separator row and trims cells", () => {
    const md = "| A | B |\n| :--- | ---: |\n|  x  |  y  |";
    const [table] = parseMarkdown(md);
    expect(table.type).toBe("table");
    expect(table.header).toEqual(["A", "B"]);
    expect(table.rows).toEqual([["x", "y"]]);
  });

  it("does NOT treat a lone pipe line as a table", () => {
    const blocks = parseMarkdown("a | b is just prose");
    expect(blocks).toEqual([{ type: "p", text: "a | b is just prose" }]);
  });

  it("groups consecutive bullets into one list", () => {
    const blocks = parseMarkdown("- one\n- two\n- three");
    expect(blocks).toEqual([{ type: "list", items: ["one", "two", "three"] }]);
  });

  it("parses headings by level", () => {
    expect(parseMarkdown("### Arthi — Admin")).toEqual([
      { type: "heading", level: 3, text: "Arthi — Admin" },
    ]);
  });

  it("treats each non-blank line as its own paragraph and skips blanks", () => {
    const blocks = parseMarkdown("first line\n\nsecond line");
    expect(blocks).toEqual([
      { type: "p", text: "first line" },
      { type: "p", text: "second line" },
    ]);
  });

  it("handles a realistic persona block (heading, bold lines, bullets)", () => {
    const md = [
      "### Mani — Hiring Manager",
      "**Snapshot:** department-side manager.",
      "**Goals:**",
      "- Quick approval flow",
      "- Own only his rounds",
    ].join("\n");
    const blocks = parseMarkdown(md);
    expect(blocks.map((b) => b.type)).toEqual(["heading", "p", "p", "list"]);
    expect(blocks[3].items).toEqual(["Quick approval flow", "Own only his rounds"]);
  });

  it("returns nothing for empty input", () => {
    expect(parseMarkdown("")).toEqual([]);
    expect(parseMarkdown(null)).toEqual([]);
  });
});
