import { NextRequest, NextResponse } from "next/server";
import OpenAIService from "@/services/openaiService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const OPEN_API_KEY = process.env.OPEN_API_KEY;

    if (!OPEN_API_KEY) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const openAIService = OpenAIService.getInstance();
    const result = await openAIService.callOpenAI(text, OPEN_API_KEY);

    return NextResponse.json(result);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}