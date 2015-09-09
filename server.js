// Init
var bodyParser = require('body-parser'),
  cookieParser = require('cookie-parser'),
  everyauth = require('everyauth'),
  flash = require('connect-flash'),
  session = require('express-session'),
  redisSessionStore = require('connect-redis')(session),
  connectRoute = require('connect-route'),
  redirect = require('connect-redirection'),
  serveStatic = require('serve-static'),
  header = require('connect-header'),
  render = require('connect-render'),
  ejs = require('ejs'),
  app = require('connect')(),
  io = require('socket.io'),
  redis = require('redis'),
  users = [],
  userPool = [],
  votables = [],
  redisClient = redis.createClient(6379, '127.0.0.1'),
  moment = require('moment'),
  baseUrl = 'http://questions.danwolfdev.com',
  log4js = require('log4js'),
  uuid = require('node-uuid');

// Redis error handling
redisClient.on('error', function (err) {
  console.error('redis error', err)
  logger.error('REDIS CONNECT ERROR');
});

// Logging Set up
log4js.loadAppender('file');
log4js.addAppender(log4js.appenders.file('logs/app.log'), 'app');

var logger = log4js.getLogger('app');
logger.setLevel('INFO');

logger.info('SCRIPT STARTED');

// Google auth setup
everyauth
  .google
  .appId('494665940570-7329c04lpf6vh98q179c0l9sg9d929jg.apps.googleusercontent.com')
  .appSecret('9luP8aFH0eVsw-Hjb9tk85Fi')
  .scope('profile') // What you want access to
  .handleAuthCallbackError( function (req, res) {
    res.setHeader("Content-type", "text/html");
    res.end("<img style='display:block;margin:0 auto;' src='/assets/qtip.jpg'><p style='text-align:center;'>Now why you wanna go and do that, love, huh?</p>");
  })
  .findOrCreateUser( function (session, accessToken, accessTokenExtra, googleUserMetadata) {
    if (!googleUserMetadata || !googleUserMetadata.name || !googleUserMetadata.picture) {
      logger.error('LOGIN ERROR: googleUserMeta invalid', googleUserMetadata);
    }
    logger.info('LOGIN COMPLETE', {
      session: session,
      accessToken: accessToken,
      accessTokenExtra: accessTokenExtra,
      googleUserMetadata: googleUserMetadata
    });
    var userData = {
      name: googleUserMetadata.name,
      img: googleUserMetadata.picture + '?sz=500'
    };
    logger.info('SESSION USER DATA', userData);
    return userData;
  })
  .redirectPath('/redirect_uri');

app
  .use(header())
  .use(bodyParser.urlencoded({ extended: false }))
  .use(bodyParser.json())
  .use(cookieParser())
  .use(flash())
  .use(
    session({
      store: new redisSessionStore({
        prefix: 'qg:sess:'
      }),
      secret: 'as98d7f6as98d7f68dgasd76ga9s8d76asdf',
      saveUninitialized: false,
      resave: false
    })
  )
  .use(everyauth.middleware())
  .use(redirect())
  .use(serveStatic('public', {}))
  .use(
    render({
      root: __dirname + '/templates',
      cache: false
    })
  );


// securitah!
var requireGoogleAuth = function(req, res, next) {
  if (req.session && req.session.auth && req.session.auth.google && req.session.auth.google.user && req.session.auth.google.user.name) {
    next();
  } else {
    logger.info('LOGIN REQUIRED', req.session);

    req.flash('redirect_uri', req.url);
    res.redirect('/auth/google')
  }
};
app
  .use('/', requireGoogleAuth)
  .use('/create', requireGoogleAuth)
  .use('/admin', requireGoogleAuth)
  .use('/vote', requireGoogleAuth);

var server = app.use(
  connectRoute(function (app) {
    // Setup routes
    app.get('/', function (req, res) {
      res.render('pages/index.html');
    });
    app.get('/redirect_uri', function (req, res) {
      var uriArray = req.flash('redirect_uri');
      if (uriArray.length) {
        res.redirect(uriArray[0]);
      } else {
        res.redirect('/vote');
      }
    });
    app.get('/vote', function (req, res) {
      res.render('pages/vote.html', {
        name: req.session.auth.google.user.name,
        img: req.session.auth.google.user.picture,
        reqUrl: req.url
      });
    });
    app.get('/questions', function (req, res) {
      redisClient.smembers('questions-app:questions', function (err, results) {
        res.render('pages/questions.html', {
          moment: moment,
          questions: results,
          name: req.session.auth.google.user.name,
          img: req.session.auth.google.user.picture + '?sz=900'
        });
      });
    });
    app.get('/create', function (req, res) {
      res.render('pages/create.html', {
        successFlash: req.flash('success'),
        dangerFlash: req.flash('danger')
      });
    });
    app.post('/create', function (req, res) {
      if (req.body.question) {
        var inData = {
          name: req.session.auth.google.user.name,
          img: req.session.auth.google.user.picture,
          question: req.body.question,
          created: (new Date).getTime(),
          uuid: uuid.v4(),
          voters: []
        };
        if (redisClient.sadd('questions-app:questions', JSON.stringify(inData))) {
          req.flash('success', 'Question saved successfully.')
          return res.redirect('/questions');
        }
      }

      req.flash('danger', 'Sorry, you can&#39;t submit an empty question. Please try again.');
      res.redirect('/create');
    });
    app.get('/admin', function (req, res) {
      res.render('pages/admin.html', {
        name: req.session.auth.google.user.name,
        img: req.session.auth.google.user.picture,
        url: baseUrl,
        reqUrl: req.url
      });
    });
  })
).listen(1337, function () {
  logger.info('SERVER RUNNING: http://localhost:1337');
});

