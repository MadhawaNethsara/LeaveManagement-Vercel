/**
 * Local dev server for the API (MongoDB). Run: npm run dev:api
 * Set MONGODB_URI and JWT_SECRET in .env at project root.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
const { connectDB } = require('./lib/db')
const app = require('./app')

const PORT = process.env.PORT || 8080

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`API (MongoDB) listening on http://localhost:${PORT}`))
  })
  .catch((err) => {
    console.error('DB connect failed:', err.message)
    process.exit(1)
  })
