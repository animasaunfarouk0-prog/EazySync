const jwt = require("jsonwebtoken");

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Missing or malformed Authorization header" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, ACCESS_SECRET);

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ error: "Access token expired", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ error: "Invalid access token" });
  }
}

module.exports = authMiddleware;
