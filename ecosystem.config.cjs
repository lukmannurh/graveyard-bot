module.exports = {
  apps : [{
    name: 'graveyard-bot',
    script: 'index.js',
    watch: false,
    ignore_watch : [
      "node_modules",
      "logs",
      ".git"
    ],
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
    exec_mode: 'fork',
    instances: 1,
    exp_backoff_restart_delay: 100,
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000
  }]
};