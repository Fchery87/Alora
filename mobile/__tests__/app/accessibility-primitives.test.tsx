import { render, screen as queryScreen } from "@testing-library/react-native";
import { ThemeProvider } from "../../theme/ThemeProvider";
import { ChoiceChip, PrimaryButton, SecondaryButton } from "../../components/buttons";

describe("shared accessibility primitives", () => {
  it("exposes action labels and button roles", async () => {
    await render(
      <ThemeProvider>
        <PrimaryButton label="Save" onPress={() => undefined} />
        <SecondaryButton label="Cancel" onPress={() => undefined} />
        <ChoiceChip label="Bottle" selected onPress={() => undefined} />
      </ThemeProvider>,
    );

    expect(queryScreen.getByRole("button", { name: "Save" })).toBeTruthy();
    expect(queryScreen.getByRole("button", { name: "Cancel" })).toBeTruthy();
    expect(queryScreen.getByRole("button", { name: "Bottle" })).toBeTruthy();
  });
});
