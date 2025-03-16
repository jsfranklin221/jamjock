# JamJock

Transform your voice into epic stadium anthems with AI. Record, customize, and share your own Jock Jams cover instantly.

## Getting Started

1. Clone the repository
```bash
git clone https://github.com/yourusername/jamjock.git
cd jamjock
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```
Edit `.env` with your API keys and configuration.

4. Start the development server
```bash
npm run dev
```

## Environment Variables

The following environment variables are required:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `VITE_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
- `VITE_STRIPE_PRICE_ID`: Your Stripe price ID for the song purchase
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook signing secret
- `VITE_ELEVENLABS_API_KEY`: Your ElevenLabs API key
- `VITE_SITE_URL`: Your site URL (e.g., http://localhost:5173 for development)
- `VITE_GA_MEASUREMENT_ID`: Your Google Analytics measurement ID

## Features

- Voice recording and AI-powered song generation
- Secure payment processing with Stripe
- User authentication with Supabase
- Real-time song status updates
- Shareable song links

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- Supabase
- Stripe
- ElevenLabs AI
- Netlify

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

- Never commit `.env` files
- Always use environment variables for sensitive data
- Keep API keys and secrets secure
- Report security vulnerabilities responsibly

## License

This project is licensed under the MIT License - see the LICENSE file for details.