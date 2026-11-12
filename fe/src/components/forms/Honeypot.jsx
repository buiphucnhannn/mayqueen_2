/**
 * Ô bẫy bot dùng chung (form tư vấn, đặt hàng): nằm ngoài màn hình, không nhận Tab, trình đọc màn hình bỏ qua.
 * Bot tự điền mọi ô → backend nhận ra (trường "website" trong payload).
 *
 * Tên ô cố ý KHÔNG giống ô thật nào ("website", "email", "company"... bị trình duyệt / trình quản lý mật khẩu tự
 * điền cho khách thật) + tắt tự điền của 1Password, LastPass, Bitwarden, Dashlane.
 */
export default function Honeypot({ ref }) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Leave this field empty
        <input
          ref={ref}
          name="mq_hp_ref"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          data-1p-ignore=""
          data-lpignore="true"
          data-bwignore=""
          data-form-type="other"
        />
      </label>
    </div>
  );
}
