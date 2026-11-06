import React from "react";
import { ChevronDown } from "lucide-react";

interface PillItem {
  id: string;
  text: string;
  width: string;
  height: string;
  fontSize: string;
  opacity: number;
  bgOpacity: number;
  borderOpacity: number;
  blur: string;
  overlapOffset: string;
  isFront?: boolean;
}

const PILLS: PillItem[] = [
  {
    id: "p1",
    text: "Купить продукты",
    width: "w-[150px]",
    height: "h-[42px]",
    fontSize: "text-[12px]",
    opacity: 0.28,
    bgOpacity: 0.05,
    borderOpacity: 0.1,
    blur: "backdrop-blur-sm",
    overlapOffset: "mb-[-12px]",
  },
  {
    id: "p2",
    text: "Спланировать выходные",
    width: "w-[195px]",
    height: "h-[54px]",
    fontSize: "text-[14px]",
    opacity: 0.45,
    bgOpacity: 0.08,
    borderOpacity: 0.16,
    blur: "backdrop-blur-md",
    overlapOffset: "mb-[-18px]",
  },
  {
    id: "p3",
    text: "Обновить резюме",
    width: "w-[245px]",
    height: "h-[66px]",
    fontSize: "text-[16px]",
    opacity: 0.65,
    bgOpacity: 0.12,
    borderOpacity: 0.22,
    blur: "backdrop-blur-md",
    overlapOffset: "mb-[-22px]",
  },
  {
    id: "p4",
    text: "Купить продукты",
    width: "w-[295px]",
    height: "h-[78px]",
    fontSize: "text-[18px]",
    opacity: 0.85,
    bgOpacity: 0.16,
    borderOpacity: 0.3,
    blur: "backdrop-blur-lg",
    overlapOffset: "mb-[-26px]",
  },
  {
    id: "p5",
    text: "Спланировать выходные",
    width: "w-[340px] max-w-[calc(100vw-36px)]",
    height: "h-[94px]",
    fontSize: "text-[21px]",
    opacity: 1,
    bgOpacity: 0.22,
    borderOpacity: 0.45,
    blur: "backdrop-blur-xl",
    overlapOffset: "mb-0",
    isFront: true,
  },
];

export const IosGlassPillStack: React.FC = () => {
  return (
    <div className="relative w-full flex flex-col items-center justify-end pt-12 pb-5 select-none">
      <div className="relative flex flex-col items-center w-full">
        {PILLS.map((pill) => (
          <div
            key={pill.id}
            className={`relative rounded-full flex items-center justify-center transition-all ${pill.width} ${pill.height} ${pill.overlapOffset} ${pill.blur}`}
            style={{
              backgroundColor: `rgba(255, 255, 255, ${pill.bgOpacity})`,
              border: `1px solid rgba(255, 255, 255, ${pill.borderOpacity})`,
              boxShadow: pill.isFront
                ? "0 20px 40px -10px rgba(0, 0, 0, 0.28), inset 0 1px 2px 0 rgba(255, 255, 255, 0.6)"
                : "0 8px 24px -6px rgba(0, 0, 0, 0.15)",
              zIndex: pill.isFront ? 10 : undefined,
            }}
          >
            <span
              className={`font-medium tracking-tight text-white text-center px-4 ${pill.fontSize}`}
              style={{ opacity: pill.opacity }}
            >
              {pill.text}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-7 flex items-center justify-center text-black/32">
        <ChevronDown className="w-7 h-7 stroke-[2.5]" />
      </div>
    </div>
  );
};
