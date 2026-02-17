import Image from "next/image";

export function HifzerMark() {
  return (
    <Image
      src="/icon.png"
      alt=""
      aria-hidden="true"
      width={28}
      height={28}
      className="h-7 w-7 object-contain"
    />
  );
}
