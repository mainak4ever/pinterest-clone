function performSearch(searchTerm) {
  if (searchTerm.length > 2) {
    window.location.href = `/search?searchString=${encodeURIComponent(
      searchTerm
    )}`;
  }
}

function searchOnEnter(event) {
  if (event.key === "Enter") {
    const searchInput = event.target;
    const searchTerm = searchInput.value.trim();
    performSearch(searchTerm);
  }
}

// // Handling window resize
// function handleResponsiveDesign() {
//   const screenWidth = window.innerWidth;

//   const header = document.querySelector(".header");
//   const navIcons = document.querySelector(".nav-icons");
//   const searchIcon = document.querySelector(".search-icon");
//   const searchBar = document.querySelector(".search-bar");
//   const dropdownBtn = document.querySelector(".dropbtn");
//   const dropdownContent = document.querySelector(".dropdown-content");

//   if (screenWidth < 800) {
//     // Clear existing content
//     header.innerHTML = "";

//     // Logo
//     const logo = document.createElement("a");
//     logo.href = "/";
//     const logoImg = document.createElement("img");
//     logoImg.src =
//       "https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/pinterest-round-color-icon.png";
//     logoImg.classList.add("icon", "pinterest-icon");
//     logo.appendChild(logoImg);
//     header.appendChild(logo);

//     // Search icon
//     const search = document.createElement("i");
//     search.classList.add("fa-solid", "fa-magnifying-glass", "search-icon");
//     search.addEventListener("click", function () {
//       searchBar.style.display =
//         searchBar.style.display === "none" ? "block" : "none";
//     });
//     header.appendChild(search);

//     // Search input
//     const searchInput = document.createElement("input");
//     searchInput.type = "text";
//     searchInput.placeholder = "Search";
//     searchInput.style.display = "none";
//     searchInput.addEventListener("keyup", function (event) {
//       if (event.key === "Enter") {
//         const searchTerm = searchInput.value.trim();
//         if (searchTerm.length > 2) {
//           window.location.href = `/search?searchString=${encodeURIComponent(
//             searchTerm
//           )}`;
//         }
//       }
//     });
//     header.appendChild(searchInput);

//     // Dropdown button
//     const dropdownBtnIcon = document.createElement("i");
//     dropdownBtnIcon.classList.add("fa-solid", "fa-chevron-down");
//     dropdownBtn.appendChild(dropdownBtnIcon);
//     header.appendChild(dropdownBtn);

//     // Dropdown content
//     const dropdownLinks = dropdownContent.querySelectorAll("a");
//     dropdownLinks.forEach((link) => {
//       const cloneLink = link.cloneNode(true);
//       dropdownContent.appendChild(cloneLink);
//     });
//   }
// }

// // Initial call and resize event listener
// handleResponsiveDesign();
// window.addEventListener("resize", handleResponsiveDesign);
