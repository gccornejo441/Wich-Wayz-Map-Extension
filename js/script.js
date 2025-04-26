document.addEventListener("DOMContentLoaded", () => {
  const phoneInput = document.getElementById("phoneInput");
  phoneInput.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 10) value = value.slice(0, 10);
    const parts = value.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    e.target.value = !parts[2]
      ? parts[1]
      : `(${parts[1]}) ${parts[2]}${parts[3] ? `-${parts[3]}` : ""}`;
  });

  loadCategories();

  const dropdownToggle = document.getElementById("dropdownToggle");
  const dropdownContainer = document.getElementById("categoriesDropdown");

  dropdownToggle.addEventListener("click", () => {
    if (dropdownContainer.style.display === "none") {
      dropdownContainer.style.display = "block";
    } else {
      dropdownContainer.style.display = "none";
    }
  });
});

async function loadCategories() {
  try {
    const res = await fetch("data/categories.json");
    const categories = await res.json();
    const container = document.getElementById("categoryCheckboxes");

    container.innerHTML = ""; // Clear loading

    categories.forEach(({ id, category_name }) => {
      const label = document.createElement("label");
      label.className = "msd_options_option";
      label.htmlFor = `category-${id}`;
      label.style.display = "block";
      label.style.padding = "5px";

      label.innerHTML = `
        ${category_name}
        <input 
          id="category-${id}" 
          type="checkbox" 
          name="categories" 
          value="${id}" 
          class="msd_options_checkbox">
      `;

      label.querySelector("input").addEventListener("change", (e) => {
        if (e.target.checked) {
          label.classList.add("msd_options_option-check");
        } else {
          label.classList.remove("msd_options_option-check");
        }
      });

      container.appendChild(label);
    });
  } catch (err) {
    console.error("Failed to load categories:", err);
    const container = document.getElementById("categoryCheckboxes");
    container.innerHTML = "<p style='color:red;'>Failed to load categories.</p>";
  }
}


async function prefillAddress() {
  const loading = document.getElementById("loading");
  const address = document.getElementById("addressInput").value.trim();

  if (!address) {
    alert("Please enter an address first.");
    return;
  }

  loading.style.display = "inline";

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&addressdetails=1&limit=1`);
    const data = await response.json();

    if (!data || data.length === 0) {
      alert("No address found.");
      return;
    }

    const result = data[0];
    const components = result.address;

    document.getElementById("house_number").value = components.house_number || "";
    document.getElementById("address_first").value = components.road || "";
    document.getElementById("address_second").value = "";
    document.getElementById("city").value = components.city || components.town || "";
    document.getElementById("state").value = components.state || "";
    document.getElementById("postcode").value = components.postcode || "";
    document.getElementById("country").value = components.country || "";
    document.getElementById("latitude").value = parseFloat(result.lat).toFixed(6);
    document.getElementById("longitude").value = parseFloat(result.lon).toFixed(6);
  } catch (error) {
    console.error("Failed to fetch address:", error);
    alert("Something went wrong while fetching the address.");
  } finally {
    loading.style.display = "none";
  }
}

