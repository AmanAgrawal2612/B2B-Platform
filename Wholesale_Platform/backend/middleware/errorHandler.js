const errorHandler = (err, req, res, next) => {
  console.error('Global Error Handler caught:', err);
  
  // Sequelize Validation Errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({ 
      error: 'Validation Error', 
      details: err.errors.map(e => e.message)
    });
  }

  // Handle generic JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  // Default server error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ 
    error: err.message || 'Internal Server Error' 
  });
};

module.exports = errorHandler;
