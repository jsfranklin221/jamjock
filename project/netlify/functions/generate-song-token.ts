import { Handler } from '@netlify/functions';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';
const TOKEN_EXPIRY = '24h';

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
    const { songId } = JSON.parse(event.body || '{}');

    if (!songId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing songId' }),
      };
    }

    // Verify song exists and is paid for
    const { data: song, error: songError } = await supabase
      .from('songs')
      .select('paid')
      .eq('id', songId)
      .single();

    if (songError || !song) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Song not found' }),
      };
    }

    if (!song.paid) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Song not paid for' }),
      };
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        songId,
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      },
      JWT_SECRET
    );

    // Generate share URL
    const shareUrl = `${process.env.SITE_URL}/song/${songId}?token=${token}`;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ shareUrl }),
    };
  } catch (error) {
    console.error('Token generation error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to generate token',
      }),
    };
  }
};

export { handler };