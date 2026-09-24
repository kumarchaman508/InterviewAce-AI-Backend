const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    try {

        const authHeader = req.headers.authorization;

        console.log("Header:", authHeader);

        if (!authHeader) {
            return res.status(401).json({
                message: "Access Denied. No Token."
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        console.log("Decoded:", decoded);

        req.user = decoded;

        next();

    } catch (error) {

        console.log("JWT ERROR:", error);

        return res.status(401).json({
            message: "Invalid Token"
        });

    }
};

module.exports = authMiddleware;