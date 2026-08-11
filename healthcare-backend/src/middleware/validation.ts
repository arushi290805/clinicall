import { Request, Response, NextFunction } from "express";

export function validateUserData(req: Request, res: Response, next: NextFunction): void {
  const { name, age, gender, contactNumber, symptoms, medication } = req.body;

  const isInvalid = (field: any) =>
    field === undefined || field === null || String(field).trim() === "";

  if (
    isInvalid(name) ||
    isInvalid(age) ||
    isInvalid(gender) ||
    isInvalid(contactNumber) ||
    isInvalid(symptoms) ||
    isInvalid(medication)
  ) {
    res.status(400).json({ error: "Invalid data" });
    return;
  }

  // Ensure age and contactNumber are strings as required by database schema
  req.body.age = String(age);
  req.body.contactNumber = String(contactNumber);

  next();
}

