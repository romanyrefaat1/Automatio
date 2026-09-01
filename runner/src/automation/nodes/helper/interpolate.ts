import type { WorkflowVariables } from "./variables";

export default function interpolate(
  value: unknown,
  variables: WorkflowVariables
): unknown {
  if (typeof value === "string") {
    return value.replace(
      /\{\{\s*([^}]+?)\s*\}\}/g,
      (match, variableName) => {
        if (!variables.has(variableName)) {
          throw new Error(
            `Variable "${variableName}" not found`
          );
        }

        return String(
          variables.get(variableName)
        );
      }
    );
  }

  if (Array.isArray(value)) {
    return value.map((item) =>
      interpolate(item, variables)
    );
  }

  if (
    value !== null &&
    typeof value === "object"
  ) {
    return Object.fromEntries(
      Object.entries(value).map(
        ([key, nestedValue]) => [
          key,
          interpolate(
            nestedValue,
            variables
          ),
        ]
      )
    );
  }

  return value;
}