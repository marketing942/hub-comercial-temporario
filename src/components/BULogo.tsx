import Image from "next/image";
import { GraduationCap } from "lucide-react";
import { BU_COLOR, BU_LABEL, BU_LOGO } from "@/lib/brand";
import type { BU } from "@/lib/products";

export default function BULogo({
  bu,
  size = 48,
}: {
  bu: BU;
  size?: number;
}) {
  const logo = BU_LOGO[bu];
  const color = BU_COLOR[bu];
  if (logo) {
    return (
      <div
        className="rounded-2xl bg-panel2 grid place-items-center p-1.5"
        style={{ width: size + 12, height: size + 12, boxShadow: `0 0 0 2px ${color}33 inset` }}
      >
        <Image src={logo} alt={BU_LABEL[bu]} width={size} height={size} className="object-contain" />
      </div>
    );
  }
  // Fallback: icone de academia + iniciais
  return (
    <div
      className="rounded-2xl grid place-items-center font-bold"
      style={{
        width: size + 12,
        height: size + 12,
        background: color + "22",
        color,
        boxShadow: `0 0 0 2px ${color}33 inset`,
      }}
    >
      <GraduationCap style={{ width: size * 0.6, height: size * 0.6 }} />
    </div>
  );
}
