// components/Button.tsx
"use client";

import React, { CSSProperties, useEffect, useState } from "react";
import SyncLoader from "react-spinners/SyncLoader";

interface ButtonProps {
  text: string;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
  disabled1?: boolean;
  color: "primary" | "secondary" | "grey" | string;
}

const MoreButton: React.FC<ButtonProps> = ({
  text,
  onClick,
  color,
  className,
  disabled = false,
  disabled1 = false,
}) => {
  // Use state to store the color dynamically
  const [myColor, setMyColor] = useState("#737373");
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    switch (color) {
      case "primary":
        setMyColor("#F58420");
        break;
      case "secondary":
        setMyColor("#F58420");
        break;
      case "grey":
        setMyColor("#737373");
        break;
      default:
        setMyColor(color); // If color is not one of the predefined values, use it directly.
        break;
    }
  }, [color]); // Dependency array ensures this effect runs only when `color` prop changes

  // Style object that uses `myColor`
  const defaultStyle: CSSProperties = {
    borderColor: myColor,
    backgroundColor: `${myColor}1A`,
    color: myColor,
    opacity: 1,
    width: "auto",
    whiteSpace: "nowrap",
    transition: "all 0.3s ease",
  };

  const hoverStyle: CSSProperties = {
    borderColor: `${myColor}`,
    backgroundColor: `${myColor}`,
    color: "#141414",
  };

  // Combining default class with any additional classes provided
  const classes = ` min-h-10 border rounded-[8px] py-3 px-7 ${className || ""}`;

  return (
    <>
      {disabled ? (
        <button className="text-md px-5 py-1 wallet-networks" color="primary">
          <SyncLoader color={myColor} />
        </button>
      ) : (
        <button
          type="submit"
          onClick={onClick}
          className={classes}
          disabled={disabled1}
          style={isHovered ? { ...defaultStyle, ...hoverStyle } : defaultStyle}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {text}
        </button>
      )}
    </>
  );
};

export default MoreButton;
