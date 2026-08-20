import { Request, Response, NextFunction } from "express";

export function validateUserData(req: Request, res: Response, next: NextFunction): void {
  const { name, age, gender, contactNumber, symptoms, medication } = req.body;

  const isInvalid = (field: any) =>
    field === undefined || field === null || String(field).trim() === "";

  if (
    isInvalid(name) ||
    isInvalid(age) ||
    isInvalid(gender) ||
    isInvalid(contactNumber)
  ) {
    res.status(400).json({ error: "Invalid data" });
    return;
  }

  // Ensure age and contactNumber are strings, default symptoms & medication if empty
  req.body.age = String(age);
  req.body.contactNumber = String(contactNumber);
  req.body.symptoms = isInvalid(symptoms) ? "None" : String(symptoms);
  req.body.medication = isInvalid(medication) ? "None" : String(medication);

  next();
}

