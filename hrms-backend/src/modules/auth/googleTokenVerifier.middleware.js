const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyGoogleToken(req, res, next) {
  try {
    const { idToken } = req.body;

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    req.googleProfile = {
      googleId: payload.sub,
      email: payload.email,
      firstName: payload.given_name,
      lastName: payload.family_name,
    };

    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid Google ID token" });
  }
}

module.exports = verifyGoogleToken;
