import { UnauthorizedException, type ExecutionContext } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import { SupabaseAuthGuard } from "./supabase-auth.guard";
import type { SupabaseService } from "../supabase/supabase.service";
import type { AuthenticatedUser } from "./auth.types";

interface TestContext extends ExecutionContext {
  request: { headers: Record<string, string | undefined>; user?: AuthenticatedUser };
}

function buildContext(headers: Record<string, string | undefined>): TestContext {
  const request = { headers };
  return {
    switchToHttp: () => ({ getRequest: () => request }) as never,
    getHandler: () => undefined as never,
    getClass: () => undefined as never,
    request,
  } as unknown as TestContext;
}

function createGuard(options: { isPublic?: boolean; user?: AuthenticatedUser | null }) {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(options.isPublic ?? false),
  } as unknown as Reflector;
  const supabase = {
    verifyAccessToken: jest.fn().mockResolvedValue(options.user ?? null),
  } as unknown as SupabaseService;
  return new SupabaseAuthGuard(reflector, supabase);
}

describe("SupabaseAuthGuard", () => {
  const user: AuthenticatedUser = { id: "user-1", email: "scout@example.com" };

  it("allows public routes without a token", async () => {
    const guard = createGuard({ isPublic: true });
    await expect(guard.canActivate(buildContext({}))).resolves.toBe(true);
  });

  it("rejects requests with no bearer token", async () => {
    const guard = createGuard({});
    await expect(guard.canActivate(buildContext({}))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects invalid or expired tokens", async () => {
    const guard = createGuard({ user: null });
    await expect(
      guard.canActivate(buildContext({ authorization: "Bearer invalid" })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("attaches the authenticated user for valid tokens", async () => {
    const guard = createGuard({ user });
    const context = buildContext({ authorization: "Bearer valid" });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(context.request.user).toEqual(user);
  });
});
