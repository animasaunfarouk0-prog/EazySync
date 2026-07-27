function errorMiddleware(err, req, res, next) {
  console.error(err.stack);

  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(status).json({ error: message });
}

function notFoundMiddleware(req, res) {
  res
    .status(404)
    .json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

module.exports = { errorMiddleware, notFoundMiddleware };
