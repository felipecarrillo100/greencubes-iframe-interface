import React from "react";
import SpeedDial from "@mui/material/SpeedDial";
import SpeedDialAction from "@mui/material/SpeedDialAction";
import SpeedDialIcon from "@mui/material/SpeedDialIcon";

import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import RotateRightIcon from "@mui/icons-material/RotateRight";
import VisibilityIcon from "@mui/icons-material/Visibility"; // first-person / horizon
import LandscapeIcon from "@mui/icons-material/Landscape";     // horizon / first-person
import NavigationIcon from "@mui/icons-material/Navigation";     // horizon / first-person

import type { WebGLMap } from "@luciad/ria/view/WebGLMap.js";
import {carPerspective, helicopterPerspective, rotateToNorth, turn} from "./utills/NavigationUtils";
import type {FeatureLayer} from "@luciad/ria/view/feature/FeatureLayer.js";

interface Props {
    mapRef: React.RefObject<WebGLMap | null>;
    layerRef: React.RefObject<FeatureLayer | null>;
}

export const ViewToolIBar: React.FC<Props> = ({ mapRef, layerRef }) => {
    const actions = [
        {
            icon: <CenterFocusStrongIcon />,
            name: "Center",
            onClick: () => {
                if (mapRef.current && layerRef.current) {
                    mapRef.current.mapNavigator.fit({
                        // @ts-ignore
                        bounds: layerRef.current.bounds,
                        animate: { duration: 500 },
                    });
                }
            },
        },
        {
            icon: <RotateLeftIcon />,
            name: "Rotate Left",
            onClick: () => {
                if (mapRef.current) turn(mapRef.current, 1);
            },
        },
        {
            icon: <RotateRightIcon />,
            name: "Rotate Right",
            onClick: () => {
                if (mapRef.current) turn(mapRef.current, -1);
            },
        },
        {
            icon: <LandscapeIcon />,
            name: "Horizon",
            onClick: () => {
                if (mapRef.current) carPerspective(mapRef.current);
            },
        },
        {
            icon: <VisibilityIcon />,
            name: "Top",
            onClick: () => {
                if (mapRef.current) helicopterPerspective(mapRef.current);
            },
        },
        {
            icon: <NavigationIcon  />,
            name: "North",
            onClick: () => {
                if (mapRef.current) rotateToNorth(mapRef.current);
            },
        },

    ];

    return (
        <SpeedDial
            ariaLabel="View Tools"
            sx={{
                position: "fixed",
                top: 16,
                right: 16,
                bgcolor: "transparent", // fully transparent background
                pointerEvents: "none",  // do not block mouse events
                "& .MuiSpeedDial-fab": {
                    bgcolor: "primary.main",
                    color: "white",
                    pointerEvents: "auto", // allow clicks on the FAB
                    "&:hover": { bgcolor: "primary.dark" },
                },
                "& .MuiSpeedDial-actions": {
                    pointerEvents: "auto", // allow clicks on the actions
                },
            }}
            icon={<SpeedDialIcon />}
            direction="down"
        >
            {actions.map((action, index) => (
                <SpeedDialAction
                    key={action.name}
                    icon={action.icon}
                    tooltipTitle={action.name}
                    onClick={action.onClick}
                />
            ))}
        </SpeedDial>
    );
};
