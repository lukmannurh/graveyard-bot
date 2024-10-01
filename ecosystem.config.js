module.exports = {
    apps : [{
      name: 'graveyard-bot',
      script: 'index.js',
      watch: true,
      ignore_watch : ["node_modules", "logs"],
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      log_file: 'logs/combined.log',
      time: true,
      max_restarts: 10,
      restart_delay: 5000,
      autorestart: true,
    }]
  };