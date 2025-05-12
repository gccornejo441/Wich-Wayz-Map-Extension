export async function submitNewShop(formData) {
  try {
    const response = await fetch("https://*/api/submitNewShop", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to submit shop");
    }

    return await response.json();
  } catch (err) {
    console.error("Submission failed:", err);
    throw err;
  }
}
