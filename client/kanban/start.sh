#!/bin/sh

# Function to inject configuration into index.html
inject_config() {
    local api_url="${ANGULAR_API_URL:-http://localhost:3000}"
    
    # Create the configuration object
    local config_json="{\"apiUrl\":\"$api_url\",\"production\":true}"
    
    # Find the index.html file
    local index_file="/usr/share/nginx/html/index.html"
    
    if [ -f "$index_file" ]; then
        # Inject config script into the head section
        sed -i "s|<head>|<head><script id=\"app-config\" type=\"application/json\">$config_json</script>|" "$index_file"
        echo "Configuration injected: $config_json"
    else
        echo "Warning: index.html not found"
    fi
}

# Inject configuration
inject_config

# Start nginx
nginx -g "daemon off;" 