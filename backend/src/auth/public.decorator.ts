import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'signalscout:is-public';

/** Marks a route (or controller) as accessible without authentication. */
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_KEY, true);
