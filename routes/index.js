var express = require("express");
var router = express.Router();
const userModel = require("./users");
const postModel = require("./posts.js");
const { default: mongoose } = require("mongoose");
const passport = require("passport");

const localStrategy = require("passport-local");
passport.use(new localStrategy(userModel.authenticate()));

// to use email for login instead of username.
// passport.use(new localStrategy({ usernameField: 'email' }, userModel.authenticate()));

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});
router.get("/login", function (req, res, next) {
  res.render("login", { title: "Login", error: req.flash("error") });
});
router.get("/feed", function (req, res, next) {
  res.render("feed", { title: "Feed" });
});

router.get("/create", function (req, res, next) {
  res.render("create");
});

router.get("/profile", isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  console.log(user);
  res.render("profile", { title: "profile", user });
});

router.post("/register", function (req, res, next) {
  const { username, email, fullname } = req.body;
  const userData = new userModel({ username, email, fullname });

  userModel.register(userData, req.body.password).then(function () {
    passport.authenticate("local")(req, res, function () {
      res.redirect("/profile");
    });
  });
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/login",
    failureFlash: true,
  }),
  function (req, res, next) {}
);

// router.post(
//   "/login",
//   passport.authenticate("local", {
//     failureRedirect: "/login",
//     failureMessage: true,
//   }),
//   function (req, res) {
//     res.redirect("/profile");
//   }
// );

router.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}

module.exports = router;
