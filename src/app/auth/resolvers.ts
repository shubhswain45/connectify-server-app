import { prismaClient } from "../../clients/db";
import bcrypt from 'bcryptjs'
import { GraphqlContext } from "../interfaces";
import JWTService from "../services/JWTService";
import NodeMailerService from "../services/NodeMailerService";

interface SignupUserPayload {
    username: string; // Required field
    fullName: string; // Required field
    email: string;    // Required field
    password: string; // Required field
}

const mutations = {
    signupUser: async (parent: any, { payload }: { payload: SignupUserPayload }, ctx: GraphqlContext) => {
        try {
            const { username, fullName, email, password } = payload;

            // Check if username or email already exists
            const existingUser = await prismaClient.user.findFirst({
                where: {
                    OR: [
                        { username },
                        { email },
                    ],
                },
            });

            // Separate the error message based on the conflict
            if (existingUser) {
                if (existingUser.username === username) {
                    throw new Error('Username is already in use');
                }
                if (existingUser.email === email) {
                    throw new Error('Email is already in use');
                }
            }

            // Hash the password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

            // Set the verification token expiration to 24 hours from now
            const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

            // Create the new user
            const newUser = await prismaClient.user.create({
                data: {
                    email,
                    username,
                    fullName,
                    password: hashedPassword,
                    verificationToken,
                    verificationTokenExpiresAt,
                    isVerified: false,
                },
            });


            const userToken = JWTService.generateTokenForUser({ id: newUser.id, username: newUser.username });

            // Set the JWT token in the cookie
            ctx.res.cookie('__connectify_token', userToken, {
                httpOnly: true, // Prevents JavaScript from accessing the cookie, enhancing security
                secure: true,  // Should be true in production to ensure cookies are sent over HTTPS only
                maxAge: 1000 * 60 * 60 * 24, // 1 day expiry time
                sameSite: 'none', // 'lax' is suitable for local development; use 'none' with HTTPS in production
                path: '/', // The cookie is available to the entire site
            });

            await NodeMailerService.sendVerificationEmail(newUser.email, verificationToken)

            return newUser;

        } catch (error: any) {
            console.log("Error while signupUser:", error.message);
            throw new Error(error.message || 'An unexpected error occurred');
        }
    },
};

export const resolvers = { mutations }
