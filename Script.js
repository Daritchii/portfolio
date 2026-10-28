
// 1. Set the current year in the footer
const yearElement = document.querySelector("#year");
yearElement.textContent = new Date().getFullYear();

// 2. Select the mobile menu controls
const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".nav-links");

// 3. Open or close the mobile navigation
menuButton.addEventListener("click", () => {
  const isOpen = navigation.classList.toggle("open");

  menuButton.setAttribute("aria-expanded", isOpen);
  menuButton.textContent = isOpen ? "Close" : "Menu";
});

// 4. Close the menu after a navigation link is selected
navigation.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navigation.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.textContent = "Menu";
  });
});
