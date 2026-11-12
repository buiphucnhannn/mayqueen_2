import { cn } from "@/lib/utils";

export default function Container({
  as: Tag = "div",
  wide = false,
  className,
  children,
  ...props
}) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-10",
        wide ? "max-w-[1440px]" : "max-w-7xl",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
