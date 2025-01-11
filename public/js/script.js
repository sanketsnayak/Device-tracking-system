const socket = io();


const soldierNameInput = document.getElementById("soldier-name");
const submitButton = document.getElementById("submit-name");
const deviceList = document.getElementById("device-list"); 
const geofenceButton = document.createElement("button");
const sosButton = document.createElement("button");


let soldierName = "";
const markers = {};
let geofence = { center: { latitude: 13.00992, longitude: 74.79316 }, radius: 500}; 



geofenceButton.id = "geofence-button";
document.getElementById("controls").appendChild(geofenceButton);
const svgContent=`Update Geofence <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-arrow-right"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="m12 16 4-4-4-4"/></svg>`
document.getElementById("geofence-button").innerHTML=svgContent

const emerSvg=`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-siren"><path d="M7 18v-6a5 5 0 1 1 10 0v6"/><path d="M5 21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z"/><path d="M21 12h1"/><path d="M18.5 4.5 18 5"/><path d="M2 12h1"/><path d="M12 2v1"/><path d="m4.929 4.929.707.707"/><path d="M12 12v6"/></svg> Emergency`
sosButton.id = "sos-button";
document.getElementById("controls").appendChild(sosButton);
document.getElementById("sos-button").innerHTML=emerSvg



submitButton.addEventListener("click", () => {
  soldierName = soldierNameInput.value.trim();
  if (soldierName === "") {
    alert("Please enter a soldier's name.");
    return;
  }
  alert(`Soldier's name "${soldierName}" added.`);
});


const map = L.map("map").setView([0, 0], 10);

// Add OpenStreetMap tiles
L.tileLayer("https://a.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

// Icon set for soldier markers
const iconSet = [
  L.icon({
    iconUrl: "/utils/soldier1.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    tooltipAnchor: [0, -32],
  }),
  L.icon({
    iconUrl: "/utils/soldier2.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    tooltipAnchor: [0, -32],
  }),
  L.icon({
    iconUrl: "/utils/soldier3.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    tooltipAnchor: [0, -32],
  }),
  L.icon({
    iconUrl: "/utils/soldier4.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    tooltipAnchor: [0, -32],
  }),
  L.icon({
    iconUrl: "/utils/soldier5.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    tooltipAnchor: [0, -32],
  }),
  L.icon({
    iconUrl: "/utils/soldier6.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    tooltipAnchor: [0, -32],
  }),
];

// Function to randomly select an icon from the iconSet
const getRandomIcon = () => {
  return iconSet[Math.floor(Math.random() * iconSet.length)];
};

// Geofence Visualization
const geofenceCircle = L.circle(
  [geofence.center.latitude, geofence.center.longitude],
  {
    radius: geofence.radius,
    color: "blue",
    fillColor: "rgba(0, 0, 255, 0.5)",
    fillOpacity: 0.2,
  }
).addTo(map);

// Function to check if a point is inside the geofence
const isInsideGeofence = (latitude, longitude) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371e3; // Earth's radius in meters
  const lat1 = toRad(geofence.center.latitude);
  const lat2 = toRad(latitude);
  const deltaLat = toRad(latitude - geofence.center.latitude);
  const deltaLon = toRad(longitude - geofence.center.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;
  return distance <= geofence.radius;
};

// Handle Geofence Update
geofenceButton.addEventListener("click", () => {
  const centerLat = parseFloat(prompt("Enter Geofence Center Latitude:"));
  const centerLon = parseFloat(prompt("Enter Geofence Center Longitude:"));
  const radius = parseInt(prompt("Enter Geofence Radius (in meters):"), 10);

  geofence = { center: { latitude: centerLat, longitude: centerLon }, radius };

  
  geofenceCircle.setLatLng([centerLat, centerLon]).setRadius(radius);
  alert("Geofence updated successfully!");
});


if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      socket.emit("send-location", { latitude, longitude, soldierName });
    },
    (error) => {
      console.error("Geolocation error:", error);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 200,
    }
  );
}


