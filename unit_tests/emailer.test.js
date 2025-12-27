const { expect } = require("chai");
const sinon = require("sinon");
const nodemailer = require("nodemailer");

const { sendResetEmail, send2FAEmail } = require("../src/config/emailer");

describe("Emailer Functions", () => {
  let createTransportStub;
  let sendMailStub;

  beforeEach(() => {
    sendMailStub = sinon.stub().callsFake((options, callback) => {
      callback(null, { response: "Mock Email Sent" });
    });

    createTransportStub = sinon.stub(nodemailer, "createTransport").returns({
      sendMail: sendMailStub,
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it("sendResetEmail should send a reset email with correct content", () => {
    const email = "user@example.com";
    const resetURL = "https://example.com/reset";

    sendResetEmail(email, resetURL);

    expect(createTransportStub.calledOnce).to.be.true;
    expect(sendMailStub.calledOnce).to.be.true;

    const mailOptions = sendMailStub.getCall(0).args[0];
    expect(mailOptions.to).to.equal(email);
    expect(mailOptions.subject).to.equal("Reset Password");
    expect(mailOptions.text).to.equal(resetURL);
  });

  it("send2FAEmail should send a 2FA code with correct formatting", () => {
    const email = "user@example.com";
    const code = "123456";

    send2FAEmail(email, code);

    expect(createTransportStub.calledOnce).to.be.true;
    expect(sendMailStub.calledOnce).to.be.true;

    const mailOptions = sendMailStub.getCall(0).args[0];
    expect(mailOptions.to).to.equal(email);
    expect(mailOptions.subject).to.equal("2FA Code");
    expect(mailOptions.text).to.include(code);
    expect(mailOptions.text).to.include("expire");
  });
});
