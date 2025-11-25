function search() {
    const query = document.getElementById("searchInput").value;

    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = `<p>You searched for: <strong>${query}</strong></p>`;
}
