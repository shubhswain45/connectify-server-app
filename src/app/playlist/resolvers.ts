import { prismaClient } from "../../clients/db";
import { GraphqlContext } from "../interfaces";
import { v2 as cloudinary } from 'cloudinary';

// Define the Visibility enum
export enum Visibility {
    Public = "Public",
    Private = "Private",
}

// Define the interface for createPlaylistPayload
export interface CreatePlaylistPayload {
    name: string; // Name of the playlist
    coverImageUrl: string; // URL for the cover image
    visibility: Visibility; // Visibility of the playlist (Public or Private)
    tracks: string[]; // Array of track IDs
}

const mutations = {
    createPlaylist: async (
        parent: any,
        { payload }: { payload: CreatePlaylistPayload },
        ctx: GraphqlContext
    ) => {
        try {
            // Ensure the user is authenticated
            if (!ctx.user) throw new Error("Please Login/Signup first!");

            const { name, coverImageUrl, visibility, tracks } = payload;

            // Upload img URL to Cloudinary
            const uploadImageResult = await cloudinary.uploader.upload(coverImageUrl, {
                resource_type: "auto",
            });

            // Create track in the database
            const playlist = await prismaClient.playlist.create({
                data: {
                   name,
                   coverImageUrl: uploadImageResult.secure_url,
                   Visibility: visibility,
                   tracks,
                   authorId: ctx.user.id
                },
            });

            return playlist; // Return the created track
        } catch (error: any) {
            // Handle errors gracefully
            console.error("Error creating playlist:", error);
            throw new Error(error.message || "An error occurred while creating the playlist.");
        }
    },
};

export const resolvers = {mutations}