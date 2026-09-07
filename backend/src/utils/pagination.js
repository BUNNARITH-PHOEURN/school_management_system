const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return parsed;
}

// Parse page/limit query params into { page, limit, offset }.
function paginate(query = {}) {
  const page = parsePositiveInt(query.page, 1);
  const limit = Math.min(parsePositiveInt(query.limit, DEFAULT_LIMIT), MAX_LIMIT);
  return { page, limit, offset: (page - 1) * limit };
}

// Build a consistent paginated response envelope.
function pageResponse(items, total, { page, limit }) {
  return {
    data: items,
    total,
    page,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}

module.exports = { paginate, pageResponse, DEFAULT_LIMIT, MAX_LIMIT };