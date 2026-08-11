import express, { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { validateUserData } from "../middleware/validation";

const router = express.Router();

router.post("/", validateUserData, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.create({
      data: req.body,
    });
    res.status(201).json({ success: true, message: "User saved", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to save user" });
  }
});

router.get("/", async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
});

router.get("/search/:query", async (req: Request, res: Response) => {
  try {
    const { query } = req.params;
    const users = await prisma.user.findMany({
      where: {
        name: {
          contains: query,
        },
      },
    });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to search users" });
  }
});

router.put("/:id", validateUserData, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });
    res.json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update user" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({
      where: { id },
    });
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete user" });
  }
});

export default router;
