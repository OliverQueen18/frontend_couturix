module.exports = {
  '/api': {
    target: 'http://127.0.0.1:8081',
    secure: false,
    changeOrigin: true,
    headers: {
      origin: 'http://localhost:8081'
    }
  },
  '/v3': {
    target: 'http://127.0.0.1:8081',
    secure: false,
    changeOrigin: true,
    headers: {
      origin: 'http://localhost:8081'
    }
  },
  '/swagger-ui': {
    target: 'http://127.0.0.1:8081',
    secure: false,
    changeOrigin: true,
    headers: {
      origin: 'http://localhost:8081'
    }
  }
};
