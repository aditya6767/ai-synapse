// frontend/src/main.js
import './style.css'; // Import your CSS file

console.log("Hello from Vite! main.js loaded.");

// Example: Add some content to the page
const appDiv = document.querySelector('#app');
if (appDiv) {
  appDiv.innerHTML = `
    <h2>Vite Frontend is Connected!</h2>
    <p>This content is dynamically added by frontend/src/main.js.</p>
  `;
} else {
  console.error("Could not find #app element in the DOM.");
}

// If using React/Vue etc., initialize your app here