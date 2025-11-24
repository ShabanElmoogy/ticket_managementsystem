import { memo } from "react";
import { Box, Avatar, Typography } from "@mui/material";
import MyTextField from "../../common/MyTextField";

export const getInitials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export interface HeaderProps {
  userName?: string;
  userRole?: string;
  title: string;
  onTitleChange: (value: string) => void;
}

const Header = memo(({ userName, userRole, title, onTitleChange }: HeaderProps) => (
  <Box display="flex" gap={2} mb={2}>
    <Avatar
      sx={{
        width: 48,
        height: 48,
        backgroundColor: userRole === "ADMIN" ? "#ef4444" : "#10b981",
        fontSize: "1rem",
        fontWeight: 600,
      }}
    >
      {getInitials(userName || "U")}
    </Avatar>
    <Box flexGrow={1}>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
        {`What's the issue${userName ? `, ${userName.split(" ")[0]}` : ""}?`}
      </Typography>
      <MyTextField
        fullWidth
        placeholder="Describe the problem or request..."
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        rounded
      />
    </Box>
  </Box>
));

Header.displayName = "Header";
export default Header;
