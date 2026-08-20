import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "./Login";

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

describe("Login Page (Clinic Worker)", () => {
  beforeEach(() => {
    navigate.mockReset();
    sessionStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method || "GET";

        if (url.includes("/api/workers/signin") && method === "POST") {
          const body = JSON.parse(String(init?.body || "{}"));
          if (body.id === "invalid-id") {
            return {
              ok: false,
              status: 401,
              json: async () => ({ success: false, error: "Invalid Worker ID or Password" }),
            } as Response;
          }
          return {
            ok: true,
            json: async () => ({
              success: true,
              worker: { id: "worker-123", name: "Dr. Alice", hospitalId: "HOSP-01" },
            }),
          } as Response;
        }

        if (url.includes("/api/workers/signup") && method === "POST") {
          return {
            ok: true,
            status: 201,
            json: async () => ({
              success: true,
              worker: { id: "generated-uuid-456", name: "Dr. Bob", hospitalId: "HOSP-02" },
            }),
          } as Response;
        }

        return { ok: false, status: 400, json: async () => ({}) } as Response;
      })
    );
  });

  it("renders Sign In mode by default", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByRole("tab", { name: /Sign In/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByPlaceholderText(/Enter your Worker ID/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter Password/i)).toBeInTheDocument();
  });

  it("switches to Sign Up tab", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const signUpTab = screen.getByRole("tab", { name: /Sign Up/i });
    fireEvent.click(signUpTab);

    expect(signUpTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByPlaceholderText(/e\.g\. Dr\. Jane Smith/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. HOSP-NY-102/i)).toBeInTheDocument();
  });

  it("shows validation error on empty Sign In submit", async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole("button", { name: /Sign In/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Worker ID is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/Password is required/i)).toBeInTheDocument();
  });

  it("shows validation error on invalid Sign Up submit", async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("tab", { name: /Sign Up/i }));

    const submitBtn = screen.getByRole("button", { name: /Register & Generate ID/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Full Name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/Hospital ID is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/Password is required/i)).toBeInTheDocument();
  });

  it("successfully signs in a worker and navigates to dashboard", async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter your Worker ID/i), {
      target: { value: "worker-123" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter Password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Sign In/i }));

    await waitFor(() => {
      expect(sessionStorage.getItem("workerId")).toBe("worker-123");
      expect(sessionStorage.getItem("workerName")).toBe("Dr. Alice");
      expect(navigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows error alert on invalid credentials", async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter your Worker ID/i), {
      target: { value: "invalid-id" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter Password/i), {
      target: { value: "wrongpass" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Sign In/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Invalid Worker ID or Password/i);
  });

  it("successfully registers a new worker and displays their generated ID", async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("tab", { name: /Sign Up/i }));

    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Dr\. Jane Smith/i), {
      target: { value: "Dr. Bob" },
    });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. HOSP-NY-102/i), {
      target: { value: "HOSP-02" },
    });
    fireEvent.change(screen.getByPlaceholderText(/At least 6 characters/i), {
      target: { value: "secret123" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Re-enter password/i), {
      target: { value: "secret123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Register & Generate ID/i }));

    expect(await screen.findByText(/Account created successfully/i)).toBeInTheDocument();
    expect(await screen.findByText(/generated-uuid-456/i)).toBeInTheDocument();
  });
});
