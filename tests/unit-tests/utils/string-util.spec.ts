import "jest"
import { commonStart } from "../../../src/utils/string-util"

describe("test strings common start", () => {
  it("empty strings return empty string", () => {
    expect(commonStart("", "")).toBe("")
  })
  it("identical strings return same string", () => {
    expect(commonStart("aaa", "aaa")).toBe("aaa")
  })
  it("identical strings return same string", () => {
    expect(commonStart("aba", "abd")).toBe("ab")
  })
  it("identical strings return same string", () => {
    expect(commonStart("", "abd")).toBe("")
  })
})
