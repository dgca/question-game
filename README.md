# Question Game

The question game (QG) is a fun and engaging way to get to know eachother better. The question game selects a player at random (the subject), and gives the rest of the players (the voters) four questions to choose from. Once all players have finished voting or after 15 seconds, the votes are tallied and the subject must answer the most popular question.

## Install locally

**Note: redis, node, and bower required**

```bash
# Install required packages
npm install
cd public
bower install

# Start the server
node server.js

# Site available at http://localhost:1337
```

## Installation on digital ocean node on ubuntu image
```bash
# Install required packages
apt-get install git build-essential nginx tcl8.5

# Clone repo
git clone https://github.com/dgca/question-game.git
cd question-game

# Intall node modules
npm install
npm install bower -g
npm install pm2 -g

# Install bower components
cd public
bower install --allow-root
cd ..

# Start the node server
pm2 start server.js

# Update the Nginx config
vi /etc/nginx/sites-enabled/default
## nginx config:
#server {
#    listen 80;

#    server_name questions.danwolfdev.com;

#    location / {
#        proxy_pass http://127.0.0.1:8080;
#        proxy_http_version 1.1;
#        proxy_set_header Upgrade $http_upgrade;
#        proxy_set_header Connection 'upgrade';
#        proxy_set_header Host $host;
#        proxy_cache_bypass $http_upgrade;
#    }
#}

# Restart Nginx
sudo service nginx restart

# Install redis from source
cd ~
wget http://download.redis.io/releases/redis-stable.tar.gz
tar xzf redis-stable.tar.gz
cd redis-stable
make
make test
make install

# Start redis
cd utils
./install_server.sh
```

