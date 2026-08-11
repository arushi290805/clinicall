import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DoctorPage from "../pages/DoctorPage";

const navigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

describe("DoctorPage", () => {
  beforeEach(() => {
    navigate.mockReset();
    sessionStorage.clear();
    sessionStorage.setItem("patientUserId", "user-1");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes("/api/doctors") && !init?.method) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              data: [{ id: "d1", name: "Dr. Smith", specialty: "Cardiology" }],
            }),
          } as Response;
        }
        if (url.includes("/api/appointments") && init?.method === "POST") {
          return {
            ok: true,
            json: async () => ({
              success: true,
              data: {
                id: "a1",
                scheduledAt: "2030-01-01T10:00:00.000Z",
                doctor: { name: "Dr. Smith", specialty: "Cardiology" },
                user: { name: "Ada" },
              },
            }),
          } as Response;
        }
        return { ok: false, json: async () => ({}) } as Response;
      })
    );
  });

  it("loads doctors and books an appointment", async () => {
    render(
      <MemoryRouter>
        <DoctorPage />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Dr. Smith/i)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/Dr. Smith/i));
    const datetime = screen.getByLabelText(/Appointment date and time/i);
    fireEvent.change(datetime, { target: { value: "2030-01-01T10:00" } });
    fireEvent.click(screen.getByRole("button", { name: /Confirm appointment/i }));

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/appointment", expect.any(Object));
    });
  });
});
