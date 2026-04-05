import { cn } from "@/lib/utils";

/** Four-pointed star divider (matches ✦) for credits and inline labels. */
export function CreditSep({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "mx-1 inline-block align-middle text-[0.8em] font-normal leading-none opacity-75",
        className,
      )}
      aria-hidden
    >
      ✦
    </span>
  );
}
