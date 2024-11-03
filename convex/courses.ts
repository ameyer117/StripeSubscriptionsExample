import { v } from 'convex/values';
import { query } from './_generated/server';

export const getCourses = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query('courses').collect();
    },
});

export const getCourseById = query({
    args: {
        id: v.id('courses'),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});
