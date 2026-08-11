import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const doctors = [
  { name: "Dr. Smith", specialty: "Cardiology" },
  { name: "Dr. Jane", specialty: "Neurology" },
  { name: "Dr. Kim", specialty: "Pediatrics" },
];

async function main() {
  for (const doctor of doctors) {
    const existing = await prisma.doctor.findFirst({
      where: { name: doctor.name, specialty: doctor.specialty },
    });
    if (!existing) {
      await prisma.doctor.create({ data: doctor });
    }
  }
  console.log("Seeded doctors:", doctors.map((d) => d.name).join(", "));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
