import { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const handler: Handler = async (event) => {
  try {
    const signature = event.headers['stripe-signature'];
    
    if (!signature || !event.body) {
      console.error('Missing signature or body');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing signature or body' })
      };
    }

    // Verify webhook signature
    let stripeEvent;
    try {
      stripeEvent = stripe.webhooks.constructEvent(
        event.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid signature' })
      };
    }

    console.log('Processing webhook event:', stripeEvent.type);

    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object;
        const clientReferenceId = session.client_reference_id;
        const customerId = session.customer;

        if (!clientReferenceId) {
          throw new Error('Missing client_reference_id');
        }

        console.log('Processing successful payment for song:', clientReferenceId);

        // Get user ID from customer if available
        let userId = null;
        if (customerId) {
          const { data: customerData } = await stripe.customers.retrieve(customerId as string);
          if ('metadata' in customerData && customerData.metadata?.user_id) {
            userId = customerData.metadata.user_id;
          }
        }

        // Update song status and user_id
        const { error: updateError } = await supabase
          .from('songs')
          .update({ 
            paid: true,
            status: 'processing',
            webhook_processed: true,
            stripe_session_id: session.id,
            user_id: userId
          })
          .eq('id', clientReferenceId);

        if (updateError) {
          console.error('Error updating song:', updateError);
          throw updateError;
        }

        // Track payment success
        await supabase.rpc('increment_analytics', {
          metric: 'payment_success'
        });

        break;
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };

  } catch (error) {
    console.error('Webhook error:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown webhook error',
      }),
    };
  }
};

export { handler };