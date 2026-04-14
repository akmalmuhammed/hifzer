export function resolveAuditNowFromRequestHeader(
  request: Request,
  headerName = "x-hifzer-test-now",
): Date | undefined {
  if (process.env.HIFZER_ALLOW_TEST_TIME_TRAVEL !== "1") {
    return undefined;
  }

  const raw = request.headers.get(headerName)?.trim();
  if (!raw) {
    return undefined;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed;
}
