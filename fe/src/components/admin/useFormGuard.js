"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useConfirm } from "./ui";

const LEAVE_DIALOG = {
  title: "Bỏ các thay đổi chưa lưu?",
  message: "Bạn có thay đổi chưa lưu. Rời trang bây giờ thì các thay đổi này sẽ mất.",
  confirmLabel: "Rời trang",
  cancelLabel: "Ở lại",
  danger: true,
};

/** Hỏi của form đang mở (nếu có) — dùng cho nút KHÔNG phải link, VD "Đăng xuất" ở khung Admin */
let activeLeaveCheck = null;

/**
 * Trước khi rời trang bằng nút (không phải link): form đang có thay đổi chưa lưu → hỏi như khi bấm link.
 * Trả về true nếu được rời (không có form / form không "bẩn" / người dùng đồng ý bỏ thay đổi).
 */
export function confirmLeave() {
  return activeLeaveCheck ? activeLeaveCheck() : Promise.resolve(true);
}

/**
 * Form còn thay đổi chưa lưu → hỏi trước khi rời trang, ở MỌI cách rời:
 * 1. Tải lại / đóng tab / gõ URL khác      → hộp thoại của trình duyệt (beforeunload)
 * 2. Bấm link trong Admin (menu bên, logo…) → hộp thoại xác nhận của Admin, đồng ý mới chuyển trang
 * 3. Nút Back / Forward của trình duyệt     → như (2). Lần đầu form "bẩn", chèn thêm 1 mục lịch sử
 *    TRÙNG URL ("bản sao"); bấm Back chỉ lùi về bản sao của chính trang này (nhận ra vì URL không đổi)
 *    → hỏi; đồng ý thì lùi tiếp, không thì chèn lại. Form không còn thay đổi (đã lưu / sửa lại như cũ)
 *    → tự lùi qua bản sao: nút Back luôn chỉ cần bấm 1 lần.
 *
 * CHỈ hỏi khi người dùng thật sự rời trang — KHÔNG BAO GIỜ khi đang gõ:
 * - Gõ tiếng Việt (Unikey/Telex: "a" + "s" → bộ gõ xóa "a" rồi chèn "á") làm form thoáng "sạch" trong
 *   tích tắc rồi "bẩn" lại. Sự kiện được gắn MỘT lần cho cả trang và đọc trạng thái mới nhất qua ref;
 *   mục chặn Back không bao giờ bị gỡ/chèn lại theo từng phím (trước đây gỡ bằng history.back() → trình
 *   duyệt báo "Back" trễ một nhịp, lúc form đã "bẩn" lại → hộp thoại tự hiện khi đang gõ).
 * - Mọi lệnh lùi lịch sử do chính hook gọi được đánh dấu (selfBack) để không bị hiểu nhầm là người dùng.
 */
