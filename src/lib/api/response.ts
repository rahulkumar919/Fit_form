import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function badRequest(message: string, errors?: unknown) {
  return NextResponse.json({ success: false, message, errors }, { status: 400 });
}

export function unauthorised(message = "Unauthorised") {
  return NextResponse.json({ success: false, message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ success: false, message }, { status: 403 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ success: false, message }, { status: 404 });
}

export function conflict(message: string) {
  return NextResponse.json({ success: false, message }, { status: 409 });
}

export function serverError(err: unknown) {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "object" && err !== null && "message" in err
        ? String((err as { message: unknown }).message)
        : typeof err === "string"
          ? err
          : "Internal server error";
  console.error("[API error]", err);
  return NextResponse.json({ success: false, message }, { status: 500 });
}

/** Parse Zod validation errors into a 400 with a flat, human-readable issue list. */
export function zodError(err: ZodError) {
  const issues = err.issues.map((i) => ({
    path: i.path.map(String).join("."),
    message: i.message,
  }));
  return NextResponse.json(
    {
      success: false,
      message: issues[0] ? `${issues[0].path ? issues[0].path + ": " : ""}${issues[0].message}` : "Validation failed",
      errors: err.flatten().fieldErrors,
      issues,
    },
    { status: 400 },
  );
}

/** Higher-order route wrapper — catches any thrown error. */
export function withErrorHandler(
  fn: (req: Request, ctx?: unknown) => Promise<NextResponse>,
) {
  return async (req: Request, ctx?: unknown) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof ZodError) return zodError(err);
      return serverError(err);
    }
  };
}
