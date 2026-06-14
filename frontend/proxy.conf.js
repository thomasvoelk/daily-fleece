module.exports = {
  '/api': {
    target: `http://localhost:${process.env['BACKEND_PORT'] || '8080'}`,
    secure: false,
  },
};
