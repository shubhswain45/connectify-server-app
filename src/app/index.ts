import express, { Request, Response } from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser'
import { GraphqlContext } from './interfaces';
import JWTService from './services/JWTService';
import { Auth } from './auth';


export async function initServer() {
    const app = express();

    // CORS configuration
    const corsOptions = {
        origin: ['https://testing-app-fawn.vercel.app'], // your frontend URL
        credentials: true, // Ensure cookies are sent with cross-origin requests
    };

    //llllllllllllll
    // Use CORS middleware
    app.use(cors(corsOptions));
    app.use(bodyParser.json({ limit: "10mb" }))
    app.use(cookieParser())

    const graphqlServer = new ApolloServer<GraphqlContext>({
        typeDefs: `
            ${Auth.types}

            type Query {
                ${Auth.queries}
            }

            type Mutation {
                ${Auth.mutations}
            }
        `,
        resolvers: {
            Query: {
               ...Auth.resolvers.queries
            },

            Mutation: {
                ...Auth.resolvers.mutations,
            },
        },
    });

    await graphqlServer.start();

    // GraphQL Middleware
    app.use(
        '/graphql',
        // @ts-ignore
        expressMiddleware(graphqlServer, {
            context: async ({ req, res }: { req: Request; res: Response }): Promise<GraphqlContext> => {
                let token = req.cookies["__connectify_token"];

                let user = undefined;
                if (token) {
                    user = JWTService.decodeToken(token);
                    console.log("decoded user", user);

                }

                return {
                    user,
                    req,
                    res,
                };
            },
        })
    );


    return app;
}