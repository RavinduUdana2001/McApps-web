import axios from "axios";
import { api, getErrorMessage } from "./api";
import type {
  AuthUser,
  CompanyOption,
  LoginErrorResponse,
  LoginPayload,
} from "../types/auth";

const COMPANY_TOKENS: Record<CompanyOption, string[]> = {
  McLarens: ["mclarens", "mc larens"],
  GAC: ["gac"],
  "M&D": ["m&d", "mll", "iol"],
};
const NO_USER_FOUND_MESSAGE =
  "No user found for the provided account. Please check the username and try again.";

function dedupeErrorParts(message: string) {
  const parts = message
    .split(/\r?\n+|(?<=[.!?])\s+(?=[A-Z])/)
    .map((part) => part.trim())
    .filter(Boolean);

  const uniqueParts: string[] = [];

  parts.forEach((part) => {
    const loweredPart = part.toLowerCase();

    if (!uniqueParts.some((item) => item.toLowerCase() === loweredPart)) {
      uniqueParts.push(part);
    }
  });

  return uniqueParts.join(" ").replace(/\s+/g, " ").trim();
}

function isWrongCompanyError(message: string, company: CompanyOption) {
  const selectedTokens = COMPANY_TOKENS[company];
  const mentionsSelectedCompany = selectedTokens.some((token) =>
    message.includes(token)
  );

  const mentionsAnotherCompany = Object.entries(COMPANY_TOKENS).some(
    ([companyName, tokens]) =>
      companyName !== company && tokens.some((token) => message.includes(token))
  );

  return (
    message.includes("wrong company") ||
    message.includes("selected company") ||
    message.includes("company name") ||
    message.includes("invalid company") ||
    message.includes("company mismatch") ||
    message.includes("another company") ||
    (message.includes("company") &&
      (message.includes("not found") || message.includes("no user found"))) ||
    (mentionsSelectedCompany && mentionsAnotherCompany)
  );
}

function normalizeLoginError(message: string, company: CompanyOption) {
  const trimmedMessage = dedupeErrorParts(message);
  const loweredMessage = trimmedMessage.toLowerCase();

  if (!trimmedMessage) {
    return "Login failed. Please try again.";
  }

  if (
    loweredMessage.includes("no internet") ||
    loweredMessage.includes("network") ||
    loweredMessage.includes("offline")
  ) {
    return "No internet connection. Please check your network and try again.";
  }

  if (isWrongCompanyError(loweredMessage, company)) {
    return NO_USER_FOUND_MESSAGE;
  }

  if (
    loweredMessage.includes("invalid credentials") ||
    loweredMessage.includes("invalid username") ||
    loweredMessage.includes("invalid password")
  ) {
    return "Incorrect username or password. Please try again.";
  }

  if (
    (company === "GAC" || company === "M&D") &&
    (loweredMessage.includes("no user found") ||
      loweredMessage.includes("user not found"))
  ) {
    return NO_USER_FOUND_MESSAGE;
  }

  if (company === "M&D") {
    return NO_USER_FOUND_MESSAGE;
  }

  return trimmedMessage;
}

export async function ldapLogin(payload: LoginPayload): Promise<AuthUser> {
  try {
    const response = await api.post<AuthUser | LoginErrorResponse>(
      "/auth/ldap_login",
      payload
    );

    const data = response.data;

    // API can return 200 with { error: "..." }
    if ("error" in data) {
      throw new Error(data.error || "Login failed");
    }

    return data;
  } catch (error) {
    const message = axios.isAxiosError(error)
      ? getErrorMessage(error.response?.data ?? { message: error.message })
      : error instanceof Error
        ? error.message
        : "Login failed. Please try again.";

    throw new Error(normalizeLoginError(message, payload.company_name));
  }
}
