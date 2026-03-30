export function unwrapRuntimeResponse<T>(response: T | { error?: string } | null | undefined): T {
  if (
    response &&
    typeof response === "object" &&
    "error" in response &&
    typeof response.error === "string" &&
    response.error.length > 0
  ) {
    throw new Error(response.error);
  }

  return response as T;
}
