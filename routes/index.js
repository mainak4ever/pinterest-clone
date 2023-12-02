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

const upload = require("./multer.js");

/* GET home page. */
router.get("/signup", isNotLoggedIn, function (req, res, next) {
  res.render("signup");
});
router.get("/login", isNotLoggedIn, function (req, res, next) {
  res.render("login", { error: req.flash("error") });
});
router.get("/", async function (req, res, next) {
  const posts = await postModel.find({}).sort({ createdAt: -1 });
  // console.log(posts);
  const isAuth = req.isAuthenticated();
  // console.log(isAuth);
  res.render("feed", { posts, isAuth });
});

router.get("/create", isLoggedIn, function (req, res, next) {
  res.render("create");
});

router.get("/profile", isLoggedIn, async function (req, res, next) {
  const user = await userModel
    .findOne({ username: req.session.passport.user })
    .populate("posts");
  // console.log(user);
  res.render("profile", { user });
});

router.post(
  "/createpost",
  upload.single("image"),
  async function (req, res, next) {
    if (!req.file) return res.send("No file uploaded.");

    const user = await userModel.findOne({
      username: req.session.passport.user,
    });

    const newPost = new postModel({
      title: req.body.title,
      description: req.body.description,
      // Assuming 'image' field contains the uploaded image
      image: {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      },
      link: req.body.link,
      board: req.body.board,
      tags: req.body.tags,
      user: user._id,
    });
    await newPost.save();
    user.posts.push(newPost._id);
    await user.save();
    res.redirect("/profile");
  }
);

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
  res.redirect("/login");
}

function isNotLoggedIn(req, res, next) {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.redirect("/profile");
}

module.exports = router;
