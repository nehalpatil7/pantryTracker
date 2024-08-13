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

    const { img, inventory } = await req.json();

    const completion = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini",
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: `Please analyze the attached image and identify prominent items with a priority on the following:
                            1. First, focus on identifying food items.
                            2. Next, look for items related to food, such as packaged food and food accessories.
                            3. Finally, identify items used with food, such as cooking tools, eating utensils, and serving dishes.
                        Cross-reference detected items with the following list: ${inventory.join(', ')}.
                        Return the exact item name from the list if a match is found, maintaining case sensitivity.
                        If the item is related to the food industry but not on the list, return its name.
                        If the item is not related to the food industry, do not return anything.
                        The resultant response should be a single item without classification in order of preference.
                        If there is nothing to return or you're unable to analyze the image, return 'none'.`
                    },
                    {
                        type: "image_url",
                        image_url: { url: img },
                    },
                ],
            },
        ],
    });
    return new NextResponse(completion?.choices[0]?.message?.content);
}
