import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full py-6 mt-12 border-t text-center text-sm text-gray-500 bg-white">
      <span>
        &copy; {new Date().getFullYear()} 武蔵スケジューリングシステム made by Roughfts
        {' | '}
        <Link href="/terms" className="underline text-blue-600 hover:text-blue-800">利用規約</Link>
      </span>
    </footer>
  );
}
