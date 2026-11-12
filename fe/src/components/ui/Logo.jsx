import Image from "@/components/ui/Img";
import Link from "next/link";
import { brand } from "@/data/images";
import { cn } from "@/lib/utils";

// Logo B.O.T Việt Nam (bản ngang). light: bản trắng cho nền tối.
export default function Logo({ href = "/", light = false, className, priority = false }) {
  return (
    <Link href={href} aria-label="Mayqueen Slim - B.O.T" className={cn("inline-flex", className)}>
      <Image
        src={light ? brand.horizontalWhite : brand.horizontal}
        alt="B.O.T"
        width={357}
        height={136}
        priority={priority}
        className="h-full w-auto"
      />
    </Link>
  );
}
