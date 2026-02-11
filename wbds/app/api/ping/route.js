export const runtime = 'edge';

export async function GET() {
    return new Response(JSON.stringify({
        ping: "pong",
        platform: "cloudflare-edge",
        time: new Date().toISOString()
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}
