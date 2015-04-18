var everyauth = require('everyauth'),
  connect = require('connect'),
  bodyParser = require('body-parser'),
  cookieParser = require('cookie-parser'),
  flash = require('connect-flash'),
  session = require('express-session'),
  connectRoute = require('connect-route'),
  redirect = require('connect-redirection'),
  serveStatic = require('serve-static'),
  header = require('connect-header'),
  render = require('connect-render'),
  ejs = require('ejs'),
  app = connect(),
  io = require('socket.io'),
  redis = require('redis'),
  users = [],
  redisClient = redis.createClient(6379, '10.0.32.209'),
  moment = require('moment');

everyauth.google
  .appId('494665940570-7329c04lpf6vh98q179c0l9sg9d929jg.apps.googleusercontent.com')
  .appSecret('9luP8aFH0eVsw-Hjb9tk85Fi')
  .scope('https://www.googleapis.com/auth/plus.login') // What you want access to
  .handleAuthCallbackError( function (req, res) {
    res.end("Now why you wanna go and do that, and do that?");
  })
  .findOrCreateUser( function (session, accessToken, accessTokenExtra, googleUserMetadata) {
    return {
      name: googleUserMetadata.name,
      img: googleUserMetadata.picture
    };
  })
  .redirectPath('/redirect_uri');

app.use(
  header()
);

app.use(
  render({
    root: __dirname + '/templates',
    cache: false, // `false` for debug
    helpers: {
    }
  })
);

app.use(
  bodyParser.urlencoded({ extended: false })
);

app.use(
  bodyParser.json()
);

app.use(
  cookieParser()
);

app.use(
  session({
    secret: 'whoduasdasdfasoiuoiuosiuoinnit',
    saveUninitialized: false,
    resave: false
  })
);

app.use(
  flash()
);

app.use(
  everyauth.middleware()
);

app.use(
  redirect()
);

app.use(serveStatic('public', {}));


// securitah!
var requireGoogleAuth = function(req, res, next) {
  if (req.session && req.session.auth && req.session.auth.google && req.session.auth.google.user && req.session.auth.google.user.name) {
    next();
  } else {
    req.flash('redirect_uri', req.url);
    res.redirect('/auth/google')
  }
};
app.use('/', requireGoogleAuth);
app.use('/create', requireGoogleAuth);
app.use('/admin', requireGoogleAuth);
app.use('/vote', requireGoogleAuth);

var server = app.use(
  connectRoute(function (app) {
    app.get('/', function (req, res) {
      res.redirect('/vote');
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
        img: req.session.auth.google.user.picture
      });
    });
    app.get('/questions', function (req, res) {
      redisClient.smembers('questions-app:questions', function (err, results) {
        console.log(results);
        res.render('pages/questions.html', {
          moment: moment,
          questions: results,
          name: req.session.auth.google.user.name,
          img: req.session.auth.google.user.picture
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
          voters: []
        };
        if (redisClient.sadd('questions-app:questions', JSON.stringify(inData))) {
          req.flash('success', 'Question saved successfully.')
          return res.redirect('/questions');
        }
      }

      req.flash('danger', 'Could not save your question. Please try again.');
      res.redirect('/create');
    });
    app.get('/admin', function (req, res) {
      res.render('pages/admin.html', {
        name: req.session.auth.google.user.name,
        img: req.session.auth.google.user.picture
      });
    });
  })
).listen(1337, function () {
  console.log('Running at http://localhost:1337.');
});

///////////////////
// SOCKET SERVER //
io = io.listen(server);


redisClient.on('error', function (err) {
  console.error('redis error', err)
});

io.on('connection', function (socket) {
  socket.on('users', function (user) {
    users.push({
      socket: socket,
      user: user
    });
  });
  socket.on('new_user', function () {
      var user = users[Math.floor(Math.random()*users.length)];
      if (user && user.user) {
        socket.emit('new_user_done', user.user);
        var questions = [];
        redisClient.srandmember('questions-app:questions', 4, function (err, result) {
          console.log('hi');
          socket.emit('new_questions_done', result);
        });
      }
  });
  socket.on('disconnect', function() {
    var i;
    for (i = 0; i < users.length; i++) {
      if (users[i] && users[i].socket === socket) {
        delete users[i];
      }
    }
  });
});

//////////////////////