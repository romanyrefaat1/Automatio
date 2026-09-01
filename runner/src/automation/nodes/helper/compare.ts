export default function compare(
  actual: unknown,
  operator: string,
  expected: unknown
): boolean {
  const actualValue = String(actual ?? "");
  const expectedValue = String(expected ?? "");

  switch (operator) {
    case "is":
      return actualValue === expectedValue;

    case "is_not":
      return actualValue !== expectedValue;

    case "contains":
      return actualValue.includes(expectedValue);

    case "not_contains":
      return !actualValue.includes(expectedValue);

    case "starts_with":
      return actualValue.startsWith(expectedValue);

    case "ends_with":
      return actualValue.endsWith(expectedValue);

    default:
      throw new Error(
        `Unknown condition operator: ${operator}`
      );
  }
}