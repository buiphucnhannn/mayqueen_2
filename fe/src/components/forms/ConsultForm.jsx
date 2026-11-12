"use client";

import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2, RotateCcw } from "lucide-react";
import ConsentCheckbox, { consentPayload } from "@/components/forms/ConsentCheckbox";
import Honeypot from "@/components/forms/Honeypot";
import Button from "@/components/ui/Button";
import { ui } from "@/data/ui";
import { api } from "@/lib/api";
import { NAME_MAX, cleanName, cn, isValidPhone, nameProblem, phoneInput } from "@/lib/utils";

// goal: null = khách chưa chọn (không chọn sẵn ô đầu → số liệu nhu cầu trong Admin phản ánh đúng lựa chọn thật)
// agree: ô "Tôi đồng ý … Chính sách bảo mật" — KHÔNG tick sẵn (luật yêu cầu khách chủ động đồng ý)
const initial = { name: "", phone: "", goal: null, note: "", agree: false };
const NOTE_MAX = 1000; // khớp backend (be/src/validators/lead.validator.js)
// Nhu cầu gửi về backend LUÔN bằng tiếng Việt (nhân viên đọc trong Admin tiếng Việt) dù khách đặt từ trang /en;
// trên form vẫn hiện nhãn theo ngôn ngữ trang (labels.goals cùng thứ tự với ui.form.goals)
const goalVi = (i, fallback) => ui.form.goals[i]?.vi ?? fallback;

