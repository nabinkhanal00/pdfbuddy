import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: 'PDF Buddy - Free Online PDF Editor',
    description: 'Browser-first PDF tools to merge, split, compress, convert, rotate, and secure PDF files with minimal setup.',
    generator: 'nakh00',
    icons: {
        icon: '/icon.svg',
        shortcut: '/icon.svg',
        apple: '/apple-icon.png',
    },
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en" className="bg-background">
            <body className="font-sans antialiased">
                {children}
                {process.env.NODE_ENV === 'production' && <Analytics />}
            </body>
        </html>
    )
}
