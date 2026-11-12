import { randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import { credentialFingerprint } from "../config/admin.js";
import { env } from "../config/env.js";
import { toSeconds } from "../utils/duration.js";

/**
 * JWT HS256 — access (ngắn hạn) và refresh (dài hạn) dùng 2 secret KHÁC NHAU + claim `typ`
 * → không thể dùng nhầm loại này thay loại kia. issuer/audience cố định để chặn token của hệ thống khác.
 */
const ISSUER = "mayqueen-api";
const AUDIENCE = "mayqueen-web";
const ALG = "HS256";

export const signAccessToken = (user) =>
  jwt.sign({ typ: "access", role: user.role, cv: credentialFingerprint() }, env.jwt.accessSecret, {
    algorithm: ALG,
    subject: user.id,
    issuer: ISSUER,
    audience: AUDIENCE,
    expiresIn: toSeconds(env.jwt.accessTtl),
  });

export const signRefreshToken = (sid, userId) =>
  jwt.sign({ typ: "refresh", sid: String(sid) }, env.jwt.refreshSecret, {
    algorithm: ALG,
    subject: userId,
    issuer: ISSUER,
    audience: AUDIENCE,
    jwtid: randomBytes(16).toString("hex"),
    expiresIn: toSeconds(env.jwt.refreshTtl),
  });

function verify(token, secret, typ) {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, secret, {
      algorithms: [ALG],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    return payload.typ === typ ? payload : null;
  } catch {
    return null;
  }
}

/** Access hợp lệ khi chữ ký đúng + chưa hết hạn + tài khoản .env chưa đổi */
export const verifyAccessToken = (token) => {
  const p = verify(token, env.jwt.accessSecret, "access");
  return p && p.cv === credentialFingerprint() ? p : null;
};

export const verifyRefreshToken = (token) => verify(token, env.jwt.refreshSecret, "refresh");
