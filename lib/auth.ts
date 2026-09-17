import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db } from "./db";

const COOKIE = "ts_session";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "insecure-development-secret-please-set-AUTH_SECRET"
);

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSessionUserId(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export type SessionUser = {
  id: string;
  name: string;
  handle: string;
  email: string;
  kind: string;
  role: string;
  verified: boolean;
  avatarHue: number;
  onboarded: boolean;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const id = await getSessionUserId();
  if (!id) return null;
  return db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      handle: true,
      email: true,
      kind: true,
      role: true,
      verified: true,
      avatarHue: true,
      onboarded: true,
    },
  });
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}
