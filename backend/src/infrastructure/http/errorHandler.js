export function errorHandler(res, error) {
  const status = error.statusCode || (error.name === 'ZodError' ? 400 : 500);
  const payload = { message: error.message || 'Internal error' };
  if (error.issues) {
    payload.issues = error.issues;
  }
  console.error(`Status ${status} - ${error.message}`, error);
  if (status === 403) console.trace('403 Trace');
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}
