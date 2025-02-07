import React from "react";
import { CircularProgress, Box, Typography } from "@mui/material";

const LoadingSpinner = ({ message = "Loading...", size = 50 }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100%"
      textAlign="center"
      sx={{ py: 2 }}
    >
      <CircularProgress size={size} />
      <Typography variant="body2" sx={{ mt: 1 }}>
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingSpinner;
