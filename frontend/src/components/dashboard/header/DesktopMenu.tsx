// components/header/DesktopMenu.tsx
import React from "react";
import { Menu, MenuItem, Divider } from "@mui/material";
import { type MenuItem as MenuItemType } from "../../../types/header";

interface DesktopMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  menuItems: MenuItemType[];
}

const DesktopMenu: React.FC<DesktopMenuProps> = ({
  anchorEl,
  open,
  onClose,
  menuItems,
}) => {
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          mt: 1,
          minWidth: 200,
          borderRadius: 2,
          boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.15)",
        },
      }}
    >
      {menuItems
        .map((item, index) => [
          item.label === "Logout" && <Divider key={`divider-${index}`} />,
          <MenuItem
            key={item.label}
            onClick={item.onClick}
            sx={{ color: item.color || "inherit" }}
          >
            <span style={{ marginRight: 16, display: 'flex', alignItems: 'center' }}>
              {item.icon}
            </span>
            {item.label}
          </MenuItem>,
        ])
        .flat()
        .filter(Boolean)}
    </Menu>
  );
};

export default DesktopMenu;
