import { render, screen as queryScreen, waitFor } from "@testing-library/react-native";
import { Text as RNText } from "react-native";
import { AuthProvider, useAuth, useProtectedRoute } from "../../lib/useAuth";

const mockReplace = jest.fn();
let mockSegments: string[] = ["(tabs)"];
let mockSession: object | null = null;
let mockSessionError: Error | null = null;
const mockGetSession = jest.fn(async () => {
  if (mockSessionError) throw mockSessionError;
  return { data: { session: mockSession } };
});

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSegments: () => mockSegments,
}));

jest.mock("../../config/env", () => ({ isBackendConfigured: true }));

jest.mock("../../lib/supabase", () => ({
  getSupabase: () => ({
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      signOut: jest.fn(async () => ({ error: null })),
    },
  }),
}));

jest.mock("../../data/useData", () => ({ setRepositoryMode: jest.fn(async () => undefined) }));

function AuthProbe() {
  useProtectedRoute();
  const { status } = useAuth();
  return <RNText>{status}</RNText>;
}

describe("authenticated route gate", () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockSegments = ["(tabs)"];
    mockSession = null;
    mockSessionError = null;
    mockGetSession.mockClear();
  });

  it("redirects a signed-out user from protected routes to sign-in", async () => {
    await render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => expect(queryScreen.getByText("signedOut")).toBeTruthy());
    expect(mockReplace).toHaveBeenCalledWith("/sign-in");
  });

  it("redirects an authenticated user out of the auth group", async () => {
    mockSession = { user: { id: "user-1" } };
    mockSegments = ["(auth)"];

    await render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => expect(queryScreen.getByText("signedIn")).toBeTruthy());
    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  it("surfaces session restoration failures as retryable auth state", async () => {
    mockSessionError = new Error("offline");

    await render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => expect(queryScreen.getByText("error")).toBeTruthy());
    expect(mockGetSession).toHaveBeenCalledTimes(1);
  });
});
