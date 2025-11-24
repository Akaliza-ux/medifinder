document.getElementById('use-location').onclick = async () => {
  if (!navigator.geolocation) return alert('Geolocation not supported');
  navigator.geolocation.getCurrentPosition(pos => {
    document.getElementById('lat').value = pos.coords.latitude;
    document.getElementById('lon').value = pos.coords.longitude;
  }, err => alert('Could not get location: ' + err.message));
};

document.getElementById('search-places').onclick = async () => {
  const lat = document.getElementById('lat').value;
  const lon = document.getElementById('lon').value;
  if (!lat || !lon) return alert('Please enter lat & lon or use location');
  document.getElementById('places-result').innerText = 'Searching...';
  try {
    const res = await fetch(`/api/places?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    const places = json.places || [];
    if (places.length === 0) {
      document.getElementById('places-result').innerText = 'No places found within 5km.';
      return;
    }
    const list = document.createElement('ol');
    places.forEach(p => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${p.name}</strong> (${p.type || 'health'}) — ${p.distance_m}m`;
      list.appendChild(li);
    });
    const container = document.getElementById('places-result');
    container.innerHTML = '';
    container.appendChild(list);
  } catch (err) {
    document.getElementById('places-result').innerText = 'Error: ' + err.message;
  }
};

document.getElementById('searchDrug').onclick = async () => {
  const name = document.getElementById('drugName').value.trim();
  if (!name) return alert('Enter drug name');
  document.getElementById('drugResult').innerText = 'Looking up...';
  try {
    const res = await fetch(`/api/drug/${encodeURIComponent(name)}`);
    const json = await res.json();
    document.getElementById('drugResult').innerText = JSON.stringify(json, null, 2);
  } catch (err) {
    document.getElementById('drugResult').innerText = 'Error: ' + err.message;
  }
};
