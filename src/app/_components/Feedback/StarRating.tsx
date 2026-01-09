"use client";

import { useState } from "react";

export interface StarRatingProps {
  rating: number;
  setRating: (rating: number) => void;
  hasHovered: boolean;
  setHasHovered: (hovered: boolean) => void;
}

export function StarRating({
  rating,
  setRating,
  hasHovered,
  setHasHovered,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number>(0);

  const handleMouseMove = (starIndex: number, event: React.MouseEvent) => {
    if (!hasHovered) setHasHovered(true);

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const isLeftHalf = x < rect.width / 2;

    const newRating = isLeftHalf ? starIndex + 0.5 : starIndex + 1;
    setHoverRating(newRating);
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  const handleClick = (starIndex: number, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const isLeftHalf = x < rect.width / 2;

    const newRating = isLeftHalf ? starIndex + 0.5 : starIndex + 1;
    setRating(newRating);
  };

  const getStarFill = (starIndex: number) => {
    const activeRating = hoverRating || rating;

    if (activeRating >= starIndex + 1) {
      return "full";
    } else if (activeRating >= starIndex + 0.5) {
      return "half";
    }
    return "empty";
  };

  return (
    <div className="flex gap-2" onMouseLeave={handleMouseLeave}>
      {[0, 1, 2, 3, 4].map((starIndex) => {
        const fill = getStarFill(starIndex);

        return (
          <div
            key={starIndex}
            className="relative cursor-pointer transition-transform hover:scale-110"
            onMouseMove={(e) => handleMouseMove(starIndex, e)}
            onClick={(e) => handleClick(starIndex, e)}
          >
            <svg
              className="h-10 w-10 text-muted-foreground/30 transition-colors"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>

            {fill !== "empty" && (
              <svg
                className="absolute left-0 top-0 h-10 w-10 text-primary transition-colors"
                fill="currentColor"
                viewBox="0 0 24 24"
                style={{
                  clipPath: fill === "half" ? "inset(0 50% 0 0)" : "none",
                }}
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}
