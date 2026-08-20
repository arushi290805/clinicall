import express, { Request, Response } from "express";
import { prisma } from "../lib/prisma";

const router = express.Router();

// Worker Sign Up
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { name, password, hospitalId } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ success: false, error: "Name is required" });
      return;
    }
    if (!password || !password.trim()) {
      res.status(400).json({ success: false, error: "Password is required" });
      return;
    }
    if (!hospitalId || !hospitalId.trim()) {
      res.status(400).json({ success: false, error: "Hospital ID is required" });
      return;
    }

    const worker = await prisma.worker.create({
      data: {
        name: name.trim(),
        password: password.trim(),
        hospitalId: hospitalId.trim(),
      },
    });

    res.status(201).json({
      success: true,
      message: "Worker registered successfully",
      worker: {
        id: worker.id,
        name: worker.name,
        hospitalId: worker.hospitalId,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Sign up failed" });
  }
});

// Worker Sign In
router.post("/signin", async (req: Request, res: Response) => {
  try {
    const { id, password } = req.body;

    if (!id || !id.trim()) {
      res.status(400).json({ success: false, error: "Worker ID is required" });
      return;
    }
    if (!password || !password.trim()) {
      res.status(400).json({ success: false, error: "Password is required" });
      return;
    }

    const worker = await prisma.worker.findUnique({
      where: { id: id.trim() },
    });

    if (!worker || worker.password !== password.trim()) {
      res.status(401).json({ success: false, error: "Invalid Worker ID or Password" });
      return;
    }

    res.json({
      success: true,
      message: "Sign in successful",
      worker: {
        id: worker.id,
        name: worker.name,
        hospitalId: worker.hospitalId,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Sign in failed" });
  }
});

export default router;
