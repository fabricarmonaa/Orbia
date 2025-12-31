export function errorHandler(res, error) {
  const status = error.statusCode || (error.name === 'ZodError' ? 400 : 500);
  const payload = {
    ok: false,
    error: {
      code: status,
      message: error.message || 'Internal error',
      issues: error.issues
    }
  };
  console.error(`Status ${status} - ${error.message}`, error);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}
