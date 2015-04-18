var everyauth = require('everyauth'),
  connect = require('connect'),
  bodyParser = require('body-parser'),
  cookieParser = require('cookie-parser'),
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
  redisClient = redis.createClient();


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
  .redirectPath('/vote');

app.use(
  header()
);

app.use(
  render({
    root: __dirname + '/templates',
    cache: false, // `false` for debug
    helpers: {
      // sitename: 'connect-render demo site'
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
    res.redirect('/auth/google')
  }
};
app.use('/', requireGoogleAuth);
app.use('/create', requireGoogleAuth);
app.use('/admin', requireGoogleAuth);
app.use('/vote', requireGoogleAuth);

var server = app.use(
  connectRoute(function (app) {
    app.get('/', function (req) {
      req.redirect('/vote');
    })
    app.get('/vote', function (req, res) {
      res.render('pages/vote.html', {
        name: req.session.auth.google.user.name,
        img: req.session.auth.google.user.picture
      });
    });
    app.get('/create', function (req, res) {
      res.render('pages/create.html');
    });
    app.post('/create', function (req, res) {
      // process create question here
      res.redirect('/create');
    });
    app.get('/admin', function (req, res) {
      res.end('admin');
    });
    app.get('/user', function (req, res) {
      res.setHeader('Content-Type', 'application/json');
      return res.end(
        JSON.stringify(users[Math.floor(Math.random()*users.length)].user)
      );
    })
  })
).listen(1337, function () {
  console.log('Running at http://localhost:1337');
});

///////////////////
// SOCKET SERVER //
io = io.listen(server);


redisClient.on('error', function (err) {
  console.error('redis error', err)
});
// redisClient.sadd('somdsetwithobj1', JSON.stringify({
//   question: 'ok',
//   another: 'yes'
// }));
// redisClient.srandmember('somdsetwithobj1', function (err, results) {
//   console.log(JSON.parse(results).question);
// });

io.on('connection', function (socket) {
  socket.on('users', function (user) {
    users.push({
      socket: socket,
      user: user
    });
  });
  socket.on('disconnect', function() {
    var i;
    for (i = 0; i < users.length; i++) {
      if (users[i].socket === socket) {
        delete users[i];
      }
    }
  });
});

//////////////////////