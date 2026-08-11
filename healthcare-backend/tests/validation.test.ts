import { describe, expect, it, vi } from "vitest";
import { Request, Response, NextFunction } from "express";
import { validateUserData } from "../src/middleware/validation";

function mockRes() {
  const res = {
    statusCode: 200,
    body: null as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as unknown as Response & { statusCode: number; body: unknown };
}

describe("validateUserData", () => {
  it("rejects missing fields", () => {
    const req = { body: { name: "Ada" } } as Request;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    validateUserData(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Invalid data" });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next for valid payload", () => {
    const req = {
      body: {
        name: "Ada",
        age: "30",
        gender: "Female",
        contactNumber: "1234567890",
        symptoms: "cough",
        medication: "none",
      },
    } as Request;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    validateUserData(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });
});
