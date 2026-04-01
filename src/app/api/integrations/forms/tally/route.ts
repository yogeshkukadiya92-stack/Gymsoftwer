import { POST as importFormResponse } from "@/app/api/integrations/forms/import/route";

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;

  return importFormResponse(
    new Request(request.url.replace("/tally", "/import"), {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify({
        ...body,
        source: "tally",
      }),
    }),
  );
}
