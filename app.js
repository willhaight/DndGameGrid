// Import the functions you need from the Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getFirestore, setDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";
import { getStorage, ref, listAll, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAn4VF9q_ALn5nGHoL9BW3HRir1YeUrtco",
    authDomain: "dungeonapp-3f80a.firebaseapp.com",
    projectId: "dungeonapp-3f80a",
    storageBucket: "dungeonapp-3f80a.appspot.com",
    messagingSenderId: "532180053044",
    appId: "1:532180053044:web:8bf63c2be8f651010aee61"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

console.log('Firestore initialized');

// Load initial grid size and setup
async function initializeGrid() {
    const docRef = doc(db, 'gridData', 'gridMapData');

    try {
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            console.log('Document exists, updating grid.');
            const data = docSnap.data();
            await gridBuilder(data.gridSize[0], data.gridSize[1]);
            loadTileData(); // Load tile data after grid is built
        } else {
            console.log('Document does not exist.');
        }
    } catch (e) {
        console.error('Error fetching grid data: ', e);
    }
}

// Navbar handling
let navbar = document.getElementsByClassName('header')[0];

navbar.onclick = function () {
    navbar.classList.toggle('expanded');
    navbar.classList.toggle('shrunk');
    navbar.children[1].style.display = navbar.classList.contains('expanded') ? 'block' : 'none';
    navbar.children[2].style.display = navbar.classList.contains('expanded') ? 'block' : 'none';
};

// Exiting modal
document.getElementById('exitButton').onclick = function () {
    document.getElementById('characterList').innerHTML = "";
    document.getElementById('abilityList').innerHTML = "";
    document.getElementById('expandedCard').innerHTML = "";
    document.getElementById('modal').style.display = 'none'; // Close the modal after selection

    // Show the main content again
    document.querySelectorAll('.content').forEach(content => content.style.display = "flex");
};

// Creating a new grid
document.getElementById("gridCreator").onclick = async function () {
    if (confirm('Are you sure you want to create a new grid? The current grid will be reset.')) {
        document.getElementById('characterList').innerHTML = "";
        document.querySelectorAll('.content').forEach(content => content.style.display = "none");
        document.getElementById('modal').style.display = 'flex';

        document.getElementById('characterList').innerHTML = `
            <div class="list-item">10x10</div>
            <div class="list-item">15x15</div>
            <div class="list-item">20x20</div>
            <div class="list-item">25x25</div>
            <div class="list-item">30x30</div>
            <div class="list-item">40x40</div>
        `;

        document.querySelectorAll(".list-item").forEach(item => {
            item.onclick = function () {
                document.getElementById('gridField').innerHTML = "";
                const [rows, columns] = item.innerText.split("x").map(Number);
                gridBuilder(rows, columns).then(() => loadTileData()); // Load tile data after grid is built
            }
        });
    }
}

// Create or update grid document
async function updateGridDocument(x, y) {
    const docRef = doc(db, 'gridData', 'gridMapData');
    try {
        await setDoc(docRef, { gridSize: [x, y] });
        console.log('Grid document written with ID: ', 'gridMapData');
    } catch (e) {
        console.error('Error writing grid document: ', e);
    }
}

// Build the grid
async function gridBuilder(x, y) {
    let gridField = document.getElementById('gridField');

    for (let i = 0; i < x; i++) {
        let column = document.createElement('div');
        column.classList.add('gridColumns');
        gridField.appendChild(column);

        for (let j = 0; j < y; j++) {
            let row = document.createElement('div');
            row.classList.add('gridRows');
            row.onclick = function () { editTile(i, j); }; // Attach the event listener
            column.appendChild(row);
        }
    }

    document.getElementById('modal').style.display = 'none'; // Close the modal after selection
    document.querySelectorAll('.content').forEach(content => content.style.display = "flex"); // Show the main content again

    await updateGridDocument(x, y);
}

// Edit tile (add token or tile)
async function editTile(x, y) {
    let selectedTile = document.getElementsByClassName('gridColumns')[x].children[y];

    if (selectedTile.innerHTML) {
        selectedTile.innerHTML = "";
    } else {
        selectedTile.innerHTML = `
            <p class="tileSelector">+Tile</p>
            <p class="tokenSelector">+Token</p>
        `;

        // Wait until the DOM is updated before attaching event listeners
        setTimeout(() => {
            selectedTile.querySelector('.tileSelector').onclick = () => {
                showTileSelection(x, y);
            };

            selectedTile.querySelector('.tokenSelector').onclick = () => {
                showTokenSelection(x, y);
            };
        }, 0); // Ensure the DOM is updated before accessing child elements
    }
}

