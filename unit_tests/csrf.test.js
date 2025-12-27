const { expect } = require("chai");
const sinon = require("sinon");
const { csrfGenerate, csrfValidate } = require("../src/middleware/csrf");

describe("CSRF Middleware", () => {
  it("csrfGenerate should create CSRF token if not already in session", () => {
    const req = { session: {} };
    const res = { locals: {} };
    const next = sinon.spy();

    csrfGenerate(req, res, next);

    expect(req.session.csrfToken).to.be.a("string");
    expect(req.session.csrfToken.length).to.equal(64);
    expect(res.locals.csrfToken).to.equal(req.session.csrfToken);
    expect(next.calledOnce).to.be.true;
  });

  it("csrfGenerate should not overwrite existing CSRF token", () => {
    const existingToken = "existingtoken123";
    const req = { session: { csrfToken: existingToken } };
    const res = { locals: {} };
    const next = sinon.spy();

    csrfGenerate(req, res, next);

    expect(req.session.csrfToken).to.equal(existingToken);
    expect(res.locals.csrfToken).to.equal(existingToken);
    expect(next.calledOnce).to.be.true;
  });

  it("csrfValidate should pass if CSRF token matches", () => {
    const token = "securetoken123";
    const req = {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: { _csrf: token },
      session: { csrfToken: token },
    };
    const res = {};
    const next = sinon.spy();

    csrfValidate(req, res, next);

    expect(next.calledOnce).to.be.true;
  });

  it("csrfValidate should fail if CSRF token is missing or invalid", () => {
    const req = {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: { _csrf: "badtoken" },
      session: { csrfToken: "goodtoken" },
    };
    const res = { status: sinon.stub().returnsThis(), send: sinon.spy() };
    const next = sinon.spy();

    csrfValidate(req, res, next);

    expect(res.status.calledWith(403)).to.be.true;
    expect(res.send.calledWith("Invalid CSRF token")).to.be.true;
    expect(next.notCalled).to.be.true;
  });

  it("csrfValidate should skip check for multipart/form-data", () => {
    const req = {
      method: "POST",
      headers: { "content-type": "multipart/form-data; boundary=something" },
      body: {},
      session: {},
    };
    const res = {};
    const next = sinon.spy();

    csrfValidate(req, res, next);

    expect(next.calledOnce).to.be.true;
  });

  it("csrfValidate should skip check for non-POST requests", () => {
    const req = {
      method: "GET",
      headers: {},
      body: {},
      session: {},
    };
    const res = {};
    const next = sinon.spy();

    csrfValidate(req, res, next);

    expect(next.calledOnce).to.be.true;
  });
});
