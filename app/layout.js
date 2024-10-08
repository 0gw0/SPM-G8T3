import localFont from 'next/font/local';
import Navbar from '@/components/navbar';
import './globals.css';

const geistSans = localFont({
    src: './fonts/GeistVF.woff',
    variable: '--font-geist-sans',
    weight: '100 900',
});
const geistMono = localFont({
    src: './fonts/GeistMonoVF.woff',
    variable: '--font-geist-mono',
    weight: '100 900',
});

export const metadata = {
    title: 'All in One',
    description:
        'All-In-One is a leading Printing Solution Equipment Servicing company. It operates in selling, leasing, repairing and maintaining copying and printing solutions for businesses. The company supports the central copying and printing of products and solutions offered by IBM, HP, Xerox, and Canon.',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <Navbar />
                {children}
            </body>
        </html>
    );
}
