import { ScoreService } from "./score.service";

const service = new ScoreService();

export async function scoreHandler(request: Request): Promise<Response> {
  try {
    const body = await request.json();

    const result = service.run(body);

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Invalid request" }),
      { status: 400 }
    );
  }
}
