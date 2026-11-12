"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Lock,
  User,
} from "lucide-react";
import { ApiError, api } from "@/lib/api";
import { safeNext } from "@/lib/safe-next";
import { cn } from "@/lib/utils";

/** Mã lỗi backend → câu thông báo thân thiện */
function messageFor(err) {
  if (!(err instanceof ApiError)) return "Đã có lỗi xảy ra, vui lòng thử lại.";
  switch (err.code) {
    case "INVALID_CREDENTIALS":
      return "Tên đăng nhập hoặc mật khẩu không đúng.";
    case "TOO_MANY_REQUESTS": {
      const m = Math.ceil((err.retryAfter ?? 60) / 60);
      // giới hạn đăng nhập sai ("đăng nhập") khác giới hạn thao tác chung ("thao tác quá nhanh") → nói đúng lý do
      return /đăng nhập/i.test(err.message ?? "")
        ? `Bạn đã đăng nhập sai quá nhiều lần. Vui lòng thử lại sau khoảng ${m} phút.`
        : `Bạn thao tác quá nhanh. Vui lòng đợi khoảng ${m} phút rồi thử lại.`;
    }
    case "VALIDATION_ERROR":
      return "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.";
    case "ADMIN_NOT_CONFIGURED":
      return "Tài khoản quản trị chưa được cấu hình trên máy chủ (ADMIN_ID / ADMIN_PASSWORD).";
    case "CSRF_REJECTED":
    case "BAD_ORIGIN":
      return "Yêu cầu bị từ chối vì lý do bảo mật. Vui lòng tải lại trang.";
    case "NETWORK_ERROR":
      return "Không kết nối được máy chủ. Kiểm tra mạng hoặc thử lại sau.";
    default:
      return err.status >= 500 ? "Máy chủ đang bận, vui lòng thử lại sau." : err.message;
  }
}

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const id = useId();
  const passwordRef = useRef(null);
  const focusPassword = useRef(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | sending | done
  const [error, setError] = useState("");
  const [capsLock, setCapsLock] = useState(false);
  const expired = params.get("het-phien") === "1";

  const submit = async (e) => {
    e.preventDefault();
    if (status === "sending") return;
    if (!username.trim() || !password) {
      setError("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");
      return;
    }
    setStatus("sending");
    setError("");
    try {
      await api("/auth/login", {
        method: "POST",
        body: { username: username.trim(), password, remember },
        retry: false,
      });
      setStatus("done");
      router.replace(safeNext(params.get("next")));
      router.refresh();
    } catch (err) {
      setStatus("idle");
      setError(messageFor(err));
      setPassword(""); // xóa mật khẩu sai, giữ tên đăng nhập
      // ô mật khẩu còn đang khóa (disabled) tới khi render lại → đợi bật lại rồi mới đặt con trỏ vào
      focusPassword.current = true;
    }
  };

  // sau khi đăng nhập lỗi và ô nhập đã bật lại → đưa con trỏ về ô mật khẩu
  useEffect(() => {
    if (status !== "idle" || !focusPassword.current) return;
    focusPassword.current = false;
    passwordRef.current?.focus();
  }, [status, error]);

  const busy = status !== "idle";
  const fieldWrap =
    "border-forest/15 focus-within:border-sage-500 focus-within:ring-sage-200/60 flex items-center gap-3 rounded-2xl border bg-white px-4 transition focus-within:ring-2";

  return (
    <form onSubmit={submit} noValidate className="mt-8 space-y-5 sm:mt-10">
      {expired && !error && (
        <p
          role="status"
          className="bg-sage-50 text-sage-800 border-sage-200 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm"
        >
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="flex [animation:fadeIn_.3s_ease-out_both] items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <div>
        <label
          htmlFor={`${id}-u`}
          className="text-ink-soft mb-1 block pl-1 text-[13px] font-medium sm:mb-1.5 sm:text-sm"
        >
          Tên đăng nhập
        </label>
        <div className={fieldWrap}>
          <User className="text-ink-muted size-[18px] shrink-0" aria-hidden="true" />
          <input
            id={`${id}-u`}
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={busy}
            className="text-ink placeholder:text-ink-muted h-11 w-full bg-transparent text-base outline-none sm:h-12 sm:text-sm"
            placeholder="Nhập tên đăng nhập"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor={`${id}-p`}
          className="text-ink-soft mb-1 block pl-1 text-[13px] font-medium sm:mb-1.5 sm:text-sm"
        >
          Mật khẩu
        </label>
        <div className={fieldWrap}>
          <Lock className="text-ink-muted size-[18px] shrink-0" aria-hidden="true" />
          <input
            ref={passwordRef}
            id={`${id}-p`}
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyUp={(e) => setCapsLock(e.getModifierState?.("CapsLock") ?? false)}
            disabled={busy}
            className="text-ink placeholder:text-ink-muted h-11 w-full bg-transparent text-base outline-none sm:h-12 sm:text-sm"
            placeholder="Nhập mật khẩu"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            className="text-ink-muted hover:text-forest -mr-1 grid size-9 shrink-0 place-items-center rounded-full transition-colors"
          >
            {show ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
          </button>
        </div>
        {capsLock && <p className="text-sage-700 mt-1.5 pl-1 text-xs">Caps Lock đang bật.</p>}
      </div>

      {/* Ghi nhớ đăng nhập — 1 dòng gọn, căn giữa (thẳng hàng với nút Đăng nhập).
          Chọn: giữ đăng nhập 7 ngày trên thiết bị này. Không chọn (mặc định, an toàn cho máy dùng chung):
          đóng trình duyệt là tự đăng xuất. Mật khẩu KHÔNG được lưu ở đâu cả. */}
      <label
        htmlFor={`${id}-r`}
        title="Không nên chọn trên máy tính dùng chung"
        className="group mx-auto flex w-fit cursor-pointer items-center gap-2.5 select-none"
      >
        <span className="relative grid size-[18px] shrink-0 place-items-center">
          <input
            id={`${id}-r`}
            type="checkbox"
            name="remember"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            disabled={busy}
            className="peer border-forest/25 checked:border-forest checked:bg-forest group-hover:border-sage-500 focus-visible:ring-sage-200 size-[18px] cursor-pointer appearance-none rounded-[5px] border-[1.5px] bg-white transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60"
          />
          <Check
            className="text-pearl pointer-events-none absolute size-3 scale-50 opacity-0 transition duration-200 peer-checked:scale-100 peer-checked:opacity-100"
            strokeWidth={3.5}
            aria-hidden="true"
          />
        </span>
        <span className="text-ink-soft group-hover:text-forest text-[13px] transition-colors sm:text-sm">
          Ghi nhớ đăng nhập
        </span>
      </label>

      {/* nút viên thuốc rộng bằng các ô nhập (mép trái/phải thẳng hàng) — vòng tròn mũi tên ở mép phải */}
      <div className="pt-1">
        <button
          type="submit"
          disabled={busy}
          className={cn(
            "group bg-forest text-pearl hover:bg-sage-700 relative flex h-[52px] w-full items-center justify-center rounded-full px-14 text-xs font-semibold tracking-[0.18em] uppercase transition-colors duration-300 sm:h-[52px]",
            "focus-visible:outline-sage-500 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-70",
          )}
        >
          {busy ? (status === "done" ? "Đang chuyển trang…" : "Đang đăng nhập…") : "Đăng nhập"}
          <span className="bg-sage-500 absolute right-1.5 grid size-10 place-items-center rounded-full text-white transition-transform duration-300 group-hover:translate-x-0.5">
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <ArrowRight className="size-4" aria-hidden="true" />
            )}
          </span>
        </button>
      </div>
    </form>
  );
}
