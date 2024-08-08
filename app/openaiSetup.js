import OpenAI from 'openai';

const openai = new OpenAI({
    baseURL: process.env.NEXT_PUBLIC_OPENROUTER_ENDPOINT,
    apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY,
    dangerouslyAllowBrowser: true,
});

export default openai;