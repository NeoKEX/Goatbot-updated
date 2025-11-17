const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Goat Bot V2 - Web Interface</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          padding: 40px;
          max-width: 600px;
          width: 100%;
          text-align: center;
        }
        h1 {
          color: #667eea;
          font-size: 2.5rem;
          margin-bottom: 10px;
        }
        .version {
          color: #764ba2;
          font-size: 1.2rem;
          margin-bottom: 30px;
          font-weight: 600;
        }
        .status {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px 30px;
          border-radius: 50px;
          display: inline-block;
          margin: 20px 0;
          font-weight: bold;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        .info {
          background: #f7f7f7;
          padding: 20px;
          border-radius: 10px;
          margin: 20px 0;
          color: #333;
        }
        .info p {
          margin: 10px 0;
          line-height: 1.6;
        }
        .credits {
          margin-top: 30px;
          padding-top: 30px;
          border-top: 2px solid #e0e0e0;
          color: #666;
          font-size: 0.9rem;
        }
        .credits strong {
          color: #667eea;
          font-size: 1.1rem;
        }
        .icon {
          font-size: 3rem;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">🤖</div>
        <h1>Goat Bot V2</h1>
        <div class="version">v${require('./package.json').version}</div>
        
        <div class="status">
          ✓ Bot is Running
        </div>
        
        <div class="info">
          <p><strong>Platform:</strong> Facebook Messenger</p>
          <p><strong>Status:</strong> Active</p>
          <p><strong>Server:</strong> Online</p>
          <p><strong>Uptime:</strong> ${Math.floor(process.uptime())} seconds</p>
        </div>
        
        <div class="credits">
          <p><strong>Credits</strong></p>
          <p>Created by <strong>NTKhang</strong></p>
          <p>Enhanced by <strong>NeoKEX</strong></p>
        </div>
      </div>
    </body>
    </html>
  `);
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/status', (req, res) => {
  res.json({
    bot: 'Goat Bot V2',
    version: require('./package.json').version,
    status: 'running',
    uptime: Math.floor(process.uptime()),
    platform: 'Facebook Messenger'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🌐 Web interface is running on port ${PORT}`);
  console.log(`📍 Access at: http://0.0.0.0:${PORT}`);
  console.log(`💚 Health check: http://0.0.0.0:${PORT}/health\n`);
});

module.exports = app;
