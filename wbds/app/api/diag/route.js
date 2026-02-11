export const runtime = 'edge';

export async function GET() {
    // Ultra-simple response to bypass any potential library crashes
    const data = {
        status: "alive",
        url_check: process.env.NEXT_PUBLIC_SUPABASE_URL ? "FOUND" : "NOT_FOUND",
        anon_check: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "FOUND" : "NOT_FOUND",
        time: new Date().toISOString()
    };

    return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}
