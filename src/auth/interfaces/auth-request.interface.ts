import { Request } from 'express';

import { JwtPayload } from '../../jwt/types/jwt-payload.type.js';

export interface AuthRequest extends Request {
  user: JwtPayload;
}
