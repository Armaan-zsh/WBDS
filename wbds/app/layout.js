import './globals.css';

export const metadata = {
    title: 'WBDS',
    description: 'Write it. Don\'t send it. Let it go.',
    viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0', // Prevent zooming to feel native
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Allura&family=Comfortaa:wght@300..700&family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Dancing+Script:wght@400..700&family=Fira+Code:wght@300..700&family=Great+Vibes&family=IBM+Plex+Mono:wght@100..700&family=Inter:wght@100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Lexend+Deca:wght@100..900&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Nunito:ital,wght@0,200..1000;1,200..1000&family=Parisienne&family=Roboto+Mono:ital,wght@0,100..700;1,100..700&family=Source+Code+Pro:ital,wght@0,200..900;1,200..900&display=swap" rel="stylesheet" />
            </head>
            <body>
                <main className="viewport">
                    {children}
                </main>
            </body>
        </html>
    );
}
