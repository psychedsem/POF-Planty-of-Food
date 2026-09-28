function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetry(error) {
  const message = String(error?.message || error);

  if (
    error?.status === 429 ||
    message.includes("rate_limit_exceeded") ||
    message.includes("Too Many Requests")
  ) {
    const seconds = Number(
      message.match(/try again in\s+([\d.]+)s/i)?.[1]
    );

    return {
      delay: Number.isFinite(seconds)
        ? Math.ceil(seconds * 1000) + 500
        : 3000,
      reason: "rate limit",
    };
  }

  if (
    error?.status === 400 &&
    (message.includes("tool_use_failed") ||
      message.includes("Failed to call a function"))
  ) {
    return { delay: 500, reason: "tool call non valida" };
  }

  return null;
}

export async function withGroqRetry(request, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await request();
    } catch (error) {
      const retry = getRetry(error);

      if (!retry || attempt === maxAttempts) {
        throw error;
      }

      console.warn(
        `Groq: ${retry.reason}, nuovo tentativo tra ${Math.ceil(retry.delay / 1000)}s...`
      );

      await wait(retry.delay);
    }
  }
}