// Start socket server
io = io.listen(server);

io.on('connection', function (socket) {
  socket.on('add_user', function (user) {
    var tempUsers = [],
      tempUserPool = [],
      i;

    user.uuid = uuid.v4();
    users.push({
      socket: socket,
      user: user
    });
    userPool.push({
      socket: socket,
      user: user
    });

    for (i = 0;i < users.length; i++) {
      if (users[i] && users[i].user) {
        tempUsers.push(users[i].user);
      }
    }

    for (i = 0;i < userPool.length; i++) {
      if (userPool[i] && userPool[i].user) {
        tempUserPool.push(userPool[i].user);
      }
    }
    io.emit('user_list_updated', {
      users: tempUsers,
      userPool: tempUserPool
    });
  });
  socket.on('next_player', function () {
    var user,
      votables = [],
      randomIndex,
      i = 0;
    logger.info('NEXT PLAYER CALLED');

    logger.info('USER POOL', {
      userPoolLength: userPool.length,
      userPool: userPool
    });

    // clean up userPool
    for (i = userPool.length - 1; i > -1; i--) {
      if (!userPool[i]) {
        delete userPool[i];
      }
    }

    if (!userPool.length) {
      logger.info('USER POOL EMPTY');
      logger.info('users', users);
      userPool = users.slice(0);
    }

    var count = 100;
    while (!user && --count) {
      randomIndex = Math.floor(Math.random()*userPool.length-1);
      user = userPool.splice(randomIndex, 1)[0];
    }

    // clean up userPool
    for (i = userPool.length - 1; i > -1; i--) {
      if (!userPool[i]) {
        delete userPool[i];
      }
    }

    logger.info('USER REMOVED FROM POOL', userPool);
    logger.info('NEW PERSON CHOSEN', user.user);

    var tempUsers = [],
      tempUserPool = [],
      i;

    for (i = 0;i < users.length; i++) {
      if (users[i] && users[i].user) {
        tempUsers.push(users[i].user);
      }
    }
    for (i = 0;i < userPool.length; i++) {
      if (userPool[i] && userPool[i].user) {
        tempUserPool.push(userPool[i].user);
      }
    }

    io.emit('user_list_updated', {
      users: tempUsers,
      userPool: tempUserPool
    });

    io.emit('next_player_chosen', user.user);

    // generate questions
    redisClient.srandmember('questions-app:questions', 4, function (err, result) {
      logger.info('NEW QUESTIONS', result);
      var i;
      for (i = 0; i < result.length; i++) {
        result[i] = JSON.parse(result[i]);
        result[i].votes = 0;
      }
      io.emit('new_questions_done', result);
      io.emit('voting_results_updated', result);
      votables = result;
    });
  });
  socket.on('disconnect', function() {
    var tempUsers = [],
      tempUserPool = [],
      i;

    for (i = 0; i < users.length; i++) {
      if (users[i] && users[i].socket === socket) {
        delete users[i];
      }
    }
    for (i = 0; i < userPool.length; i++) {
      if (userPool[i] && userPool[i].socket === socket) {
        delete userPool[i];
      }
    }
    for (i = 0;i < users.length; i++) {
      if (users[i] && users[i].user) {
        tempUsers.push(users[i].user);
      }
    }
    for (i = 0;i < userPool.length; i++) {
      if (userPool[i] && userPool[i].user) {
        tempUserPool.push(userPool[i].user);
      }
    }
    io.emit('user_list_updated', {
      users: tempUsers,
      userPool: tempUserPool
    });
  });
  socket.on('add_vote', function (data) {
    var found = false;
    for (var i = votables.length - 1; i >= 0; i--) {
      if (data.question === votables[i].question) {
        found = true;
        votables[i].votes++;
      }
    };
    io.emit('voting_results_updated', votables);
  });
  socket.on('del_vote', function (data) {
    for (var i = votables.length - 1; i >= 0; i--) {
      if (data.question === votables[i].question) {
        votables[i].votes--;
      }
    };
    io.emit('voting_results_updated', votables);
  });
});