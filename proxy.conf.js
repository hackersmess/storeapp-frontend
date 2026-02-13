const PROXY_CONFIG = {
  '/api': {
    target: 'http://127.0.0.1:8080',
    secure: false,
    logLevel: 'debug',
    changeOrigin: true,
    pathRewrite: {
      '^/api': '/api',
    },
    bypass: function (req, res, proxyOptions) {
      console.log('[PROXY] Request:', req.method, req.url);
      console.log('[PROXY] Headers:', req.headers);
    },
  },
};

module.exports = PROXY_CONFIG;
