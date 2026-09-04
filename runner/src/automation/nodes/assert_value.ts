export default async function assert_value(page, config, variables) {
  let actualValue: string;

  if (config.selector) {
    // Branch 1: DOM Evaluation
    actualValue = await page.locator(config.selector).inputValue() || "";
  } else if (config.variable) {
    // Branch 2: Variable Evaluation
    actualValue = variables[config.variable] || "";
  } else {
    throw new Error("Assert step missing both selector and variable.");
  }

  // Execution logic
  const matchType = config.match || "exact";
  const passed = matchType === "contains" 
    ? actualValue.includes(config.expected) 
    : actualValue === config.expected;

  if (!passed) {
    throw new Error(`Assertion failed: expected '${config.expected}', got '${actualValue}'`);
  }

  if (config.save_as) {
    variables[config.save_as] = actualValue;
  }
}