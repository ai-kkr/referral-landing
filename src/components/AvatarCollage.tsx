import React, { useMemo } from "react";

const AVAILABLE_AVATARS = [0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 13];

interface AvatarCollageProps {
  seed?: string;
  reactionTrigger?: number;
}

export const AvatarCollage: React.FC<AvatarCollageProps> = ({ seed = "8ty" }) => {
  // Select 5 deterministic avatars based on seed
  const selectedAvatars = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const pool = [...AVAILABLE_AVATARS];
    const picked: number[] = [];
    for (let i = 0; i < 5; i++) {
      const idx = Math.abs((hash + i * 31) % pool.length);
      picked.push(pool[idx]);
      pool.splice(idx, 1);
    }
    return picked;
  }, [seed]);

  // Positions matching ReferralAvatarCollage.swift
  const placements = [
    { x: 30, y: 24, size: 140, rot: -16, floatClass: "animate-float-1", zIndex: 10 },
    { x: 70, y: 22, size: 140, rot: 14, floatClass: "animate-float-2", zIndex: 12 },
    { x: 10, y: 56, size: 144, rot: -12, floatClass: "animate-float-3", zIndex: 20 },
    { x: 50, y: 60, size: 150, rot: 5, floatClass: "animate-float-4", zIndex: 25 },
    { x: 90, y: 55, size: 142, rot: 15, floatClass: "animate-float-5", zIndex: 22 },
  ];

  return (
    <div className="relative w-full h-[260px] sm:h-[300px] overflow-hidden select-none pointer-events-none">
      {placements.map((p, idx) => {
        const avatarNum = selectedAvatars[idx];
        return (
          <div
            key={idx}
            className={`absolute transition-transform duration-500 will-change-transform ${p.floatClass}`}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              transform: `translate(-50%, -50%) rotate(${p.rot}deg)`,
              zIndex: p.zIndex,
            }}
          >
            <div className="w-full h-full relative group">
              {/* Soft ambient drop shadow underneath 3D avatar */}
              <div className="absolute inset-2 bg-black/15 blur-xl rounded-full translate-y-4" />
              <img
                src={`/avatars/avatar_${avatarNum}.png`}
                alt={`Avatar ${avatarNum}`}
                className="w-full h-full object-contain relative z-10 filter drop-shadow-md"
                draggable={false}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
