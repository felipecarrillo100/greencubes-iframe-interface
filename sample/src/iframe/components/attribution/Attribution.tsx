import React from "react";
import { styled } from "@mui/material/styles";

interface AttributionProps {
    text?: string;     // Optional tooltip or alt text for the user logo
    url: string;       // URL for the user link
    image?: string;     // URL or imported image (png, jpg, svg, etc.)
}

// Hardcoded company image and URL
const COMPANY_IMAGE = "./GreenCubes_CombineLogo.png"; // replace with your company logo URL
const COMPANY_URL = "https://hexagon.com/";

const AttributionWrapper = styled("div")({
    position: "fixed",
    bottom: 16,
    left: 16,
    display: "flex",
    alignItems: "center",
    gap: 12,
    pointerEvents: "auto",
    zIndex: 1000,
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: "6px 10px",
    borderRadius: 8,
    boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
    fontSize: 14,
});

const AttributionImage = styled("img")({
    height: 32,
    width: "auto",
    cursor: "pointer",
    borderRadius: 4,
    objectFit: "contain",
    transition: "transform 0.2s",
    "&:hover": {
        transform: "scale(1.05)",
    },
});

export const Attribution: React.FC<AttributionProps> = ({ text, url, image }) => {
    return (
        <AttributionWrapper>
            {/* Company Logo */}
            <a href={COMPANY_URL} target="_blank" rel="noopener noreferrer">
                <AttributionImage src={COMPANY_IMAGE} alt="Company Logo" />
            </a>

            {/* User Logo / Custom Image */}
            {image && url && (
                <a href={url} target="_blank" rel="noopener noreferrer" title={text}>
                    <AttributionImage src={image} alt={text || "Logo"} />
                </a>
            )}
        </AttributionWrapper>
    );
};
