export default async function loop(config: any) {
  try {
    if (
      config.max_iterations !== undefined &&
      (!Number.isInteger(config.max_iterations) ||
        config.max_iterations < 1)
    ) {
      throw new Error(
        "loop.max_iterations must be a positive integer"
      );
    }

    if (!config.condition) {
      throw new Error(
        "loop.condition is required"
      );
    }

    if (
      !config.condition.source ||
      !config.condition.operator
    ) {
      throw new Error(
        "loop.condition must have a source and operator"
      );
    }

    if (
      config.condition.value_mode === "variable" &&
      !String(config.condition.value ?? "").trim()
    ) {
      throw new Error(
        "loop.condition variable name is required"
      );
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error,
    };
  }
}