import { Serializer } from 'bunyan';

export function redactPasswordSerializer<T extends { password?: string }>(obj?: T): T | undefined {
  if (obj && obj.password) {
    return { ...obj, password: '**redacted**' };
  }
  return obj;
}

export const oAuthSerializers: Record<string, Serializer> = {
  passwordValidate: redactPasswordSerializer,
  clientAuth: redactPasswordSerializer
};

