import NotFoundView, { NOT_FOUND_COPY } from "@/components/common/NotFoundView";

export const metadata = { title: NOT_FOUND_COPY.vi.tab, description: NOT_FOUND_COPY.vi.text };

export default function NotFoundVi() {
  return <NotFoundView lang="vi" />;
}
