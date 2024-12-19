const socket = io();

// Elements
const soldierNameInput = document.getElementById("soldier-name");
const submitButton = document.getElementById("submit-name");
const deviceList = document.getElementById("device-list"); // Device List Panel

// Variables to store the soldier's name and markers
let soldierName = "";
const markers = {};

// Handle name submission
submitButton.addEventListener("click", () => {
  soldierName = soldierNameInput.value.trim();
  if (soldierName === "") {
    alert("Please enter a soldier's name.");
    return;
  }
  alert(`Soldier's name "${soldierName}" added.`);
});

// Initialize the map
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
];

// Function to randomly select an icon from the iconSet
const getRandomIcon = () => {
  return iconSet[Math.floor(Math.random() * iconSet.length)];
};

// Track location and send to the server
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
      timeout: 2500,
    }
  );
}

// Function to update the device list
const updateDeviceList = () => {
  deviceList.innerHTML = ""; // Clear the list
  Object.keys(markers).forEach((id) => {
    const marker = markers[id];
    const { latitude, longitude, soldierName } = marker.deviceData;

    // Create a new list item for the device
    const listItem = document.createElement("li");
    listItem.textContent = `Name: ${soldierName || "Unknown Soldier"}, 
                            Lat: ${latitude.toFixed(5)}, 
                            Lon: ${longitude.toFixed(5)}`;
    deviceList.appendChild(listItem);
  });
};

// Receive location updates from the server
socket.on("recive-location", (data) => {
  const { id, latitude, longitude, soldierName } = data;

  // Update the map view to center on the received location
  map.setView([latitude, longitude], 15);

  if (markers[id]) {
    // Update the existing marker's position and tooltip content
    markers[id].setLatLng([latitude, longitude]);
    if (markers[id].getTooltip()) {
      markers[id].getTooltip().setContent(soldierName || "Unknown Soldier");
    } else {
      markers[id].bindTooltip(soldierName || "Unknown Soldier", {
        permanent: true,
        direction: "top",
      });
    }
    // Update stored data for the marker
    markers[id].deviceData = { id, latitude, longitude, soldierName };
  } else {
    // Create a new marker if it doesn't already exist
    markers[id] = L.marker([latitude, longitude], {
      icon: getRandomIcon(),
      title: soldierName || "Unknown Soldier",
    })
      .addTo(map)
      .bindTooltip(soldierName || "Unknown Soldier", {
        permanent: true,
        direction: "top",
      });

    // Store marker data for the new device
    markers[id].deviceData = { id, latitude, longitude, soldierName };
  }

  // Update the device list panel
  updateDeviceList();
});

// Remove marker when a user disconnects
socket.on("user-disconnected", (id) => {
  if (markers[id]) {
    map.removeLayer(markers[id]);
    delete markers[id];
    console.log("User disconnected:", id);

    // Update the device list panel
    updateDeviceList();
  }
});
