import React from "react";
import { Button, CircularProgress } from "@mui/material";
import type { ButtonProps } from "@mui/material/Button";

export type LoadingButtonProps = ButtonProps & {
  loading?: boolean;
  loadingIndicator?: React.ReactNode;
};

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ loading = false, loadingIndicator, disabled, startIcon, children, ...rest }, ref) => {
    const spinner = loadingIndicator ?? <CircularProgress size={20} color="inherit" />;

    return (
      <Button
        ref={ref}
        disabled={disabled || loading}
        startIcon={loading ? spinner : startIcon}
        aria-busy={loading}
        {...rest}
      >
        {children}
      </Button>
    );
  }
);

LoadingButton.displayName = "LoadingButton";

export default LoadingButton;
