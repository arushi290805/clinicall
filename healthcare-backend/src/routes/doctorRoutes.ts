import express, { Request, Response } from "express";
import { prisma } from "../lib/prisma";

const router = express.Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const doctors = await prisma.doctor.findMany({
      orderBy: { name: "asc" },
    });
    res.json({ success: true, data: doctors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch doctors" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.params.id },
    });
    if (!doctor) {
      res.status(404).json({ success: false, message: "Doctor not found" });
      return;
    }
    res.json({ success: true, data: doctor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch doctor" });
  }
});

export default router;