// Form đăng ký tư vấn liệu trình cá nhân hóa → backend POST /api/v1/leads (be/)
export default function ConsultForm({ labels }) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | done | error
  const [formError, setFormError] = useState("");
  const honeypot = useRef(null); // ô ẩn bẫy bot — người thật không thấy, luôn để trống
  const lang = usePathname()?.startsWith("/en") ? "en" : "vi"; // admin biết khách đọc tiếng Anh → tư vấn tiếng Anh

  /** Ô lỗi đầu tiên → đặt con trỏ vào (bàn phím / trình đọc màn hình biết ngay ô cần sửa) */
  const focusField = (key) =>
    requestAnimationFrame(() => document.getElementById(`consult-${key}`)?.focus());

  const nameMessage = (problem) =>
    ({ empty: labels.nameError, short: labels.nameShort, invalid: labels.nameInvalid })[problem];

  const set = (key, value) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (status === "sending") return; // chặn bấm gửi 2 lần
    const next = {};
    const problem = nameProblem(values.name);
    if (problem) next.name = nameMessage(problem);
    if (!isValidPhone(values.phone)) next.phone = labels.phoneError;
    if (!values.agree) next.consent = true;
    setErrors(next);
    if (Object.keys(next).length) return focusField(Object.keys(next)[0]);

    setStatus("sending");
    setFormError("");
    try {
      await api("/leads", {
        method: "POST",
        timeout: 20_000,
        body: {
          name: cleanName(values.name),
          phone: values.phone.trim(),
          goal: values.goal === null ? "" : goalVi(values.goal, labels.goals[values.goal]),
          note: values.note.trim(),
          lang,
          consent: consentPayload(),
          website: honeypot.current?.value ?? "",
        },
      });
      setStatus("done");
      setValues(initial);
    } catch (err) {
      setStatus("error");
      // Backend kiểm tra lại cùng luật: báo đúng ô sai (câu chữ theo ngôn ngữ trang, không dùng câu tiếng Việt của server)
      const fields = new Set((err.details ?? []).map((d) => d.field));
      // backend bắt buộc có đồng ý Chính sách bảo mật → báo ngay ở ô tick
      if (err.status === 422 && [...fields].some((f) => f.startsWith("body.consent"))) {
        setValues((v) => ({ ...v, agree: false }));
        setErrors({ consent: true });
        focusField("consent");
      } else if (err.status === 422 && (fields.has("body.name") || fields.has("body.phone"))) {
        setErrors({
          ...(fields.has("body.name") && { name: labels.nameInvalid }),
          ...(fields.has("body.phone") && { phone: labels.phoneError }),
        });
        focusField(fields.has("body.name") ? "name" : "phone");
      } else setFormError(err.status === 429 ? labels.rateLimited : labels.error);
    }
  };

  if (status === "done")
    return (
      <div className="flex flex-col items-center py-12 text-center" role="status">
        <span className="bg-leaf-soft text-sage-700 grid size-16 [animation:popIn_.5s_ease-out] place-items-center rounded-full">
          <CheckCircle2 className="size-8" aria-hidden="true" />
        </span>
        {/* tách "Cảm ơn bạn!" thành dòng riêng, phần còn lại nằm trọn 1 dòng bên dưới */}
        {(() => {
          const [, head, rest] = labels.success.match(/^(.+?[!.])\s+(.+)$/) ?? [
            null,
            labels.success,
            "",
          ];
          return (
            <p className="text-forest mt-5 font-serif text-balance">
              <span className="block text-3xl">{head}</span>
              {rest && <span className="mt-1.5 block text-xl">{rest}</span>}
            </p>
          );
        })()}
        {/* form đã được làm trống sau khi gửi → bấm là điền yêu cầu mới (cho người thân, đổi nhu cầu...) */}
        <Button variant="outline" size="sm" className="mt-7" onClick={() => setStatus("idle")}>
          <RotateCcw className="size-3.5" aria-hidden="true" /> {labels.again}
        </Button>
      </div>
    );

  return (
    <form
      onSubmit={submit}
      noValidate
      className="max-lg:tiny:sm:space-y-3 relative space-y-3 sm:space-y-4 lg:space-y-5"
    >
      {/* lỗi hiện ĐÈ lên viền dưới ô nhập (không chiếm thêm dòng) → popup giữ nguyên kích thước */}
      <div className="grid grid-cols-2 gap-3 pb-1 sm:gap-4 lg:gap-5">
        <div className="relative">
          <label htmlFor="consult-name" className="sr-only">
            {labels.name}
          </label>
          <input
            id="consult-name"
            autoComplete="name"
            maxLength={NAME_MAX}
            placeholder={`${labels.name} *`}
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            required
            aria-required="true"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "consult-name-error" : undefined}
            className={cn(
              "field max-lg:tiny:py-2.5 lg:py-3.5 lg:text-[16px]",
              errors.name && "border-red-400",
            )}
          />
          {errors.name && (
            <p
              id="consult-name-error"
              className="bg-pearl pointer-events-none absolute -bottom-2 left-3 max-w-[calc(100%-1.5rem)] truncate px-1.5 text-[11.5px] leading-4 text-red-600 lg:text-[13px]"
            >
              {errors.name}
            </p>
          )}
        </div>
        <div className="relative">
          <label htmlFor="consult-phone" className="sr-only">
            {labels.phone}
          </label>
          <input
            id="consult-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={16}
            placeholder={`${labels.phone} *`}
            value={values.phone}
            onChange={(e) => set("phone", phoneInput(e.target.value))} // chỉ nhận số, + và ký tự ngăn cách
            required
            aria-required="true"
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "consult-phone-error" : undefined}
            className={cn(
              "field max-lg:tiny:py-2.5 lg:py-3.5 lg:text-[16px]",
              errors.phone && "border-red-400",
            )}
          />
          {errors.phone && (
            <p
              id="consult-phone-error"
              className="bg-pearl pointer-events-none absolute -bottom-2 left-3 max-w-[calc(100%-1.5rem)] truncate px-1.5 text-[11.5px] leading-4 text-red-600 lg:text-[13px]"
            >
              {errors.phone}
            </p>
          )}
        </div>
      </div>

      <fieldset>
        <legend className="text-ink-soft max-lg:tiny:mb-2 mb-2.5 pl-1 text-sm font-medium lg:mb-3 lg:text-[16px]">
          {labels.goal}
        </legend>
        {/* Lưới 2 cột đều nhau → các hàng luôn thẳng hàng */}
        <div className="grid grid-cols-2 gap-2 lg:gap-2.5">
          {labels.goals.map((g, i) => (
            <button
              key={g}
              type="button"
              aria-pressed={values.goal === i}
              onClick={() => set("goal", values.goal === i ? null : i)} // bấm lại = bỏ chọn
              className={cn(
                "max-lg:tiny:sm:min-h-9 max-lg:tiny:sm:py-1.5 flex min-h-10 items-center justify-center rounded-xl border px-2.5 py-1.5 text-center text-[12.5px] leading-snug transition sm:min-h-11 sm:px-3 sm:py-2 sm:text-[13px] lg:min-h-12 lg:text-[15.5px]",
                values.goal === i
                  ? "border-forest bg-forest text-pearl"
                  : "border-forest/15 text-ink-soft hover:border-forest/40 bg-white",
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="consult-note" className="sr-only">
          {labels.note}
        </label>
        <textarea
          id="consult-note"
          rows={2}
          maxLength={NOTE_MAX}
          placeholder={labels.note}
          value={values.note}
          onChange={(e) => set("note", e.target.value)}
          className="field max-lg:tiny:py-2.5 resize-none lg:py-3.5 lg:text-[16px]"
        />
      </div>

      <ConsentCheckbox
        id="consult-consent"
        lang={lang}
        purpose="consult"
        checked={values.agree}
        onChange={(v) => {
          set("agree", v);
          if (errors.consent) setErrors((e) => ({ ...e, consent: undefined }));
        }}
        error={!!errors.consent}
        compact
      />

      <Honeypot ref={honeypot} />

      {status === "error" && formError && (
        <p className="text-sm text-red-600" role="alert">
          {formError}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        arrow
        className="max-lg:tiny:h-12 w-full lg:h-14 lg:text-[15px]"
        disabled={status === "sending"}
      >
        {status === "sending" ? labels.sending : labels.submit}
      </Button>
    </form>
  );
}
