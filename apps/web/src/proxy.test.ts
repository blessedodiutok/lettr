import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "./proxy";

function visit(path: string, role?: "tenant" | "landlord" | "admin") {
  const request = new NextRequest(new URL(path, "http://localhost:3000"));
  if (role) request.cookies.set("lettr_role", role);
  const response = proxy(request);
  return response.headers.get("location");
}

describe("route guard", () => {
  it("sends signed-out visitors to login and remembers where they were going", () => {
    expect(visit("/dashboard/saved")).toBe("http://localhost:3000/auth/login?next=%2Fdashboard%2Fsaved");
    expect(visit("/messages/abc?x=1")).toBe("http://localhost:3000/auth/login?next=%2Fmessages%2Fabc%3Fx%3D1");
  });

  it("lets each role into its own area", () => {
    expect(visit("/dashboard", "tenant")).toBeNull();
    expect(visit("/landlord/listings/new", "landlord")).toBeNull();
    expect(visit("/admin/disputes", "admin")).toBeNull();
    expect(visit("/messages", "landlord")).toBeNull();
  });

  it("redirects a role away from another role's area", () => {
    expect(visit("/landlord/dashboard", "tenant")).toBe("http://localhost:3000/dashboard");
    expect(visit("/pay/listing-1", "landlord")).toBe("http://localhost:3000/landlord/dashboard");
    expect(visit("/admin", "tenant")).toBe("http://localhost:3000/dashboard");
  });

  it("sends signed-in users from login to their home", () => {
    expect(visit("/auth/login", "landlord")).toBe("http://localhost:3000/landlord/dashboard");
    expect(visit("/auth/login")).toBeNull();
  });

  it("ignores an unknown role value", () => {
    expect(visit("/dashboard", "hacker" as never)).toContain("/auth/login");
  });
});
