import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

vi.mock("../src/lib/prisma", () => ({
  prisma: {
    user: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    doctor: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    appointment: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    worker: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import app from "../src/app";
import { prisma } from "../src/lib/prisma";

describe("API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/health returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("POST /api/users/login returns user when found by ID", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u123",
      name: "Jane Doe",
      contactNumber: "1234567890",
    } as never);

    const res = await request(app)
      .post("/api/users/login")
      .send({ userId: "u123" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.name).toBe("Jane Doe");
  });

  it("POST /api/users/login returns 404 when user not found", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as never);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null as never);

    const res = await request(app)
      .post("/api/users/login")
      .send({ userId: "nonexistent" });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("GET /api/doctors returns list", async () => {
    vi.mocked(prisma.doctor.findMany).mockResolvedValue([
      {
        id: "d1",
        name: "Dr. Smith",
        specialty: "Cardiology",
        createdAt: new Date(),
      },
    ] as never);

    const res = await request(app).get("/api/doctors");
    expect(res.status).toBe(200);
    expect(res.body.data[0].name).toBe("Dr. Smith");
  });

  it("POST /api/appointments creates when available", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u1",
      name: "Ada",
    } as never);
    vi.mocked(prisma.doctor.findUnique).mockResolvedValue({
      id: "d1",
      name: "Dr. Smith",
    } as never);
    vi.mocked(prisma.appointment.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.appointment.create).mockResolvedValue({
      id: "a1",
      userId: "u1",
      doctorId: "d1",
      scheduledAt: new Date("2030-01-01T10:00:00.000Z"),
      status: "SCHEDULED",
      notes: "",
      doctor: { id: "d1", name: "Dr. Smith", specialty: "Cardiology" },
      user: { id: "u1", name: "Ada" },
    } as never);

    const res = await request(app).post("/api/appointments").send({
      userId: "u1",
      doctorId: "d1",
      scheduledAt: "2030-01-01T10:00:00.000Z",
    });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe("a1");
  });

  it("POST /api/appointments returns 409 when slot taken", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(prisma.doctor.findUnique).mockResolvedValue({ id: "d1" } as never);
    vi.mocked(prisma.appointment.findFirst).mockResolvedValue({ id: "existing" } as never);

    const res = await request(app).post("/api/appointments").send({
      userId: "u1",
      doctorId: "d1",
      scheduledAt: "2030-01-01T10:00:00.000Z",
    });

    expect(res.status).toBe(409);
  });

  it("POST /api/workers/signup registers worker and returns details", async () => {
    vi.mocked(prisma.worker.create).mockResolvedValue({
      id: "worker-123",
      name: "Dr. Worker",
      password: "secretpassword",
      hospitalId: "hosp-99",
      createdAt: new Date(),
    } as never);

    const res = await request(app).post("/api/workers/signup").send({
      name: "Dr. Worker",
      password: "secretpassword",
      hospitalId: "hosp-99",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.worker.id).toBe("worker-123");
  });

  it("POST /api/workers/signin authenticates worker with valid ID & password", async () => {
    vi.mocked(prisma.worker.findUnique).mockResolvedValue({
      id: "worker-123",
      name: "Dr. Worker",
      password: "secretpassword",
      hospitalId: "hosp-99",
    } as never);

    const res = await request(app).post("/api/workers/signin").send({
      id: "worker-123",
      password: "secretpassword",
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.worker.name).toBe("Dr. Worker");
  });
});
