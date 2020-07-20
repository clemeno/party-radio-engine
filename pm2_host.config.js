module.exports = {
  apps: [
    {
      name: 'p-r-e',
      script: 'server.js',
      args: '',
      watch: false,
      // watch: true,
      env: {
        NODE_ENV: 'development',
        SERVER_LISTEN_PORT: 43210,
        SERVER_LISTEN_ORIGIN: '::'
      },
      env_production: {
        NODE_ENV: 'production',
        SERVER_LISTEN_PORT: 43210,
        SERVER_LISTEN_ORIGIN: '::'
      },
      watch_delay: 1000,
      exp_backoff_restart_delay: 100,
      max_memory_restart: '500M'
    }
  ]
}
