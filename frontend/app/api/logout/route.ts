import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.set("auth_token", "", {
    expires: new Date(0),
    path: "/",
  });
  return response;
}
