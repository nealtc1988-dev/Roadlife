// RoadLife early map prototype. No verified place directory is connected yet.
const map = L.map('map', { scrollWheelZoom: true }).setView([39.5, -98.35], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const statusEl = document.getElementById('status');
const searchInput = document.getElementById('place-search');
let currentCategory = 'all';
let userMarker;

function setStatus(message) { statusEl.textContent = message; }

document.getElementById('locate-btn').addEventListener('click', () => {
  if (!navigator.geolocation) {
    setStatus('Location sharing is not available in this browser. You can search by city or ZIP code instead.');
    return;
  }
  setStatus('Requesting your location…');
  navigator.geolocation.getCurrentPosition(
    ({coords}) => {
      const point = [coords.latitude, coords.longitude];
      map.setView(point, 12);
      if (userMarker) userMarker.remove();
      userMarker = L.marker(point).addTo(map).bindPopup('Your approximate device location').openPopup();
      setStatus('Showing your device location. No location is stored by this prototype.');
    },
    () => setStatus('We could not access your location. Check browser permissions or search for a place.'),
    {enableHighAccuracy:false, timeout:10000, maximumAge:60000}
  );
});

// Geocoding uses the public Nominatim service. Use responsibly; production needs
// an approved provider, caching, and compliance with its usage policy.
async function searchPlace() {
  const query = searchInput.value.trim();
  if (!query) { setStatus('Enter a city, state, or ZIP code first.'); return; }
  setStatus('Searching for ' + query + '…');
  try {
    const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(query);
    const response = await fetch(url, {headers:{'Accept':'application/json'}});
    if (!response.ok) throw new Error('Search unavailable');
    const results = await response.json();
    if (!results.length) { setStatus('No matching place found. Try a nearby city or ZIP code.'); return; }
    const result = results[0];
    map.setView([Number(result.lat), Number(result.lon)], 11);
    setStatus('Map centered on ' + result.display_name + '. Nearby RoadLife listings are not connected yet.');
  } catch {
    setStatus('Place search is temporarily unavailable. You can still move around the map manually.');
  }
}
document.getElementById('search-btn').addEventListener('click', searchPlace);
searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') searchPlace(); });

document.querySelectorAll('.filter').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.filter').forEach(b => b.classList.remove('active'));
    button.classList.add('active');
    currentCategory = button.dataset.category;
    const labels = {
      all:'all categories', parking:'overnight parking', camping:'camping', showers:'showers',
      restrooms:'restrooms', help:'help and services'
    };
    setStatus('Filter selected: ' + labels[currentCategory] + '. Verified listings will appear here when the RoadLife directory is connected.');
  });
});

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
}
