const INTERNAL_ADMIN_BASE = "/admin";
const INTERNAL_ADMIN_API_BASE = "/api/admin";

// Change this value if you want to rotate the private admin entry path.
export const ADMIN_ROUTE_SEGMENT = "ops-7q9x2m4k";

export const ADMIN_BASE = `/${ADMIN_ROUTE_SEGMENT}`;
export const ADMIN_API_BASE = `/api/${ADMIN_ROUTE_SEGMENT}`;
export const INTERNAL_ADMIN_PATH = INTERNAL_ADMIN_BASE;
export const INTERNAL_ADMIN_API_PATH = INTERNAL_ADMIN_API_BASE;

function withLeadingSlash(path: string) {
  if (!path || path === "/") {
    return "";
  }

  return path.startsWith("/") ? path : `/${path}`;
}

export function adminPath(path = "") {
  return `${ADMIN_BASE}${withLeadingSlash(path)}`;
}

export function adminApiPath(path = "") {
  return `${ADMIN_API_BASE}${withLeadingSlash(path)}`;
}
