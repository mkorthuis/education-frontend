// Generic error handler function for thunks
export const handleApiError = (error: any, errorMessage: string) => {
  console.error(errorMessage, error);
  return errorMessage;
};
