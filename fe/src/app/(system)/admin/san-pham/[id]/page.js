import { Suspense } from "react";
import ProductForm from "@/components/admin/ProductForm";

export const metadata = { title: "Sửa sản phẩm" };

// id lấy từ URL (dữ liệu theo request) → đặt trong <Suspense>
async function Editor({ params }) {
  const { id } = await params;
  return <ProductForm key={id} id={id} />;
}

export default function Page({ params }) {
  return (
    <Suspense>
      <Editor params={params} />
    </Suspense>
  );
}
