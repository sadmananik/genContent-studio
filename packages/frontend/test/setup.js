import "@testing-library/jest-dom";

jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams(window.location.search),
  usePathname: () => window.location.pathname
}));

export const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState({}, "", "/");
  window.matchMedia = jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }));
});
