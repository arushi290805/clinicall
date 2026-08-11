import express, { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { isDoctorAvailable } from "../lib/availability";

const router = express.Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const appointments = await prisma.appointment.findMany({
      include: { doctor: true, user: true },
      orderBy: { scheduledAt: "asc" },
    });
    res.json({ success: true, data: appointments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch appointments" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: { doctor: true, user: true },
    });
    if (!appointment) {
      res.status(404).json({ success: false, message: "Appointment not found" });
      return;
    }
    res.json({ success: true, data: appointment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch appointment" });
  }
});

router.post("/availability", async (req: Request, res: Response) => {
  try {
    const { doctorId, scheduledAt } = req.body;
    if (!doctorId || !scheduledAt) {
      res.status(400).json({ success: false, message: "doctorId and scheduledAt are required" });
      return;
    }
    const when = new Date(scheduledAt);
    if (Number.isNaN(when.getTime())) {
      res.status(400).json({ success: false, message: "Invalid scheduledAt" });
      return;
    }
    const available = await isDoctorAvailable(doctorId, when);
    res.json({ success: true, data: { available, doctorId, scheduledAt: when.toISOString() } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to check availability" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { userId, doctorId, scheduledAt, notes } = req.body;

    if (!userId || !doctorId || !scheduledAt) {
      res.status(400).json({
        success: false,
        message: "userId, doctorId, and scheduledAt are required",
      });
      return;
    }

    const when = new Date(scheduledAt);
    if (Number.isNaN(when.getTime())) {
      res.status(400).json({ success: false, message: "Invalid scheduledAt" });
      return;
    }

    const [user, doctor] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.doctor.findUnique({ where: { id: doctorId } }),
    ]);

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    if (!doctor) {
      res.status(404).json({ success: false, message: "Doctor not found" });
      return;
    }

    const available = await isDoctorAvailable(doctorId, when);
    if (!available) {
      res.status(409).json({
        success: false,
        message: "Doctor is not available at that time",
      });
      return;
    }

    const appointment = await prisma.appointment.create({
      data: {
        userId,
        doctorId,
        scheduledAt: when,
        notes: typeof notes === "string" ? notes : "",
      },
      include: { doctor: true, user: true },
    });

    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to create appointment" });
  }
});

export default router;
