import { describe, it, expect } from "vitest";
import { useInput } from "./useInput";

describe("useInput", () => {
  it("memakai string kosong sebagai nilai awal default", () => {
    const [value] = useInput();
    expect(value.value).toBe("");
  });

  it("memakai nilai awal yang diberikan", () => {
    const [value] = useInput("halo");
    expect(value.value).toBe("halo");
  });

  it("onChange membaca nilai dari event", () => {
    const [value, onChange] = useInput();
    onChange({ target: { value: "dari event" } });
    expect(value.value).toBe("dari event");
  });

  it("onChange menerima nilai langsung (bukan event)", () => {
    const [value, onChange] = useInput();
    onChange("nilai langsung");
    expect(value.value).toBe("nilai langsung");

    onChange(null);
    expect(value.value).toBeNull();
  });

  it("reset mengembalikan ke nilai awal", () => {
    const [value, onChange, reset] = useInput("awal");
    onChange("berubah");
    reset();
    expect(value.value).toBe("awal");
  });
});