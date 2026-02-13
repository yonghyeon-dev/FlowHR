import { NextResponse } from "next/server";

type ErrorPayload = {
  error: string;
  details?: unknown;
};

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(status: number, error: string, details?: unknown) {
  const payload: ErrorPayload = { error };
  if (details !== undefined) {
    payload.details = details;
  }
  return NextResponse.json(payload, { status });
}
