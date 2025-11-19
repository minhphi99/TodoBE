export const success = (res, data, message = "OK", status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

export const error = (
  res,
  message,
  errorCode = "ERROR",
  status = 400,
  details = null
) => {
  return res.status(status).json({
    success: false,
    errorCode,
    message,
    details,
  });
};