// Show tile selection modal
async function showTileSelection(x, y) {
    document.getElementById('characterList').innerHTML = ""; // Clear existing content
    document.querySelectorAll('.content').forEach(content => content.style.display = "none");
    document.getElementById('modal').style.display = 'flex';

    const listRef = ref(storage, 'tiles/');
    try {
        const res = await listAll(listRef);
        res.items.forEach((itemRef) => {
            let listItem = document.createElement('div');
            listItem.textContent = itemRef.name;
            listItem.classList.add('list-item');
            document.getElementById('characterList').appendChild(listItem);

            listItem.onclick = async function () {
                try {
                    const imageURL = await getDownloadURL(itemRef);
                    setTileBackground(x, y, imageURL);
                } catch (error) {
                    console.error('Error getting image URL:', error);
                }
            };
        });
    } catch (error) {
        console.error('Error listing files:', error);
    }
}

// Show token selection modal
async function showTokenSelection(x, y) {
    document.getElementById('characterList').innerHTML = ""; // Clear existing content
    document.querySelectorAll('.content').forEach(content => content.style.display = "none");
    document.getElementById('modal').style.display = 'flex';

    const listRef = ref(storage, 'tokens/');
    try {
        const res = await listAll(listRef);
        res.items.forEach((itemRef) => {
            let listItem = document.createElement('div');
            listItem.textContent = itemRef.name;
            listItem.classList.add('list-item');
            document.getElementById('characterList').appendChild(listItem);

            listItem.onclick = async function () {
                try {
                    const imageURL = await getDownloadURL(itemRef);
                    setTileBackground(x, y, imageURL);
                } catch (error) {
                    console.error('Error getting image URL:', error);
                }
            };
        });
    } catch (error) {
        console.error('Error listing files:', error);
    }
}

// Set background image and save tile data
async function setTileBackground(x, y, imageURL) {
    let selectedTile = document.getElementsByClassName('gridColumns')[x].children[y];

    if (selectedTile) {
        selectedTile.style.backgroundImage = `url(${imageURL})`;
        selectedTile.style.backgroundSize = 'cover';
        selectedTile.style.backgroundPosition = 'center';

        document.getElementById('modal').style.display = 'none'; // Close modal after selection
        document.querySelectorAll('.content').forEach(content => content.style.display = "flex"); // Show the main content again

        // Save tile data to Firestore
        await saveTileData(x, y, imageURL);
    } else {
        console.error(`Tile at coordinates (${x}, ${y}) not found.`);
    }
}

// Save tile data to Firestore
async function saveTileData(x, y, imageURL) {
    const docRef = doc(db, 'gridData', 'savedTiles');
    try {
        const docSnap = await getDoc(docRef);
        const tilesData = docSnap.exists() ? docSnap.data() : {};
        tilesData[`${x}-${y}`] = { imageURL };

        await setDoc(docRef, tilesData);
        console.log('Tile data saved.');
    } catch (e) {
        console.error('Error saving tile data: ', e);
    }
}

// Load tile data from Firestore
async function loadTileData() {
    const docRef = doc(db, 'gridData', 'savedTiles');
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const tilesData = docSnap.data();
            for (const [key, value] of Object.entries(tilesData)) {
                const [x, y] = key.split('-').map(Number);
                const selectedTile = document.getElementsByClassName('gridColumns')[x]?.children[y];

                if (selectedTile) {
                    selectedTile.style.backgroundImage = `url(${value.imageURL})`;
                    selectedTile.style.backgroundSize = 'cover';
                    selectedTile.style.backgroundPosition = 'center';
                } else {
                    console.error(`Tile at coordinates (${x}, ${y}) not found.`);
                }
            }
            console.log('Tile data loaded.');
        } else {
            console.log('No tile data found.');
        }
    } catch (e) {
        console.error('Error loading tile data: ', e);
    }
}

// Initialize the grid on page load
initializeGrid();
