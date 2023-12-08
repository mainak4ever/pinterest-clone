function performSearch(searchTerm) {
  if (searchTerm.length > 2) {
    window.location.href = `/search?searchString=${encodeURIComponent(
      searchTerm
    )}`;
  }
}

function searchOnEnter(event) {
  if (event.key === "Enter") {
    console.log(event.key);
    const searchInput = event.target;
    const searchTerm = searchInput.value.trim();
    performSearch(searchTerm);
  }
}
