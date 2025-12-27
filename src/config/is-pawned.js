const crypto = require("crypto");

// Function to check if password has been exposed in breaches
// Uses the haveIBeenPwned API with k-anonymity (only sends the first 5 chars of the hashed password)
async function isPwned(password, fetchFn = fetch) {
  const hash = crypto.createHash("sha1").update(password).digest("hex").toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  try {
    const response = await fetchFn(`https://api.pwnedpasswords.com/range/${prefix}`);
    const text = await response.text();
    const lines = text.split("\n");

    for (const line of lines) {
      const [hashSuffix] = line.trim().split(":");
      if (hashSuffix === suffix) {
        return true;
      }
    }

    return false;
  } catch (error) {
    return false;
  }
}

module.exports = isPwned;