function search() {
    const query = document.getElementById("searchInput").value;

    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";

    const sampleResults = [
        { name: "City Hospital", distance: "2 km away" },
        { name: "Good Health Clinic", distance: "3.5 km away" },
        { name: "Community Pharmacy", distance: "500 m away" }
    ];

    resultsDiv.innerHTML += `<h2>Results for: <strong>${query}</strong></h2>`;

    sampleResults.forEach(item => {
        resultsDiv.innerHTML += `
            <div class="result-card">
                <h3>${item.name}</h3>
                <p>${item.distance}</p>
            </div>
        `;
    });
}
