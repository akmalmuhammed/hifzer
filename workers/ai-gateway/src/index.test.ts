import { describe, expect, it } from "vitest";
import { parseGroundedExplainText, parseJsonFromText } from "./index";

describe("ai-gateway parseJsonFromText", () => {
  it("parses plain JSON objects", () => {
    expect(parseJsonFromText('{"summary":"Plain response"}')).toEqual({
      summary: "Plain response",
    });
  });

  it("parses JSON wrapped in markdown fences", () => {
    expect(
      parseJsonFromText(`
\`\`\`json
{"summary":"Fenced response","keyThemes":["Mercy"]}
\`\`\`
`),
    ).toEqual({
      summary: "Fenced response",
      keyThemes: ["Mercy"],
    });
  });

  it("parses JSON when the model adds extra prose around it", () => {
    expect(
      parseJsonFromText(`
Here is the structured answer:

{"summary":"Structured response","reflectionPrompt":null}
`),
    ).toEqual({
      summary: "Structured response",
      reflectionPrompt: null,
    });
  });

  it("parses JSON when prose wraps a fenced block", () => {
    expect(
      parseJsonFromText(`
Here is the answer:

\`\`\`json
{"summary":"Wrapped fenced response","sources":[]}
\`\`\`

Use it carefully.
`),
    ).toEqual({
      summary: "Wrapped fenced response",
      sources: [],
    });
  });
});

describe("ai-gateway parseGroundedExplainText", () => {
  it("parses sectioned grounded notes into structured fields", () => {
    expect(
      parseGroundedExplainText(`
SUMMARY:
This ayah opens the Quran by beginning with Allah's name and highlighting His mercy.

THEMES:
- Beginning with Allah
- Mercy

TAFSIR:
- Opening invocation | This frames every action with dependence on Allah. | Ibn Kathir

WORD NOTES:
- Ar-Rahman | Allah's vast and universal mercy

REFLECTION:
How can starting with Allah's name change the way you begin your day?

SOURCES:
- Quran 1:1 | quran
- Sahih International | translation

GROUNDING TOOLS:
- fetch_grounding_rules
- fetch_quran
`),
    ).toEqual({
      summary: "This ayah opens the Quran by beginning with Allah's name and highlighting His mercy.",
      keyThemes: ["Beginning with Allah", "Mercy"],
      tafsirInsights: [
        {
          title: "Opening invocation",
          detail: "This frames every action with dependence on Allah.",
          source: "Ibn Kathir",
        },
      ],
      wordNotes: [
        {
          term: "Ar-Rahman",
          detail: "Allah's vast and universal mercy",
        },
      ],
      reflectionPrompt: "How can starting with Allah's name change the way you begin your day?",
      sources: [
        { label: "Quran 1:1", kind: "quran" },
        { label: "Sahih International", kind: "translation" },
      ],
      groundingTools: ["fetch_grounding_rules", "fetch_quran"],
    });
  });

  it("treats none-like fields as empty", () => {
    expect(
      parseGroundedExplainText(`
SUMMARY: Brief grounded summary.
THEMES:
- Mercy
WORD NOTES:
None
REFLECTION:
None
SOURCES:
- Quran 1:1 | quran
GROUNDING TOOLS:
- fetch_quran
`),
    ).toEqual({
      summary: "Brief grounded summary.",
      keyThemes: ["Mercy"],
      tafsirInsights: [],
      wordNotes: [],
      reflectionPrompt: null,
      sources: [{ label: "Quran 1:1", kind: "quran" }],
      groundingTools: ["fetch_quran"],
    });
  });
});