export function useUnsavedGuard(dirty) {
  const router = useRouter();
  const confirm = useConfirm();
  const dirtyRef = useRef(dirty);
  const leaving = useRef(false); // đã đồng ý rời → không hỏi lại
  const asking = useRef(false); // đang mở hộp thoại → bỏ qua cú bấm tiếp theo
  const selfBack = useRef(false); // history.back() do hook gọi → popstate kế tiếp không phải người dùng
  const pushed = useRef(false); // đã chèn mục chặn cho trang này chưa
  const pageHref = useRef(""); // URL của trang form
  const afterBack = useRef(null); // URL sẽ thay vào sau khi lùi khỏi "bản sao" (xem replaceTo)

  // Gắn sự kiện 1 lần cho cả vòng đời trang
  useEffect(() => {
    const guardState = () => ({ ...history.state, __mqGuard: true });
    pageHref.current = location.href;

    const ask = async () => {
      if (asking.current) return false;
      asking.current = true;
      try {
        return await confirm(LEAVE_DIALOG);
      } finally {
        asking.current = false;
      }
    };

    // (1) tải lại / đóng tab
    const onBeforeUnload = (e) => {
      if (!dirtyRef.current || leaving.current) return;
      e.preventDefault();
      e.returnValue = "";
    };

    // (2) link nội bộ — pha CAPTURE trên window: chạy trước <Link> và hiệu ứng chuyển trang
    const onClick = async (e) => {
      if (!dirtyRef.current || leaving.current || e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // mở tab mới → không mất gì
      const a = e.target.closest?.("a[href]");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // cùng trang
      e.preventDefault();
      e.stopImmediatePropagation();
      if (!(await ask())) return;
      leaving.current = true;
      router.push(url.pathname + url.search + url.hash);
    };

    // (3) Back / Forward
    // Lùi/tiến mà vẫn đứng ở ĐÚNG URL của trang form = vừa đi qua "bản sao" do hook chèn (điều hướng thật
    // không bao giờ quay về chính URL đang đứng). Không dựa vào dấu __mqGuard trong history.state vì Next
    // ghi đè state (vd. sau khi lưu) làm mất dấu.
    const skip = () => {
      selfBack.current = true;
      history.back();
    };
    const onPopState = async () => {
      const twin = location.href === pageHref.current;
      if (selfBack.current) {
        selfBack.current = false; // lệnh lùi của chính hook → không phải người dùng
        if (afterBack.current) {
          // đã về mục gốc của trang form → thay mục đó bằng trang đích (replaceTo)
          const url = afterBack.current;
          afterBack.current = null;
          router.replace(url);
          return;
        }
        // vẫn còn bản sao phía sau (đã chèn nhiều lần) → lùi tiếp cho tới trang trước thật sự
        if (twin && (leaving.current || !dirtyRef.current)) skip();
        return;
      }
      if (!twin) return; // đã sang trang khác — Next tự xử lý
      if (leaving.current || !dirtyRef.current) return skip(); // không có gì để mất → Back 1 lần là đủ
      if (await ask()) {
        leaving.current = true;
        skip(); // lùi tiếp tới trang trước thật sự
      } else {
        history.pushState(guardState(), "", location.href); // ở lại → chèn lại mục chặn
      }
    };

    // (4) nút rời trang không phải link (Đăng xuất…) → gọi confirmLeave()
    const leaveCheck = async () => {
      if (!dirtyRef.current || leaving.current) return true;
      if (!(await ask())) return false;
      leaving.current = true;
      return true;
    };
    activeLeaveCheck = leaveCheck;
    // lib/api.js hỏi khi phiên đăng nhập hết hạn: còn nội dung chưa lưu → KHÔNG tự chuyển sang trang đăng nhập
    // (mất bài đang soạn), mà mở trang đăng nhập ở tab mới và báo bấm Lưu lại
    const hasUnsaved = () => dirtyRef.current && !leaving.current;
    window.__mqHasUnsaved = hasUnsaved;

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      if (activeLeaveCheck === leaveCheck) activeLeaveCheck = null;
      if (window.__mqHasUnsaved === hasUnsaved) delete window.__mqHasUnsaved;
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, [confirm, router]);

  // Theo dõi trạng thái "bẩn": lần đầu có thay đổi → chèn mục chặn Back (1 lần, không gỡ theo từng phím)
  useEffect(() => {
    dirtyRef.current = dirty;
    if (!dirty) return;
    leaving.current = false;
    pageHref.current = location.href;
    if (!pushed.current) {
      history.pushState({ ...history.state, __mqGuard: true }, "", location.href);
      pushed.current = true;
    }
  }, [dirty]);

  /** Gọi trước router.push của form khi người dùng ĐÃ đồng ý rời (nút Hủy / Quay lại / sau khi xóa) */
  const allowLeave = () => {
    leaving.current = true;
  };
  /**
   * Rời form bằng cách THAY trang hiện tại (sau khi tạo mới xong → về danh sách). Đang đứng ở "bản sao"
   * do hook chèn → lùi về mục gốc của trang form rồi mới thay, để nút Back không mở lại form "Thêm mới"
   * trống (cả bản sao lẫn mục gốc đều là trang form).
   */
  allowLeave.replaceTo = (url) => {
    leaving.current = true;
    if (pushed.current && location.href === pageHref.current) {
      afterBack.current = url;
      selfBack.current = true;
      history.back();
    } else router.replace(url);
  };
  return allowLeave;
}

/** Bỏ dòng trống trước khi gửi: chuỗi song ngữ không có bản VI */
export const filledLoc = (list) => list.filter((x) => x?.vi?.trim());

/** Chuỗi song ngữ: cắt khoảng trắng 2 đầu */
export const trimLoc = (v) => ({ vi: (v?.vi ?? "").trim(), en: (v?.en ?? "").trim() });

/** Dữ liệu từ API (có thể thiếu trường) → luôn đủ { vi, en } để ô nhập không bị undefined */
export const fillLoc = (v) => ({ vi: v?.vi ?? "", en: v?.en ?? "" });