// Function to update the device list
const updateDeviceList = () => {
  deviceList.innerHTML = ""; // Clear the list to avoid duplicates
  Object.keys(markers).forEach((id) => {
    const marker = markers[id];
    const { latitude, longitude, soldierName } = marker.deviceData;

    // Create a new list item for the device
    const listItem = document.createElement("li");
    listItem.textContent = `Name: ${soldierName || "Unknown Soldier"}, 
                            Lat: ${latitude.toFixed(5)}, 
                            Lon: ${longitude.toFixed(5)}`;
    listItem.id = `device-${id}`; // Unique ID for the list item
    deviceList.appendChild(listItem);
  });
};


// Receive location updates from the server
socket.on("recive-location", (data) => {
  const { id, latitude, longitude, soldierName } = data;

  map.setView([latitude, longitude], 30);

  if (markers[id]) {
    // Update the marker's position
    markers[id].setLatLng([latitude, longitude]);
    markers[id].deviceData = { id, latitude, longitude, soldierName };

    // Update the tooltip content to reflect the latest soldier name
    markers[id].getTooltip()?.setContent(soldierName || "Unknown Soldier");
  } else {
    // Create a new marker if it doesn't exist
    markers[id] = L.marker([latitude, longitude], {
      icon: getRandomIcon(),
      title: soldierName || "Unknown Soldier",
    })
      .addTo(map)
      .bindTooltip(soldierName || "Unknown Soldier", {
        permanent: true,
        direction: "top",
      });

    // Store the marker's data
    markers[id].deviceData = { id, latitude, longitude, soldierName };
  }

  if (!isInsideGeofence(latitude, longitude)) {
    alert(`Geofence alert: ${soldierName} is out of bounds!`);
  }

  updateDeviceList();
});



// Handle SOS button click
sosButton.addEventListener("click", () => {
  if (!soldierName) {
    alert("Please enter a soldier's name before sending an Emergency.");
    return;
  }
  socket.emit("sos-signal", { soldierName });
  alert("Emergency signal sent!");
});

// Listen for SOS signal broadcast
socket.on("sos-signal-received", (data) => {
  const { id, soldierName } = data;

  if (markers[id]) {
    // Update the tooltip to indicate an emergency
    markers[id].bindTooltip(`Emergency: ${soldierName}`, {
      permanent: true,
      direction: "top",
      className: "blinking",
    }).openTooltip();

    // Highlight the marker with a red border
    markers[id].setIcon(
      L.icon({
        iconUrl: "/utils/sos.png",
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        tooltipAnchor: [0, -40],
      })
    );
  }

  // Highlight the corresponding device in the list
  const listItems = deviceList.querySelectorAll("li");
  listItems.forEach((item) => {
    if (item.textContent.includes(soldierName)) {
      item.style.backgroundColor = "red";
      item.style.color = "white";
      item.textContent = `${item.textContent} - Emergency!`;
    }
  });
});

// Variable to store historical paths for each soldier
const historicalPaths = {};


const updateHistoricalPath = (id, latitude, longitude) => {
  if (!historicalPaths[id]) {
    
    historicalPaths[id] = L.polyline([], { color: "blue" }).addTo(map);
  }
  
  historicalPaths[id].addLatLng([latitude, longitude]);
};


socket.on("recive-location", (data) => {
  const { id, latitude, longitude, soldierName } = data;

  map.setView([latitude, longitude], 30);

  if (markers[id]) {
    
    markers[id].setLatLng([latitude, longitude]);
    markers[id].deviceData = { id, latitude, longitude, soldierName };

    
    markers[id].getTooltip()?.setContent(soldierName || "Unknown Soldier");
  } else {
    
    markers[id] = L.marker([latitude, longitude], {
      icon: getRandomIcon(),
      title: soldierName || "Unknown Soldier",
    })
      .addTo(map)
      .bindTooltip(soldierName || "Unknown Soldier", {
        permanent: true,
        direction: "top",
      });

    
    markers[id].deviceData = { id, latitude, longitude, soldierName };
  }

  
  updateHistoricalPath(id, latitude, longitude);

  if (!isInsideGeofence(latitude, longitude)) {
    alert(`Geofence alert: ${soldierName} is out of bounds!`);
  }

  updateDeviceList();
});



