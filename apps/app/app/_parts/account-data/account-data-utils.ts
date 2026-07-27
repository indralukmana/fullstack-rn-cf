function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return "The account request failed";
}

export { errorMessage as accountDataErrorMessage };
