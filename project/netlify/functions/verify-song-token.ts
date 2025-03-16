import { Handler } from '@netlify/functions';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';

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
    const { token, songId } = JSON.parse(event.body || '{}');

    if (!token || !songId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing token or songId' }),
      };
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET) as { songId: string };

      // Verify token matches songId
      if (decoded.songId !== songId) {
        throw new Error('Invalid token');
      }

      // Verify song exists and is paid for
      const { data: song, error: songError } = await supabase
        .from('songs')
        .select('*')
        .eq('id', songId)
        .single();

      if (songError || !song) {
        throw new Error('Song not found');
      }

      if (!song.paid) {
        throw new Error('Song not paid for');
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ valid: true, song }),
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Token expired' }),
        };
      }

      throw error;
    }
  } catch (error) {
    console.error('Token verification error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to verify token',
      }),
    };
  }
};

export { handler };