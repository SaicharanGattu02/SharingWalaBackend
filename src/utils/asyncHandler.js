/**
 * Higher-order function to catch asynchronous errors in Express route handlers
 * and forward them to the next() error middleware.
 */
export const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};
