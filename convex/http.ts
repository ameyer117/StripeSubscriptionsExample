import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { api } from './_generated/api';

const http = httpRouter();

http.route({
    path: '/clerk-webhook',
    method: 'POST',
    handler: httpAction(async (ctx, request) => {
        const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
        if (!webhookSecret) {
            throw new Error('CLERK_WEBHOOK_SECRET is not set');
        }

        const svixId = request.headers.get('svix-id');
        const svixSignature = request.headers.get('svix-signature');
        const svixTimestamp = request.headers.get('svix-timestamp');
        if (!svixId || !svixSignature || !svixTimestamp) {
            return new Response('Missing svix headers: svix-id, svix-signature, svix-timestamp', {
                status: 400,
            });
        }

        const payload = await request.json();
        const body = JSON.stringify(payload);

        const wh = new Webhook(webhookSecret);
        let event: WebhookEvent;

        try {
            event = (await wh.verify(body, {
                'svix-id': svixId,
                'svix-signature': svixSignature,
                'svix-timestamp': svixTimestamp,
            })) as WebhookEvent;
        } catch (e) {
            console.error(e);
            return new Response('Invalid Clerk webhook signature', {
                status: 400,
            });
        }

        // Webhook has been verified
        const eventType = event.type;

        if (eventType === 'user.created') {
            const { id, email_addresses, first_name, last_name } = event.data;
            const email = email_addresses[0].email_address;

            try {
                // TODO: Create a stripe customer as well
                await ctx.runMutation(api.users.createUser, {
                    email,
                    name: `${first_name || ''} ${last_name || ''}`.trim(),
                    clerkId: id,
                });
            } catch (e) {
                console.error('Failed to create user in Convex', e);
                return new Response('Failed to create user in Convex', {
                    status: 500,
                });
            }
        }

        return new Response('Webhook processed successfully', {
            status: 200,
        });
    }),
});

export default http;
