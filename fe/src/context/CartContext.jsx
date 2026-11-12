"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { siteConfig } from "@/config/site";
import { localize } from "@/i18n";
import { cartStore } from "@/lib/cartStore";

const CartContext = createContext(null);

// Ghép dòng giỏ hàng với dữ liệu sản phẩm (tên, ảnh, giá theo gói) theo ngôn ngữ hiện tại.
// Sản phẩm / gói đã bị xóa hoặc ẩn trong Admin → tự bỏ khỏi giỏ.
function buildLines(items, lang, products) {
  return items
    .map((item) => {
      const raw = products.find((p) => p.slug === item.slug);
      const option = raw?.options.find((o) => o.id === item.optionId);
      if (!raw || !option) return null;
      const p = localize(raw, lang);
      const o = localize(option, lang);
      return {
        key: `${item.slug}:${item.optionId}`,
        slug: item.slug,
        urlSlug: p.urlSlug,
        optionId: item.optionId,
        qty: item.qty,
        name: p.name,
        image: p.images[0],
        optionLabel: o.label,
        optionNote: o.note || "", // VD "2 Mayqueen Slim + 2 Yodetox Extra" → khách biết combo gồm gì
        price: o.price,
        compareAt: o.compareAt,
      };
    })
    .filter(Boolean);
}

export function CartProvider({ lang, products, children }) {
  const items = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot,
  );
  const [open, setOpen] = useState(false);

  // Sản phẩm đổi đường dẫn (Admin đổi tên) → món trong giỏ đang dùng slug cũ được chuyển sang slug mới,
  // không bị rơi khỏi giỏ và đơn đặt gửi đúng sản phẩm
  useEffect(() => {
    const map = {};
    for (const p of products) for (const old of p.oldSlugs ?? []) map[old] = p.slug;
    if (Object.keys(map).length && items.some((i) => map[i.slug])) cartStore.migrate(map);
  }, [items, products]);

  const lines = useMemo(() => buildLines(items, lang, products), [items, lang, products]);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const saved = lines.reduce((s, l) => s + ((l.compareAt ?? l.price) - l.price) * l.qty, 0);
  const shipping =
    subtotal === 0 || subtotal >= siteConfig.freeShipThreshold ? 0 : siteConfig.shippingFee;

  const add = useCallback((slug, optionId, qty = 1, { openDrawer = true } = {}) => {
    cartStore.add(slug, optionId, qty);
    if (openDrawer) setOpen(true);
  }, []);

  const value = useMemo(
    () => ({
      lang,
      products,
      lines,
      count,
      subtotal,
      saved,
      shipping,
      total: subtotal + shipping,
      open,
      setOpen,
      add,
      setQty: cartStore.setQty,
      remove: (slug, optionId) => cartStore.setQty(slug, optionId, 0),
      clear: cartStore.clear,
    }),
    [lang, products, lines, count, subtotal, saved, shipping, open, add],
  );

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart phải nằm trong <CartProvider>");
  return ctx;
}
