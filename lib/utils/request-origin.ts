import { headers } from "next/headers";

/**
 * Resolve the public origin of the current request.
 *
 * Behind a reverse proxy (e.g. the exe.dev proxy in dev), `request.url`
 * reflects the internal bind address (http://0.0.0.0:PORT), which is not
 * reachable from a browser. Prefer the proxy's forwarded headers, then an
 * explicit env override, then the request URL as a last resort.
 */
export async function resolveRequestOrigin(request: Request): Promise<string> {
  const headerList = await headers();
  const forwardedHost =
    headerList.get("x-forwarded-host") ?? headerList.get("host");
  const forwardedProto = headerList.get("x-forwarded-proto") ?? "https";
  if (forwardedHost && !forwardedHost.startsWith("0.0.0.0")) {
    const host = forwardedHost.split(",")[0].trim();
    const proto = forwardedProto.split(",")[0].trim();
    return `${proto}://${host}`;
  }
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.startsWith("http")
      ? process.env.NEXT_PUBLIC_BASE_URL
      : `https://${process.env.NEXT_PUBLIC_BASE_URL}`;
  }
  return new URL(request.url).origin;
}
