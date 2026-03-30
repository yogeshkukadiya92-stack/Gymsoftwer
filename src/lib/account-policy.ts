export const DEFAULT_FIRST_LOGIN_PASSWORD = "123456";

export function normalizePhoneForLogin(value: string) {
  return value.replace(/\D+/g, "");
}
