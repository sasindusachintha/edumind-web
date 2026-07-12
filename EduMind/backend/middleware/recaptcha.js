/**
 * Google reCAPTCHA v2 ("I'm not a robot" checkbox) verification middleware.
 *
 * Expects the client to send `captchaToken` (the g-recaptcha-response value)
 * in the request body. Verifies it against Google's siteverify endpoint using
 * RECAPTCHA_SECRET_KEY before allowing the request to continue.
 */
async function verifyRecaptcha(req, res, next) {
  const token = req.body?.captchaToken || req.body?.recaptchaToken;

  if (!token) {
    return res.status(400).json({ success: false, message: 'CAPTCHA verification failed' });
  }

  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    console.error('RECAPTCHA_SECRET_KEY is not set. Refusing to skip CAPTCHA verification.');
    return res.status(500).json({ success: false, message: 'CAPTCHA verification is not configured on the server.' });
  }

  try {
    const params = new URLSearchParams({
      secret,
      response: token,
      ...(req.ip ? { remoteip: req.ip } : {})
    });

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    const result = await response.json();

    if (!result.success) {
      return res.status(400).json({ success: false, message: 'CAPTCHA verification failed' });
    }

    next();
  } catch (err) {
    console.error('reCAPTCHA verification error:', err.message);
    return res.status(500).json({ success: false, message: 'CAPTCHA verification failed' });
  }
}

module.exports = { verifyRecaptcha };
