import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfirmDialog from "../src/components/common/ConfirmDialog";
import PasswordStrength from "../src/components/common/PasswordStrength";
import { UserAvatar, UserAvatarStack, getInitials } from "../src/components/common/UserAvatar";
import {
  applyThemePreference,
  getStoredThemePreference,
  saveThemePreference,
  THEME_VALUES,
  watchSystemThemePreference
} from "../src/lib/themePreference";

test("password strength reports low, medium, and strong passwords", () => {
  const { rerender } = render(<PasswordStrength password="abc" />);
  expect(document.querySelector("[data-strength='low']")).toBeInTheDocument();

  rerender(<PasswordStrength password="longpassword" />);
  expect(document.querySelector("[data-strength='medium']")).toBeInTheDocument();

  rerender(<PasswordStrength password="StrongPass123!" />);
  expect(document.querySelector("[data-strength='strong']")).toBeInTheDocument();
  expect(screen.getByRole("tooltip")).toHaveTextContent("8 or more characters");
});

test("password strength is hidden when the field is empty", () => {
  const { container } = render(<PasswordStrength password="" />);
  expect(container).toBeEmptyDOMElement();
});

test("avatar initials handle names, email addresses, and empty values", () => {
  expect(getInitials("Ada Lovelace Byron")).toBe("AL");
  expect(getInitials("ada.lovelace@example.test")).toBe("AL");
  expect(getInitials()).toBe("");
  render(<UserAvatar user={{ email: "ada.lovelace@example.test" }} />);
  expect(screen.getByLabelText("ada.lovelace@example.test")).toHaveTextContent("AL");
});

test("avatar stack limits visible users and labels the remaining count", () => {
  render(
    <UserAvatarStack
      max={2}
      users={[{ name: "Ada Lovelace" }, { name: "Grace Hopper" }, { name: "Katherine Johnson" }]}
    />
  );
  expect(screen.getByLabelText("Ada Lovelace")).toBeInTheDocument();
  expect(screen.getByLabelText("Grace Hopper")).toBeInTheDocument();
  expect(screen.queryByLabelText("Katherine Johnson")).not.toBeInTheDocument();
  expect(screen.getByTitle("1 more active collaborator")).toHaveTextContent("+1");
});

test("confirm dialog calls the selected action and disables buttons while confirming", async () => {
  const ui = userEvent.setup();
  const onCancel = jest.fn();
  const onConfirm = jest.fn();
  const { rerender } = render(
    <ConfirmDialog
      title="Delete item?"
      description="This cannot be undone."
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
  expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
  expect(screen.getByText("This cannot be undone.")).toBeVisible();
  await ui.click(screen.getByRole("button", { name: "No" }));
  expect(onCancel).toHaveBeenCalledTimes(1);

  rerender(
    <ConfirmDialog
      title="Delete item?"
      isConfirming
      onCancel={onCancel}
      onConfirm={onConfirm}
      confirmLabel="Delete"
    />
  );
  expect(screen.getByRole("button", { name: "Working..." })).toBeDisabled();
  expect(screen.getByRole("button", { name: "No" })).toBeDisabled();
  await ui.click(screen.getByRole("button", { name: "Working..." }));
  expect(onConfirm).not.toHaveBeenCalled();
});

test("theme preferences default safely, normalize invalid values, and persist valid values", () => {
  expect(getStoredThemePreference()).toBe(THEME_VALUES.SYSTEM);
  expect(saveThemePreference("neon")).toBe(THEME_VALUES.SYSTEM);
  expect(window.localStorage.getItem("gencontent-theme-preference")).toBe("system");

  window.matchMedia = jest.fn().mockReturnValue({ matches: true });
  expect(saveThemePreference(THEME_VALUES.SYSTEM)).toBe(THEME_VALUES.SYSTEM);
  expect(document.documentElement.dataset).toMatchObject({ theme: "system", activeTheme: "dark" });
  expect(document.documentElement.style.colorScheme).toBe("dark");

  expect(saveThemePreference(THEME_VALUES.LIGHT)).toBe(THEME_VALUES.LIGHT);
  expect(getStoredThemePreference()).toBe(THEME_VALUES.LIGHT);
  expect(document.documentElement.dataset.activeTheme).toBe("light");
});

test("system theme watcher applies changes and removes its listener", () => {
  const onChange = jest.fn();
  const listener = jest.fn();
  const removeListener = jest.fn();
  window.matchMedia = jest.fn().mockReturnValue({
    matches: true,
    addEventListener: (event, callback) => listener(event, callback),
    removeEventListener: removeListener
  });

  const stopWatching = watchSystemThemePreference(THEME_VALUES.SYSTEM, onChange);
  const handler = listener.mock.calls[0][1];
  handler();
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(document.documentElement.dataset.activeTheme).toBe("dark");
  stopWatching();
  expect(removeListener).toHaveBeenCalledWith("change", handler);

  const noOpCleanup = watchSystemThemePreference(THEME_VALUES.DARK, onChange);
  noOpCleanup();
  expect(listener).toHaveBeenCalledTimes(1);
});

test("applyThemePreference resolves system preference using the current media setting", () => {
  window.matchMedia = jest.fn().mockReturnValue({ matches: false });
  applyThemePreference(THEME_VALUES.SYSTEM);
  expect(document.documentElement.dataset).toMatchObject({ theme: "system", activeTheme: "light" });
});
