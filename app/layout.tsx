import './globals.css';
import type { Metadata } from 'next';
import { Inter, Noto_Sans_JP } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });
const notoSansJP = Noto_Sans_JP({ 
  subsets: ['latin'],
  variable: '--font-noto-sans-jp'
});

export const metadata: Metadata = {
  title: '「武蔵」- スケジュール管理システム',
  description: '宮本塾の超複雑な夏期講習の授業スケジュールと生徒名簿を管理するシステムです。このサイトは、スケジュールがクラウドで管理されます。皆がスケジュールを直接編集することで、初めて成り立ちます。気づいた人からスケジュール追加・編集を誠によろしくお願いします。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="icon" type="image/svg+xml" href="/file.svg" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#00d9ff79" />
      </head>
      <body className={`${inter.className} ${notoSansJP.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
