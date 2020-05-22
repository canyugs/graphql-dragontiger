const assign = require('lodash/assign');
const defaults = require('lodash/defaults');
const { JSONWebSignature: JWS, base16 } = require('jw25519');

const { SIGNATURE_SECRET_KEY } = process.env;

function SignatureServer(secretKey = SIGNATURE_SECRET_KEY, expire = 60 * 60) {
  this.cryptor = new JWS(base16.decode(secretKey));
  this.expire = expire;
}

SignatureServer.prototype = {
  generateUrl(payload) {
    const { cryptor, expire } = this;
    return cryptor.sign({
      exp: Math.floor(Date.now() / 1000 / expire) * expire + (expire * 2),
      iat: undefined,
      sub: 'request-token',
      ...payload,
    });
  },
  generateBody(payload) {
    return this.cryptor.sign({
      sub: 'request-token',
      ...payload,
    });
  },
  verify(ciphertext, sub) {
    return this.cryptor.verify(ciphertext, { sub });
  },
  express(option) {
    const { field, sub } = defaults(option, { field: 'ciphertext', sub: 'request-token' });
    return (req, res, next) => {
      try {
        const { url, params, body = {} } = req;
        const ciphertext = params[field] || body[field] || url.substring(url.lastIndexOf('/') + 1);
        const payload = this.cryptor.verify(ciphertext, { sub });
        assign(req.params, payload);
        assign(req.body, payload);
        next();
      } catch (e) {
        res.status(400).send('invalid signature');
      }
    };
  },
};

module.exports = SignatureServer;
