import { getSession } from "./session";

export function sanitizeFirebaseKey(value: string) {
  return value.replace(/[.#$[\]/]/g, "_");
}

export function getAlertUserIdentity() {
  const user = getSession();

  const email = (user?.mail || "").trim();
  const username = (user?.username || "").trim();
  const displayname = (user?.displayname || "").trim();

  let userId = "";

  if (email) {
    userId = sanitizeFirebaseKey(`user_${email}`);
  } else if (username) {
    userId = sanitizeFirebaseKey(`user_${username}`);
  } else if (displayname) {
    userId = sanitizeFirebaseKey(`user_${displayname}`);
  }

  return {
    userId,
    userName: displayname || username || "User",
    userEmail: email,
  };
}