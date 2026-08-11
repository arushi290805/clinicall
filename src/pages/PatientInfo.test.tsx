import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PatientInfo from "../pages/PatientInfo";

describe("PatientInfo", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows validation errors for invalid age and contact", async () => {
    render(
      <MemoryRouter>
        <PatientInfo />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("Name"), {
      target: { name: "name", value: "Ada" },
    });
    fireEvent.change(screen.getByPlaceholderText("Age"), {
      target: { name: "age", value: "0" },
    });
    fireEvent.change(screen.getByRole("combobox"), {
      target: { name: "gender", value: "Female" },
    });
    fireEvent.change(screen.getByPlaceholderText("ContactNumber"), {
      target: { name: "contactNumber", value: "123" },
    });
    fireEvent.change(screen.getByPlaceholderText("Symptoms"), {
      target: { name: "symptoms", value: "Cough" },
    });
    fireEvent.change(screen.getByPlaceholderText("Medication"), {
      target: { name: "medication", value: "None" },
    });

    fireEvent.click(screen.getByText("SUBMIT"));

    expect(await screen.findByText(/Age must be > 0/i)).toBeInTheDocument();
    expect(screen.getByText(/Contact number must be 9 or 10 digits/i)).toBeInTheDocument();
  });
});
