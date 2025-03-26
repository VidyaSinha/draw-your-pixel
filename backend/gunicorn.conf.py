import multiprocessing

# Worker Settings
worker_class = 'eventlet'
workers = 1
threads = 1

# Timeout Settings
timeout = 300
keepalive = 120

# Server Settings
bind = '0.0.0.0:5000'
max_requests = 1000
max_requests_jitter = 50

# Logging
loglevel = 'info'
accesslog = '-'
errorlog = '-'

# Process Naming
proc_name = 'air-canvas'

# SSL Settings (if needed)
# keyfile = 'path/to/keyfile'
# certfile = 'path/to/certfile'

# Worker Processes
preload_app = True
reload = False