export default async function loop(config: any) {
  try {
    if (
      config.max_iterations !== undefined &&
      config.max_iterations < 1
    ) {
      throw new Error(
        "loop.max_iterations must be greater than 0"
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