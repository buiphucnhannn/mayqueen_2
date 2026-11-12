import NotFoundView, { NOT_FOUND_COPY } from "@/components/common/NotFoundView";

export const metadata = { title: NOT_FOUND_COPY.en.tab, description: NOT_FOUND_COPY.en.text };

export default function NotFoundEn() {
  return <NotFoundView lang="en" />;
}
