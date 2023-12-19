var express = require('express');
var router = express.Router();

const passport = require('passport');
const LdapStrategy = require('passport-ldapauth');

var dn = "ou=people,dc=technikum-wien,dc=at"

/*
router.post('/login', passport.myLogin)

function ensureAuthenticated(req, res, next) {
  if (!req.user) {
    res.status(401).json({ success: false, message: "not logged in" })
  } else {
    next()
  }
}

router.get("/api/user", ensureAuthenticated, function (req, res) {
  res.json({success: true, user:req.user})
})

var getLDAPConfiguration = function (req, callback) {
  process.nextTick(function () {
    var opts = {
      server: {
        url: ldapurl,
        bindDn: `uid=${req.body.username},${dn}`,
        bindCredentials: `${req.body.password}`,
        searchBase: dn,
        searchFilter: `uid=${req.body.username}`,
        reconnect: true
      }
    };
    callback(null, opts);
  });
};

passport.use(new LdapStrategy(getLDAPConfiguration,
  function (user, done) {
    winston.info("LDAP user ", user.displayName, "is logged in.")
    return done(null, user);
  }))


  passport.serializeUser(function (user, done) {
    done(null, user.uid)
  })
  passport.deserializeUser(function (id, done) {
    User.findOne({ uid: id }).exec()
      .then(user => {
        if (!user) {
          done(new Error(`Cannot find user with uid=${id}`))
        } else {
          done(null, user)
        }
      })
  })

  passport.myLogin = function (req, res, next) {
    passport.authenticate('ldapauth', function (err, user, info) {
      if (err) {
        return next(err)
      }
      if (!user) {
        res.status(401).json({ success: false, message: 'authentication failed' })
      } else {
        req.login(user, loginErr => {
          if (loginErr) {
            return next(loginErr);
          }
          User.findOneAndUpdate({uid: user.uid}, user, {upsert: true, new: true}).exec().then(user=> {
            return res.json({ success: true, message: 'authentication succeeded', user: Object.assign({name: user.uid}, user) });
          })
        });
      }
    })(req, res, next)
  }

/*
//post credentials
// Route for handling login
router.post('/Login', passport.authenticate('ldapauth', { session: false }), (req, res) => {
  // Authentication successful, handle the response
  res.json({ success: true, user: req.user });
});
//router.post('/Login', passport.myLogin)
// check if user is already authenticated
function ensureAuthenticated(req, res, next) {
  if (!req.user) {
    res.status(401).json({ success: false, message: "not logged in" })
  } else {
    next()
  }
};
//needed?
router.get("/api/user", ensureAuthenticated, function (req, res) {
    res.json({success: true, user:req.user})
  })

var getLDAPConfiguration = function (req, callback) {
  process.nextTick(function () {
    var opts = {
      server: {
        url: `ldaps://ldap.technikum-wien.at`,
        bindDn: `uid=${req.body.username},${dn}`,
        bindCredentials: `${req.body.password}`,
        searchBase: dn,
        searchFilter: `uid=${req.body.username}`,
        reconnect: true
      }
    };
    console.log("User:", req.body.username);
    callback(null, opts);
  });
};

passport.use(new LdapStrategy({
  server: {
    url: `ldaps://ldap.technikum-wien.at`,
    bindDn: `uid=${req.body.username},${dn}`,
    bindCredentials: `${req.body.password}`,
    searchBase: dn,
    searchFilter: `uid=${req.body.username}`,
    reconnect: true
  }
}));

passport.use(new LdapStrategy(getLDAPConfiguration,
  function (user, done) {
    console.log("LDAP user ", username, "is logged in.");
    return done(null, user);
  }))

  passport.serializeUser(function (user, done) {
    done(null, user.uid)
  })
  passport.deserializeUser(function (id, done) {
    User.findOne({ uid: id }).exec()
      .then(user => {
        if (!user) {
          done(new Error(`Cannot find user with uid=${id}`))
        } else {
          done(null, user)
        }
      })
  })
*/
  module.exports = router;