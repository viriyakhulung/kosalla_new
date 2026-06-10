import Image from "next/image";

export function ViriyaLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  // tinggi logo (px)
  const heightMap = {
    sm: 28,
    md: 36,
    lg: 48,
  };

  // perkiraan lebar logo (px) supaya aspect ratio tetap enak
  const widthMap = {
    sm: 110,
    md: 150,
    lg: 200,
  };

  return (
    <Image
      src="/viriya-logo.png"
      alt="Viriya Logo"
      width={widthMap[size]}
      height={heightMap[size]}
      className="flex-shrink-0 h-auto w-auto"
      priority
    />
  );
}
