import { describe, it, expect } from "vitest";
import { renderWithProviders } from "../../../test-utils";
import NotFoundPage from "./NotFoundPage.vue";

describe("NotFoundPage", () => {
  it("menampilkan pesan 404 dan tautan kembali ke beranda", async () => {
    const { wrapper } = await renderWithProviders(NotFoundPage, {
      route: "/tidak-ada",
    });

    expect(wrapper.get('[data-testid="not-found-page"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("404");
    expect(wrapper.text()).toContain("Halaman tidak ditemukan");
    expect(wrapper.get('[data-testid="home-link"]').attributes("href")).toBe(
      "/"
    );
  });
});