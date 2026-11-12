import { Suspense } from "react";
import ArticleForm from "@/components/admin/ArticleForm";

export const metadata = { title: "Sửa bài viết" };

// id lấy từ URL (dữ liệu theo request) → đặt trong <Suspense>
async function Editor({ params }) {
  const { id } = await params;
  return <ArticleForm key={id} id={id} />;
}

export default function Page({ params }) {
  return (
    <Suspense>
      <Editor params={params} />
    </Suspense>
  );
}
