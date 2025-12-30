import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Alert, AlertTitle, Box, Button, Paper, Typography } from "@mui/material";

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export const ErrorFallback = ({ error, resetErrorBoundary }: ErrorFallbackProps) => {
  // When encountering an error in the development mode, rethrow it and don't display the boundary.
  // The parent UI will take care of showing a more helpful dialog.
  if (import.meta.env.DEV) throw error;

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
      <Box sx={{ width: "100%", maxWidth: 520 }}>
        <Alert severity="error" icon={<WarningAmberIcon />} sx={{ mb: 3 }}>
          <AlertTitle>Runtime Error</AlertTitle>
          Something unexpected happened while running the application.
        </Alert>

        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Error Details
          </Typography>
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 1.5,
              borderRadius: 1,
              overflow: "auto",
              maxHeight: 160,
              bgcolor: "grey.100",
              color: "error.main",
              fontSize: 12,
            }}
          >
            {error.message}
          </Box>
        </Paper>

        <Button
          onClick={resetErrorBoundary}
          fullWidth
          variant="outlined"
          startIcon={<RefreshIcon />}
        >
          Try Again
        </Button>
      </Box>
    </Box>
  );
}
