const searchParams = new URLSearchParams(window.location.search)

export const debug =
  searchParams.has("debug") &&
  (searchParams.get("debug") === "" || searchParams.get("debug") === "true")
