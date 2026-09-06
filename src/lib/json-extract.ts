/**
 * Extracts a JSON value (object or array) from a possibly noisy LLM output,
 * handling ```json fenced blocks and leading/trailing prose.
 * Throws when no JSON can be found or parsed.
 */
export function extractJson(text: string): unknown {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) {
    const sa = candidate.indexOf("[");
    const ea = candidate.lastIndexOf("]");
    if (sa !== -1 && ea !== -1)
      return JSON.parse(candidate.slice(sa, ea + 1));
    throw new Error("No JSON found in model output");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}
