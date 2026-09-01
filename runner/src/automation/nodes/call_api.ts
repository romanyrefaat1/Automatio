export default async function call_api(
  config: any
) {
  try {
    const method = (
      config.method ?? "GET"
    ).toUpperCase();

    const url = new URL(config.url);

    /*
     * =========================
     * QUERY PARAMETERS
     * =========================
     */

    if (config.query) {
      for (const [key, value] of Object.entries(
        config.query
      )) {
        url.searchParams.set(
          key,
          String(value)
        );
      }
    }

    /*
     * =========================
     * REQUEST OPTIONS
     * =========================
     */

    const headers: Record<string, string> = {
      ...(config.headers ?? {}),
    };

    const options: RequestInit = {
      method,
      headers,
    };

    /*
     * =========================
     * REQUEST BODY
     * =========================
     */

    if (
      config.body !== undefined &&
      method !== "GET" &&
      method !== "HEAD"
    ) {
      options.body =
        typeof config.body === "string"
          ? config.body
          : JSON.stringify(config.body);

      if (!headers["Content-Type"]) {
        headers["Content-Type"] =
          "application/json";
      }
    }

    /*
     * =========================
     * SEND REQUEST
     * =========================
     */

    const response = await fetch(
      url.toString(),
      options
    );

    /*
     * =========================
     * READ RESPONSE
     * =========================
     */

    const contentType =
      response.headers.get("content-type") ?? "";

    let data: unknown;

    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    /*
     * =========================
     * CHECK STATUS
     * =========================
     */

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        status_text: response.statusText,
        data,
      };
    }

    /*
     * =========================
     * SUCCESS
     * =========================
     */

    return {
      success: true,
      status: response.status,
      data,
      save_as: config.save_as,
    };
  } catch (error) {
    return {
      success: false,
      error,
    };
  }
}