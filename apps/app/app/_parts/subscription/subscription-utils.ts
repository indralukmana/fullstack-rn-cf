function message(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Subscription request failed";
}

export { message as subscriptionErrorMessage };
