import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App";

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  })
);

describe("App Component", () => {
  test("renders CRUD title in navbar", () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.getByText("CRUD")).toBeInTheDocument();
  });

  test("renders Add User link", () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.getByText("Add User")).toBeInTheDocument();
  });
});
