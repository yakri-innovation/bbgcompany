export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    status: "ok",
    service: "bbg-company",
    timestamp: new Date().toISOString()
  });
}
