import { NextResponse } from "next/server";
import OpenAI from "openai";


export async function POST(req) {
    if (!process.env.OPENROUTER_API_KEY) {
        return NextResponse.json({ error: 'OpenAI API key is not set' }, { status: 500 });
    }
    const openai = new OpenAI({
        baseURL: process.env.NEXT_PUBLIC_OPENROUTER_ENDPOINT,
        apiKey: process.env.OPENROUTER_API_KEY,
    });

    const { inventory } = await req.json();

    const completion = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: "You are a helpful assistant that suggests recipes based on available food ingredients. NOTE: Do not give any helper statements or any text formatting, give me only the content needed."
            },
            {
                role: "user",
                content: `Some of the following items are food items, ${inventory.join(', ')}. Filter them and suggest a recipe using some or all of those ingredients. Provide the recipe name, ingredients list, and step-by-step instructions.`
            }
        ],
    });
    return new NextResponse(completion?.choices[0]?.message?.content);
}