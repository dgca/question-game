# question-game

The question game (QG) is a fun and engaging way to get to know eachother better. The question game selects a player at random (the subject), and gives the rest of the players (the voters) four questions to choose from. Once all players have finished voting or after 15 seconds, the votes are tallied and the subject must answer the most popular question.

## Installation
apt-get install git build-essential nginx tcl8.5
git clone https://github.com/dgca/question-game.git
cd question-game
npm install bower -g
cd public
bower install --allow-root
npm install pm2 -g
cd ..
pm2 start server.js
vi /etc/nginx/sites-enabled/default
```
# nginx config

server {
    listen 80;

    server_name questions.danwolfdev.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
sudo service nginx restart
cd ~
wget http://download.redis.io/releases/redis-stable.tar.gz
tar xzf redis-stable.tar.gz
cd redis-stable
make
make test
make install
cd utils
./install_server.sh
