const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const transporter = require("../config/mail");

// ============================================
// Register User
// ============================================

const registerUser = async (req, res) => {

    try {

        const { name, email, password } = req.body;

        if (!name || !email || !password) {

            return res.status(400).json({

                message: "All fields are required"

            });

        }

        const userExists = await pool.query(

            "SELECT * FROM users WHERE email = $1",

            [email]

        );

        if (userExists.rows.length > 0) {

            return res.status(400).json({

                message: "User already exists"

            });

        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await pool.query(

            `INSERT INTO users(name,email,password)

             VALUES($1,$2,$3)

             RETURNING id,name,email`,

            [

                name,

                email,

                hashedPassword

            ]

        );

        res.status(201).json({

            message: "Registration Successful",

            user: newUser.rows[0]

        });

    }

    catch (error) {

        console.log(error);

        res.status(500).json({

            message: "Server Error"

        });

    }

};

// ============================================
// Login User
// ============================================

const loginUser = async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {

            return res.status(400).json({

                message: "Email and Password are required"

            });

        }

        const user = await pool.query(

            "SELECT * FROM users WHERE email = $1",

            [email]

        );

        if (user.rows.length === 0) {

            return res.status(400).json({

                message: "Invalid Credentials"

            });

        }

        const validPassword = await bcrypt.compare(

            password,

            user.rows[0].password

        );

        if (!validPassword) {

            return res.status(400).json({

                message: "Invalid Credentials"

            });

        }

        const token = jwt.sign(

            {

                id: user.rows[0].id,

                email: user.rows[0].email

            },

            process.env.JWT_SECRET,

            {

                expiresIn: "1d"

            }

        );

        res.status(200).json({

            message: "Login Successful",

            token

        });

    }

    catch (error) {

        console.log(error);

        res.status(500).json({

            message: "Server Error"

        });

    }

};

// ============================================
// Get Profile
// ============================================

const getProfile = async (req, res) => {

    try {

        const result = await pool.query(

            "SELECT id,name,email FROM users WHERE id=$1",

            [

                req.user.id

            ]

        );

        res.status(200).json(

            result.rows[0]

        );

    }

    catch (error) {

        console.log(error);

        res.status(500).json({

            message: "Server Error"

        });

    }

};

// ============================================
// Update Profile
// ============================================

const updateProfile = async (req, res) => {

    try {

        const { name, email } = req.body;

        if (!name || !email) {

            return res.status(400).json({

                message: "Name and Email are required"

            });

        }

        const result = await pool.query(

            `UPDATE users

             SET

             name=$1,

             email=$2

             WHERE id=$3

             RETURNING id,name,email`,

            [

                name,

                email,

                req.user.id

            ]

        );

        res.status(200).json({

            message: "Profile Updated Successfully",

            user: result.rows[0]

        });

    }

    catch (error) {

        console.log(error);

        res.status(500).json({

            message: "Server Error"

        });

    }

};// ============================================
// Forgot Password
// ============================================

const forgotPassword = async (req, res) => {

    try {

        const { email } = req.body;

        if (!email) {

            return res.status(400).json({

                message: "Email is required"

            });

        }

        const user = await pool.query(

            "SELECT * FROM users WHERE email = $1",

            [email]

        );

        if (user.rows.length === 0) {

            return res.status(404).json({

                message: "User not found"

            });

        }

        // Generate Secure Token

        const resetToken = crypto.randomBytes(32).toString("hex");

        // Token Expiry (10 Minutes)

        const expiry = new Date(

            Date.now() + 10 * 60 * 1000

        );

        await pool.query(

            `UPDATE users

             SET

             reset_token = $1,

             reset_token_expiry = $2

             WHERE email = $3`,

            [

                resetToken,

                expiry,

                email

            ]

        );

        const resetLink =

            `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

        await transporter.sendMail({

            from: process.env.EMAIL_USER,

            to: email,

            subject: "Reset Your Password",

            html: `

                <h2>Password Reset</h2>

                <p>

                We received a request to reset your password.

                </p>

                <p>

                Click the button below to continue.

                </p>

                <a

                    href="${resetLink}"

                    style="
                        display:inline-block;
                        padding:12px 24px;
                        background:#2563eb;
                        color:white;
                        text-decoration:none;
                        border-radius:8px;
                    "

                >

                    Reset Password

                </a>

                <p>

                This link will expire in 10 minutes.

                </p>

            `

        });

        res.status(200).json({

            message:

            "Password reset link sent successfully."

        });

    }

    catch (error) {

        console.log(error);

        res.status(500).json({

            message: "Server Error"

        });

    }

};


// ============================================
// Reset Password
// ============================================

const resetPassword = async (req, res) => {

    try {

        const { token } = req.params;

        const { password } = req.body;

        if (!password) {

            return res.status(400).json({

                message: "Password is required"

            });

        }

        const user = await pool.query(

            `SELECT *

             FROM users

             WHERE reset_token = $1`,

            [

                token

            ]

        );

        if (user.rows.length === 0) {

            return res.status(400).json({

                message: "Invalid reset link"

            });

        }

        if (

            new Date() >

            user.rows[0].reset_token_expiry

        ) {

            return res.status(400).json({

                message: "Reset link has expired"

            });

        }

        const hashedPassword =

            await bcrypt.hash(password, 10);

        await pool.query(

            `UPDATE users

             SET

             password = $1,

             reset_token = NULL,

             reset_token_expiry = NULL

             WHERE id = $2`,

            [

                hashedPassword,

                user.rows[0].id

            ]

        );

        res.status(200).json({

            message:

            "Password reset successfully."

        });

    }

    catch (error) {

        console.log(error);

        res.status(500).json({

            message: "Server Error"

        });

    }

};


// ============================================
// Exports
// ============================================

module.exports = {

    registerUser,

    loginUser,

    getProfile,

    updateProfile,

    forgotPassword,

    resetPassword,

};