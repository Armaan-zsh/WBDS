import './globals.css';

export const metadata = {
    title: 'WBDS',
    description: 'Write it. Don\'t send it. Let it go.',
    viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0', // Prevent zooming to feel native
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <main className="viewport">
                    {children}
                </main>
            </body>
        </html>
    );
}
