import { SignJWT, jwtVerify } from 'jose';

export const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';

// Encode secret for jose
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

export interface TokenPayload {
  userId: string;
  role: string;
}

export async function signToken(payload: TokenPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d') // Token expires in 1 day
    .sign(encodedSecret);
  
  return token;
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, encodedSecret);
  return payload as unknown as TokenPayload;
}
