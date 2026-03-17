const serverless = require('serverless-http')
const { connectDB } = require('./lib/db')
const app = require('./app')

let handler

module.exports = async (req, res) => {
  try {
    // Restore original path: rewrite sends /api/auth/login to /api/index?path=auth/login
    if (typeof req.url === 'string' && req.url.includes('path=')) {
      const [base, qs] = req.url.split('?')
      const params = new URLSearchParams(qs || '')
      const pathSeg = params.get('path') || ''
      params.delete('path')
      const rest = params.toString()
      req.url = '/api/' + pathSeg.replace(/^\/+/, '') + (rest ? '?' + rest : '')
    }
    if (!handler) {
      await connectDB()
      handler = serverless(app)
    }
    return await handler(req, res)
  } catch (err) {
    console.error('API handler error:', err && err.message)
    if (!res.headersSent) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Server error. Check MONGODB_URI and JWT_SECRET env vars.' }))
    }
  }
}
