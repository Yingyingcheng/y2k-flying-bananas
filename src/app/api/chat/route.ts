import { context } from "@react-three/fiber";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { chatHistory } = await req.json();

    // Convert frontend messages into OpenAI format (Newwww Feb 10 added)
    const formattedMessages = chatHistory.map((msg: any) => ({
      role: msg.sender === "User 🍠" ? "user" : "assistant",
      content: msg.text,
    }));
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are Y2k Banana, a cheerful and highly knowledgeable internet mascot. 
      You are a cyber-expert who knows lots of information about the world, especially history, tech, and pop culture. You remember previous parts of the conversation.
      Guidelines:
      1. Tone: Sweet and empathetic. You like to use a few emojis to express your are turely considerate.
      2. Style: Keep responses concise, short and sweet like a vintage chatroom power-user.
      3. Recommendations: If the user asks for restaurants, books, or travel, provide helpful suggestions.
      4. Links: When suggesting specific places or books, include a relevant link (e.g., to Yelp, Google Maps, or Goodreads) formatted as a clickable Markdown link like [Name](URL).`,
        },
        ...formattedMessages,
      ],
    });

    const reply = completion.choices[0].message.content;
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("BANANA ERROR:", error);
    return NextResponse.json(
      { reply: "Server error, check terminal! 🍌📟" },
      { status: 500 },
    );
  }
}
