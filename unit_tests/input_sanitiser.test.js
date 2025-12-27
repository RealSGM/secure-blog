const { expect } = require("chai");

const {
  xssSanitise,
  stripHTMLTags,
  stripHTMLTagsAndTrim,
  normaliseEmail,
  replaceNewlines,
  reconvertSpecialLines,
  removeSpecialNewlines,
} = require("../src/config/input-sanitiser");

describe("Input Sanitisation Functions", () => {
  it("xssSanitise should remove malicious script tags", () => {
    const input = `<script>alert('XSS')</script>hello`;
    const output = xssSanitise(input);
    expect(output).to.not.include("<script>");
    expect(output).to.include("hello");
  });

  it("stripHTMLTags should remove all HTML tags", () => {
    const input = "<div>Hello <b>World</b></div>";
    const output = stripHTMLTags(input);
    expect(output).to.equal("Hello World");
  });

  it("stripHTMLTagsAndTrim should remove HTML and trim whitespace", () => {
    const input = "   <p>Hello</p>   ";
    const output = stripHTMLTagsAndTrim(input);
    expect(output).to.equal("Hello");
  });

  it("normaliseEmail should lowercase and remove dots (gmail-style)", () => {
    const input = "My.Email+tag@Gmail.com";
    const output = normaliseEmail(input);
    expect(output).to.equal("myemail@gmail.com");
  });

  it("replaceNewlines should convert \\n to %n", () => {
    const input = "Line 1\nLine 2";
    const output = replaceNewlines(input);
    expect(output).to.equal("Line 1%nLine 2");
  });

  it("reconvertSpecialLines should convert %n back to \\n", () => {
    const input = "Line 1%nLine 2";
    const output = reconvertSpecialLines(input);
    expect(output).to.equal("Line 1\nLine 2");
  });

  it("removeSpecialNewlines should remove all %n", () => {
    const input = "Line 1%nLine 2%n";
    const output = removeSpecialNewlines(input);
    expect(output).to.equal("Line 1Line 2");
  });
});
