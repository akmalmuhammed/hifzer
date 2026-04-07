import { describe, expect, it } from "vitest";
import { parseJsonFromText } from "./index";

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
