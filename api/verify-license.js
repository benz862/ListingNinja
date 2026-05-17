const GUMROAD_VERIFY_URL = 'https://api.gumroad.com/v2/licenses/verify';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

function sendJson(res, statusCode, payload) {
  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(statusCode).json(payload);
}

function normalizePermalink(value) {
  return String(value || '').trim().replace(/^https?:\/\/(www\.)?gumroad\.com\/l\//i, '').replace(/^\//, '').replace(/\/$/, '');
}

function tierForPermalink(permalink) {
  const normalized = normalizePermalink(permalink);
  const basicPermalink = normalizePermalink(process.env.GUMROAD_BASIC_PERMALINK);
  const proPermalink = normalizePermalink(process.env.GUMROAD_PRO_PERMALINK);

  if (proPermalink && normalized === proPermalink) return 'pro';
  if (basicPermalink && normalized === basicPermalink) return 'basic';
  return null;
}

function gumroadMessage(data, fallback) {
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  if (typeof data?.error === 'string' && data.error.trim()) return data.error;
  return fallback;
}

async function verifyWithGumroad({ licenseKey, productPermalink, accessToken }) {
  const body = new URLSearchParams({
    product_permalink: productPermalink,
    license_key: licenseKey,
    access_token: accessToken
  });

  const response = await fetch(GUMROAD_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  let data = {};
  try {
    data = await response.json();
  } catch (error) {
    throw new Error('Gumroad returned an unreadable response.');
  }

  return { response, data };
}

module.exports = async function handler(req, res) {
  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, {
      valid: false,
      tier: null,
      uses: 0,
      message: 'Use POST with a JSON body containing license_key and product_permalink.'
    });
  }

  const accessToken = process.env.GUMROAD_ACCESS_TOKEN;
  if (!accessToken) {
    return sendJson(res, 500, {
      valid: false,
      tier: null,
      uses: 0,
      message: 'Server is missing GUMROAD_ACCESS_TOKEN.'
    });
  }

  const licenseKey = String(req.body?.license_key || '').trim();
  const requestedPermalink = normalizePermalink(req.body?.product_permalink);

  if (!licenseKey) {
    return sendJson(res, 400, {
      valid: false,
      tier: null,
      uses: 0,
      message: 'License key is required.'
    });
  }

  const allowedPermalinks = [
    normalizePermalink(process.env.GUMROAD_PRO_PERMALINK),
    normalizePermalink(process.env.GUMROAD_BASIC_PERMALINK)
  ].filter(Boolean);

  if (!allowedPermalinks.length) {
    return sendJson(res, 500, {
      valid: false,
      tier: null,
      uses: 0,
      message: 'Server is missing Gumroad product permalink configuration.'
    });
  }

  const permalinksToTry = requestedPermalink
    ? [requestedPermalink]
    : allowedPermalinks;

  if (requestedPermalink && !allowedPermalinks.includes(requestedPermalink)) {
    return sendJson(res, 400, {
      valid: false,
      tier: null,
      uses: 0,
      message: 'Unknown product permalink.'
    });
  }

  let lastFailure = null;

  for (const productPermalink of permalinksToTry) {
    try {
      const { response, data } = await verifyWithGumroad({ licenseKey, productPermalink, accessToken });
      const isValid = Boolean(response.ok && data?.success && data?.purchase);
      const tier = isValid ? tierForPermalink(productPermalink) : null;
      const uses = Number(data?.uses || data?.license?.uses || 0);

      if (isValid) {
        return sendJson(res, 200, {
          valid: true,
          tier,
          uses,
          message: `License activated for ${tier === 'pro' ? 'Pro' : 'Basic'}.`
        });
      }

      lastFailure = gumroadMessage(data, 'License key is invalid for this product.');
    } catch (error) {
      console.error('Gumroad license verification failed:', error);
      lastFailure = 'Unable to reach Gumroad right now. Please try again.';
    }
  }

  return sendJson(res, 200, {
    valid: false,
    tier: null,
    uses: 0,
    message: lastFailure || 'License key could not be verified.'
  });
};
