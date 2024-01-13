const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };

// evolution of asyncHandler function !!!! below that is written
// const asyncHandler = () => {}
// const asyncHandler = (func) => {() => {}}
// const asyncHandler = (func) => () => {}
// const asyncHandler = (func) => async () => {}

// Second way to handle asyncHandler: !!! below code is there which can replace written at top :
/*
const asyncHandler = (fn) => async (req,res,next) => {
    try {
        await fn(req,res,next);
    } catch (error) {
        res.status(err.code || 500).json({
            success: false,
            message: error.message || "Internal Server Error",
        })
    }
}

*/
