import { serve } from 'https://deno.fresh.dev/std@v1.0.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import Stripe from 'https://esm.sh/stripe@13.10.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature || '',
        endpointSecret
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        { status: 400 }
      );
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const songId = session.metadata.songId;

        // Update song status to paid and trigger generation
        const { error: updateError } = await supabase
          .from('songs')
          .update({ 
            paid: true,
            status: 'processing'
          })
          .eq('id', songId);

        if (updateError) {
          throw updateError;
        }

        // Update daily stats
        const amount = session.amount_total ? session.amount_total / 100 : 0;
        const { error: statsError } = await supabase.rpc('increment_daily_earnings', {
          amount_earned: amount
        });

        if (statsError) {
          console.error('Failed to update daily stats:', statsError);
        }

        break;
      }

      case 'payment_intent.payment_failed': {
        const session = event.data.object;
        const songId = session.metadata.songId;

        // Update song status to failed
        const { error: updateError } = await supabase
          .from('songs')
          .update({ status: 'failed' })
          .eq('id', songId);

        if (updateError) {
          throw updateError;
        }

        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
});