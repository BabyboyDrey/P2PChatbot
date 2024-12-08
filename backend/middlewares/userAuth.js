const asyncErrCatcher = require("./asyncErrCatcher");
const jwt = require("jsonwebtoken");

module.exports = user1Auth = asyncErrCatcher(async (req, res, next) => {
  try {
    const userToken = req.cookies.au_t;
    console.log("userToken:", userToken, req.cookies);
    if (!userToken) {
      return res.status(403).json({
        error: true,
        message: "Forbidden Access",
      });
    }

    const verified_user = jwt.verify(userToken, process.env.JWT_SECRET);

    req.user = verified_user;
    console.log("req.user:", req.user);
    next();
  } catch (err) {
    res.status(500).json({
      error: true,
      message: err.message,
    });
  }
});
