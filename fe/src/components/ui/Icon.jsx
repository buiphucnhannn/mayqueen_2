import {
  BadgeCheck,
  CupSoda,
  Factory,
  FileCheck2,
  FlaskConical,
  Gift,
  GlassWater,
  Globe2,
  HeartPulse,
  Leaf,
  MessagesSquare,
  Microscope,
  Pill,
  Salad,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";

// Data lưu tên icon dạng chuỗi (để dữ liệu thuần, dễ sửa) → map sang component lucide tại đây.
const ICONS = {
  BadgeCheck,
  CupSoda,
  Factory,
  FileCheck2,
  FlaskConical,
  Gift,
  GlassWater,
  Globe2,
  HeartPulse,
  Leaf,
  MessagesSquare,
  Microscope,
  Pill,
  Salad,
  ShieldCheck,
  Sparkles,
  Truck,
};

export default function Icon({ name, ...props }) {
  const Cmp = ICONS[name] ?? Leaf;
  return <Cmp aria-hidden="true" {...props} />;
}
