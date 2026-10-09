const allowedOrigins = [
    'http://localhost:5173',
    process.env.FRONTEND_URL,
    process.env.RENDER_EXTERNAL_URL
].filter(Boolean).map((origin) => origin.replace(/\/$/, ''))

module.exports = allowedOrigins
