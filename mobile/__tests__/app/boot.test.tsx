import { render, screen as queryScreen } from "@testing-library/react-native";
import type { ReactElement } from "react";
import { ErrorBoundaryClass } from "../../components/ErrorBoundary";

function BrokenChild(): ReactElement {
  throw new Error("boot failed");
}

describe("root boot recovery", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders a recoverable error surface without provider dependencies", async () => {
    await render(
      <ErrorBoundaryClass>
        <BrokenChild />
      </ErrorBoundaryClass>,
    );

    expect(queryScreen.getByText("Something went wrong")).toBeTruthy();
    expect(queryScreen.getByText("Try again")).toBeTruthy();
  });
});
