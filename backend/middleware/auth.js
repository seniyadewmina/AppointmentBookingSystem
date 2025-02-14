const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  // Get token from header
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    return res.status(401).json({ 
      error: "Authentication required. No token provided." 
    });
  }

  // Check for Bearer token format
  const [tokenType, token] = authHeader.split(" ");
  if (tokenType !== "Bearer" || !token) {
    return res.status(401).json({ 
      error: "Invalid token format. Use Bearer authentication." 
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"] // Explicitly specify allowed algorithms
    });

    // Attach user to request
    req.user = {
      id: decoded.id,
      role: decoded.role // Add role if using RBAC
    };

    next();
  } catch (error) {
    // Handle specific JWT errors
    let errorMessage = "Invalid token";
    if (error instanceof jwt.TokenExpiredError) {
      errorMessage = "Token expired";
    } else if (error instanceof jwt.JsonWebTokenError) {
      errorMessage = "Invalid token signature";
    }

    // Log error for debugging (remove in production)
    console.error("JWT Verification Error:", error.message);
    
    res.status(401).json({ 
      error: errorMessage,
      ...(process.env.NODE_ENV === "development" && { details: error.message })
    });
  }
};

module.exports = authMiddleware;