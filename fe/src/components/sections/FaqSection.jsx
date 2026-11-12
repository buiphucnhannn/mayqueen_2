import { Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import Disclosure from "@/components/ui/Disclosure";
import SectionHeading from "@/components/ui/SectionHeading";

// Hỏi đáp: mỗi câu là 1 Disclosure — mở/đóng trượt mượt, hỗ trợ bàn phím.
export default function FaqSection({ data, faqs, phone, phoneRaw }) {
  return (
    <section className="bg-linen section-y">
      <Container wide className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionHeading eyebrow={data.eyebrow} title={data.title} text={data.text} align="left" />
          {/* 2 nút LUÔN bằng nhau: đủ chỗ → cạnh nhau cùng chiều rộng (cùng basis 15rem, cùng grow);
              hẹp (điện thoại) → xuống dòng, mỗi nút rộng hết hàng */}
          <div className="reveal mt-7 flex max-w-[32rem] flex-wrap gap-3">
            <Button data-consult="" variant="primary" className="grow basis-[15rem]">
              {data.consultCta}
            </Button>
            <Button href={`tel:${phoneRaw}`} variant="outline" className="grow basis-[15rem]">
              {data.cta} - {phone}
            </Button>
          </div>
        </div>
        <div className="divide-forest/10 border-forest/10 divide-y border-y">
          {faqs.map((f, i) => (
            <Disclosure
              key={f.q}
              defaultOpen={i === 0}
              className="reveal py-5"
              style={{ "--reveal-delay": `${i * 80}ms` }}
              buttonClassName="text-forest gap-6 font-serif text-lg"
              panelClassName="text-ink-soft max-w-2xl pt-4 pr-14 leading-relaxed"
              summary={f.q}
              icon={
                <span
                  key="icon" // React 19: JSX truyền qua prop từ Server Component, đặt cạnh summary → cần key
                  className="border-forest/15 group-data-[open=true]:border-forest group-data-[open=true]:bg-forest group-data-[open=true]:text-leaf grid size-10 shrink-0 place-items-center rounded-full border transition duration-500 group-data-[open=true]:rotate-45"
                >
                  <Plus className="size-4" aria-hidden="true" />
                </span>
              }
            >
              {f.a}
            </Disclosure>
          ))}
        </div>
      </Container>
    </section>
  );
}
