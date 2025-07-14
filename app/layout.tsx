import './globals.css';
import type { Metadata } from 'next';
import { Inter, Noto_Sans_JP } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });
const notoSansJP = Noto_Sans_JP({ 
  subsets: ['latin'],
  variable: '--font-noto-sans-jp'
});

export const metadata: Metadata = {
  title: '塾「武蔵」- スケジュール管理システム',
  description: '塾の授業スケジュールと生徒名簿を管理するシステム',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`${inter.className} ${notoSansJP.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
