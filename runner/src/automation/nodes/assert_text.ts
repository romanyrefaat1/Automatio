export default async function assert_text(
  config,
  page,
  variables
) {
  let actualValue: string;

  if (config.selector) {
    // Branch 1: DOM evaluation
    actualValue =
      (await page
        .locator(config.selector)
        .textContent())?.trim() ?? "";
  } else if (config.variable) {
    // Branch 2: Variable evaluation
    if (!variables.has(config.variable)) {
      throw new Error(
        `Variable "${config.variable}" was not found.`
      );
    }

    actualValue = String(
      variables.get(config.variable) ?? ""
    );
  } else {
    throw new Error(
      "Assert step missing both selector and variable."
    );
  }

  // Execution logic
  const matchType = config.match || "exact";

  const expectedValue = String(
    config.expected ?? ""
  );

  const passed =
    matchType === "contains"
      ? actualValue.includes(expectedValue)
      : actualValue === expectedValue;

  if (!passed) {
    throw new Error(
      `Assertion failed: expected '${expectedValue}', got '${actualValue}'`
    );
  }

  if (config.save_as) {
    variables.set(
      config.save_as,
      actualValue
    );
  }

  return {
    success: true,
    data: actualValue,
    save_as: config.save_as,
  };
}