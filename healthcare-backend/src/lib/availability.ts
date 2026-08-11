import { prisma } from "./prisma";

const SLOT_MS = 30 * 60 * 1000;

export async function isDoctorAvailable(
  doctorId: string,
  scheduledAt: Date,
  excludeAppointmentId?: string
): Promise<boolean> {
  const start = new Date(scheduledAt.getTime() - SLOT_MS + 1);
  const end = new Date(scheduledAt.getTime() + SLOT_MS - 1);

  const conflict = await prisma.appointment.findFirst({
    where: {
      doctorId,
      status: "SCHEDULED",
      scheduledAt: { gte: start, lte: end },
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
    },
  });

  return !conflict;
}
