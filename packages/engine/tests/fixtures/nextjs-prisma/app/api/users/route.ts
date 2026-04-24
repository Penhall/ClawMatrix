const _secret = process.env.USED_SECRET;

export async function GET() {
  return Response.json({ users: [] });
}
