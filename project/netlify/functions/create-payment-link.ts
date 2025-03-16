import { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse and validate request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing request body' }),
      };
    }

    let body;
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid JSON body' }),
      };
    }

    const { songId } = body;

    if (!songId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing required parameter: songId' }),
      };
    }

    // Create payment link with fixed price
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'AI-Generated Song',
              description: 'A custom song using your cloned voice',
            },
            unit_amount: 600, // $6.00 in cents
          },
          quantity: 1,
        },
      ],
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${process.env.SITE_URL}/thank-you?songId=${songId}`,
        },
      },
      metadata: {
        songId,
      },
    });

    // Update song with payment link ID
    const { error: updateError } = await supabase
      .from('songs')
      .update({ stripe_payment_link_id: paymentLink.id })
      .eq('id', songId);

    if (updateError) {
      console.error('Error updating song:', updateError);
      throw new Error('Failed to update song with payment link');
    }

    // Track payment attempt
    await supabase.rpc('increment_analytics', {
      metric: 'payment_attempts',
    });

    if (!paymentLink.url) {
      throw new Error('Payment link created but URL is missing');
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ url: paymentLink.url }),
    };
  } catch (error) {
    console.error('Payment link error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to create payment link',
      }),
    };
  }
};

export { handler };