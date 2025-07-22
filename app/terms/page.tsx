"use client";


import React from "react";
import { useRouter } from "next/navigation";

export default function TermsPage() {
  const router = useRouter();
  return (
    <main className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
      <h1 className="text-3xl font-bold mb-6 text-center">利用規約</h1>
      <div className="space-y-6 text-base sm:text-lg text-gray-700">
        <p>
          このサイトは、宮本塾の生徒が個人的に作成したスケジュール管理システムです。自由にご活用いただけますが、運営者は本サービスの利用に関して一切の法的責任を負いません。
        </p>
        <p>
          サイトの利便性向上のため、データベースは公開設定となっています。そのため、万が一外部に漏洩した場合、登録された全員の本名が第三者に知られる可能性があります。ただし、本名が漏洩した場合でも「宮本塾に通っている」という事実以外の情報は含まれません。
        </p>
        <p>
          本名の非公開設定もご利用いただけますが、これは表示上のものであり、内部的なデータ保存には影響しません。ご自身の情報管理には十分ご注意ください。
        </p>
        <p>
          本サービスは、皆さんの善意と協力によって成り立っています。安心してご利用いただけるよう努めておりますが、個人情報の取り扱いにはご自身でもご配慮ください。
        </p>
        <p>
          利用規約に同意の上、サービスをご利用ください。今後ともよろしくお願いいたします。
        </p>
      </div>
      <div className="mt-10 flex justify-center">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition text-base"
        >
          前のページに戻る
        </button>
      </div>
    </main>
  );
}
