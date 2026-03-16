import type { PropsWithChildren } from "react";
import clsx from "clsx";

type Props = PropsWithChildren<{
  className?: string;
}>;

export default function GlassCard({ className, children }: Props) {
  return <div className={clsx("glass rounded-[28px] p-5", className)}>{children}</div>;
}