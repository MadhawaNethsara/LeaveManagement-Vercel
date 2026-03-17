const serverless = require('serverless-http')
const { connectDB } = require('./lib/db')
const app = require('./app')

let handler

module.exports = async (req, res) => {
  // Restore original path: rewrite sends /api/auth/login?foo=1 to /api/index?path=auth/login&foo=1
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
  return handler(req, res)
}
