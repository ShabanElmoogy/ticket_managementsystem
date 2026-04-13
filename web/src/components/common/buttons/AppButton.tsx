import React from "react";
import { Button, CircularProgress } from "@mui/material";
import type { ButtonProps } from "@mui/material/Button";

export type AppButtonProps = ButtonProps & {
  /** Show loading spinner. Default: false */
  loading?: boolean;
  /** Custom loading text shown as children while loading */
  loadingText?: string;
  loadingIndicator?: React.ReactNode;
};

const AppButton = React.forwardRef<HTMLButtonElement, AppButtonProps>(
  ({ loading = false, loadingText, loadingIndicator, disabled, startIcon, children, ...rest }, ref) => {
    const spinner = loadingIndicator ?? <CircularProgress size={20} color="inherit" />;

    return (
      <Button
        ref={ref}
        disabled={disabled || loading}
        startIcon={loading ? spinner : startIcon}
        aria-busy={loading}
        {...rest}
      >
        {loading && loadingText ? loadingText : children}
      </Button>
    );
  }
);

AppButton.displayName = "AppButton";

export default AppButton;

// Legacy alias
export { AppButton as LoadingButton };
