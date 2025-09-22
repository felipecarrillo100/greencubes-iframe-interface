import React from "react";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import { styled } from "@mui/material/styles";

interface FullscreenButtonProps {
    onClick: () => void;
}

// Styled wrapper to fix the button at bottom right
const ButtonWrapper = styled("div")({
    position: "fixed",
    bottom: 16,
    right: 16,
    pointerEvents: "auto", // ensure clickable
    zIndex: 1000, // on top of map
});

export const FullscreenButton: React.FC<FullscreenButtonProps> = ({ onClick }) => {
    return (
        <ButtonWrapper>
            <Tooltip title="Fullscreen" arrow>
                <IconButton
                    onClick={onClick}
                    color="primary"
                    size="large"
                    aria-label="Toggle Fullscreen"
                    sx={{
                        bgcolor: "primary.main",
                        color: "white",
                        "&:hover": { bgcolor: "primary.dark" },
                    }}
                >
                    <FullscreenIcon fontSize="inherit" />
                </IconButton>
            </Tooltip>
        </ButtonWrapper>
    );
};
