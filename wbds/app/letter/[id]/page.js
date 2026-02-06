import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function LetterPage({ params }) {
    const { id } = params;

    // Fetch the letter
    const { data: letter, error } = await supabaseAdmin
        .from('letters')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !letter) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0a0a0a',
                color: '#fff'
            }}>
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <h1 style={{ fontSize: 24, marginBottom: 12 }}>Letter Not Found</h1>
                    <p style={{ color: '#888', marginBottom: 24 }}>This letter may have been deleted or never existed.</p>
                    <a href="/" style={{ color: '#d4af37', textDecoration: 'none' }}>← Return to the Void</a>
                </div>
            </div>
        );
    }

    // Format date
    const date = new Date(letter.created_at);
    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
            color: '#fff',
            padding: 20
        }}>
            <div style={{
                maxWidth: 600,
                width: '100%',
                background: 'rgba(30, 30, 30, 0.8)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 24,
                padding: 40,
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 24,
                    paddingBottom: 16,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <span style={{
                        fontSize: 12,
                        textTransform: 'uppercase',
                        letterSpacing: 2,
                        color: '#d4af37'
                    }}>From the Void</span>
                    <span style={{ fontSize: 13, color: '#888' }}>{formattedDate}</span>
                </div>

                <div style={{
                    fontSize: 18,
                    lineHeight: 1.7,
                    color: '#fff',
                    whiteSpace: 'pre-wrap',
                    marginBottom: 24
                }}>
                    {letter.content}
                </div>

                {letter.tags && letter.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                        {letter.tags.map(tag => (
                            <span key={tag} style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                padding: '4px 12px',
                                borderRadius: 20,
                                fontSize: 12,
                                color: '#888'
                            }}>{tag}</span>
                        ))}
                    </div>
                )}

                <div style={{
                    textAlign: 'center',
                    paddingTop: 20,
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <a href="/" style={{
                        color: '#d4af37',
                        textDecoration: 'none',
                        fontSize: 14,
                        fontWeight: 500
                    }}>Write Your Own Letter →</a>
                </div>
            </div>
        </div>
    );
}
