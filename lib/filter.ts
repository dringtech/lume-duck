import { transpose } from "./utils.ts";

/**
 * Lume filter function to
 * @param results Array of DuckDB query results
 * @returns
 */
export function resultTable(results: Record<string, unknown>[]) {
  if (results.length < 1) {
    return `<pre>${
      [
        "+---------------------+",
        "| No results returned |",
        "+---------------------+",
      ].join("\n")
    }</pre>`;
  }

  const columns = Object.keys(results[0]);

  const widths = transpose(
    [columns, ...results].map((r) =>
      Object.values(r).map((x) => x.toString().length)
    ),
  ).map((c) => Math.max(...c));

  const formatter = (row: unknown[]) =>
    `| ${row.map((x, i) => `${x}`.padEnd(widths[i])).join(" | ")} |`;

  const header = formatter(columns);
  const spacer = "+-" + widths.map((s) => "".padEnd(s, "-")).join("-+-") + "-+";
  const data = results.map(Object.values).map(formatter).join("\n");

  console.debug({ columns, widths });

  return `<pre>${
    [
      spacer,
      header,
      spacer,
      data,
      spacer,
    ].join("\n")
  }</pre>`;
}
