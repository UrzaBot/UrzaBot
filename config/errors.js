//const { ValidationError } = require("jsonschema");

class AppError extends Error {
  constructor(message, status) {
    super(message);

    this.status = status;

    Error.captureStackTrace(this, this.constructor);
  }
}

const catchAsync = fn => (req, res, next) => {
  fn(req, res, next).catch(next);
};

function custom404(req, res) {
  res.status(404).json({
    message: `${req.method} on ${req.originalUrl} is not a valid request.`,
  });
}

function errorHandling(error, req, res, next) {
  /* //handle ValidationErrors, which are sent as an array
  if (error[0] instanceof ValidationError) {
    const message = error.map(e => e.stack.replace(/"/g, "'"));
    return res.status(400).json({ message });
  }*/
  console.error(error);
  //send verbose errors if they were manually generated
  //or if we're in a development environment
  if (error instanceof AppError || process.env.NODE_ENV !== "production") {
    const { status = 500, message = "Error" } = error;
    return res.status(status).json({ message });
  }

  //send uninformative errors if we're in production
  return res.status(500).json({ message: "Server error" });
}

module.exports = { AppError, catchAsync, custom404, errorHandling };
