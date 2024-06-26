// Function to dynamically change sidebar height based on open or closed buttons
function adjustSidebarHeight() {
    var sidebar = document.querySelector('.sidebar');
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var totalHeight = 375;

    for (var i = 0; i < dropdowns.length; i ++) {
        if (dropdowns[i].classList.contains('show')) {
            totalHeight += dropdowns[i].offsetHeight;
        }
    }

    sidebar.style.height = totalHeight + "px";
}


// Drop down menu
function toggleDropdown(dropdownId) {
    var dropdownContent = document.getElementById(dropdownId);
    var dropdownButton = dropdownContent.previousElementSibling;
    var icon = dropdownButton.querySelector(".icon")

    if (event.target === dropdownButton) {
        dropdownContent.classList.toggle("show");
        adjustSidebarHeight();

        if (dropdownContent.classList.contains("show")) {
            icon.innerHTML = "&#x25B2;";
        }
        else {
            icon.innerHTML = "&#x25BC;";
        }
    }
        
}


// Setting the catalog container based on how many catalog items the user wants to display 
function setCatalogContHeight() {
    const catalogContainer = document.querySelector('.catalog-container');
    const catalogItems = document.querySelectorAll('.catalog-item[style="display: flex;"]');
    const itemHeight = 280; // Height of each catalog item
    const minHeight = 260; // Minimum height of the catalog container

    const containerHeight = Math.max(minHeight, itemHeight * catalogItems.length);

    catalogContainer.style.height = containerHeight + 'px';
}

function updateItemsShownOnPage(limit) {
    const catalogItem = document.querySelectorAll('.catalog-item');

    catalogItem.forEach((item, index) => {
        if (index < limit) {
            item.style.display = 'flex';
        }
        else {
            item.style.display = 'none'
        }
    });
}

function loadMoreItems(limit) {
    const catalogItems = document.querySelectorAll('.catalog-item');
    const currItemCount = catalogItems.length;
    const totalItemCount = catalogItems.length;

    const remainingItems = totalItemCount - currItemCount;
    const itemsToShow = Math.min(remainingItems, limit - currItemCount);

    for (let i = currItemCount; i < currItemCount+itemsToShow; i++) {
        catalogItems[i].style.display = 'flex';
    }
    setCatalogContHeight();
}

updateItemsShownOnPage(3);

document.getElementById('limit-select').addEventListener('change', function() {
    const limit = parseInt(this.value);

    updateItemsShownOnPage(limit);
    loadMoreItems(limit);
    setCatalogContHeight();
});


// Backend functions

const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes.length > 0) {
        setCatalogContHeight();
      }
    });
});

observer.observe(document.querySelector('.catalog-container'), {
    childList: true
});

// Sending data to the backend for insertion and querying

const backendUrl = 'https://cougarchronicles.onrender.com'; 
const initialCatalogUrl = `${backendUrl}/initial-catalog`;
const catalogUrl = `${backendUrl}/catalog`;
const catalogHoldUrl = `${backendUrl}/catalog-hold`;
const getCurrentHoldsUrl = `${backendUrl}/get-current-holds`;

document.addEventListener('DOMContentLoaded', function() {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', initialCatalogUrl);

    xhr.onload = function() {
        if (xhr.status === 200) {
            const catalogResultsDiv = document.querySelector('.catalog-results');
            catalogResultsDiv.innerHTML = xhr.responseText;

            const limit = parseInt(document.getElementById('limit-select').value);
            updateItemsShownOnPage(limit);

            updateButtonStates();
        } 
    };
    xhr.send();
});

document.getElementById('search-btn').addEventListener('click', function(event) {
    event.preventDefault(); 
    searchCatalog(); 
}); 

document.getElementById('keyword').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        searchCatalog();
    }
});

document.addEventListener('click', function(event) {
    if (event.target.classList.contains('hold-btn')) {
        const isLoggedIn = localStorage.getItem('loggedIn');
        const currAvail = parseInt(event.target.closest('.catalog-item').querySelector('#currAvail').textContent);
        const medium = event.target.closest('.catalog-item').querySelector('#medium').textContent;
        const currHolds = event.target.closest('.catalog-item').querySelector('#currHolds');

        let itemId;

        if (medium == 'book') {
            itemId = event.target.closest('.catalog-item').querySelector('#isbn').textContent;
        }
        else if (medium == 'movie') {
            itemId = event.target.closest('.catalog-item').querySelector('#mov_asset_id').textContent;
        }
        else if (medium == 'device') {
            itemId = event.target.closest('.catalog-item').querySelector('#dev_asset_id').textContent;
        }

        
        if (parseInt(currAvail) == 0 && isLoggedIn === 'true') {
            const itemTitle = event.target.parentElement.parentElement.querySelector('.catalog-item-info h3').textContent;
            const memberId = localStorage.getItem('memberId');
            const xhr = new XMLHttpRequest();
            xhr.open('POST', catalogHoldUrl); 
            xhr.setRequestHeader('Content-Type', 'application/json');

            console.log('sending hold req');

            xhr.onload = function() {
                if (xhr.status === 200) {
                    const responseData = JSON.parse(xhr.responseText);
                    const button = event.target.closest('.hold-btn');
                    if (button) {
                        button.innerHTML = '<i class="uil uil-check"></i> Hold Placed';
                    }
                    currHolds.textContent = responseData.updatedHolds;
                } 
                else {
                    console.error('Error :', xhr.statusText);
                }
            };

            xhr.onerror = function() {
                console.error('Network error');
            };

            const data = JSON.stringify({ itemTitle: itemTitle, memberId: memberId });
            xhr.send(data);

        }
        else if (parseInt(currAvail) !== 0 && isLoggedIn === 'true') {
           const isAvailModal = document.getElementById('itemIsAvail');
           isAvailModal.style.display = 'block';
           const acceptBtn =  isAvailModal.querySelector('#accept-msg');
           acceptBtn.addEventListener('click', function() {
            isAvailModal.style.display = 'none';
           });
        }   
        else if (isLoggedIn === 'false') {
            console.log('landing HEREEEEE');
            const isAvailModal = document.getElementById('notLoggedIn');
            isAvailModal.style.display = 'block';
            const acceptBtn =  isAvailModal.querySelector('#accept-msg');
            acceptBtn.addEventListener('click', function() {
                isAvailModal.style.display = 'none';
            });
        }     
    }
});


// Event listener for locally gathering the items being checked out before inserting into
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('checkout-btn')) {
        const itemContainer = event.target.closest('.catalog-item'); 

        if (itemContainer) {
            const itemInfo = itemContainer.querySelector('.info');
            const itemAvailability = parseInt(event.target.closest('.catalog-item').querySelector('#currAvail').textContent);
            const itemType = itemInfo.querySelector('#medium').textContent.toLowerCase();
            
            const itemHtml = generateItemHtml(itemInfo, itemType);
            let chosenItems = JSON.parse(localStorage.getItem('chosenItems')) || [];

            if (itemAvailability > 0) {
                if (chosenItems.includes(itemHtml)) {
                  chosenItems = chosenItems.filter(item => item !== itemHtml);
                  event.target.textContent = 'Add to cart';
                  event.target.innerHTML = '';
                } 
                else {
                  chosenItems.push(itemHtml);
                  event.target.textContent = ' Added to cart';
                  const icon = document.createElement('i');
                  icon.className = "uil uil-check";
                  event.target.prepend(icon);
                }
                localStorage.setItem('chosenItems', JSON.stringify(chosenItems));
                updateButtonStates();
            }
            else {
                const modal = document.querySelector('#itemIsNotAvail');
                modal.style.display = 'block';
                const acceptBtn =  modal.querySelector('#accept-msg');
                acceptBtn.addEventListener('click', function() {
                modal.style.display = 'none';
                });
            } 
        }
        else {
            console.error('Error: Item container not found');
        }
    }
});



function updateButtonStates() {
    const chosenItems = JSON.parse(localStorage.getItem('chosenItems')) || [];
    const catalogItems = document.querySelectorAll('.catalog-item');
  
    if (chosenItems.length === 0) {
        catalogItems.forEach(item => {
          const checkoutBtn = item.querySelector('.checkout-btn');
          checkoutBtn.textContent = 'Add to cart';
          checkoutBtn.innerHTML = 'Add to checkout'; 
        });
    }
    else {
        catalogItems.forEach(item => {
            const checkoutBtn = item.querySelector('.checkout-btn');
            const itemInfo = item.querySelector('.info');
            const itemType = itemInfo.querySelector('#medium').textContent.toLowerCase();
            const itemHtml = generateItemHtml(itemInfo, itemType);
            
            if (chosenItems.includes(itemHtml)) {
                checkoutBtn.textContent = ' Added to cart';
                const icon = document.createElement('i');
                icon.className = "uil uil-check";
                checkoutBtn.prepend(icon);
            } 
            else {
                checkoutBtn.textContent = 'Add to cart';
                checkoutBtn.innerHTML = 'Add to checkout';
            }
        });
    }
}

function generateItemHtml(itemInfo, itemType) {
    let checkoutItemHtml = '<div class="transac-item">';
    checkoutItemHtml += '<div class="catalog-item-info">';
    const imgSrc = itemInfo.parentNode.querySelector('img').src;
    checkoutItemHtml += `<img src="${imgSrc}">`;
    checkoutItemHtml += `<div class="info">`;

    const title = itemInfo.querySelector('#title');
    if (title) {
        checkoutItemHtml += `<h3 id="title">${title.textContent}</h3>`;
    } 
    else {
        const model = itemInfo.querySelector('#model');
        checkoutItemHtml += `<h3 id="model">${model.textContent}</h3>`;
    }
    
    const author = itemInfo.querySelector('#author');
    if (author && itemType === 'book') {
        checkoutItemHtml += `<p>Author: <span id="author">${author.textContent}</span></p>`;
    }
    
    const director = itemInfo.querySelector('#director');
    if (director && itemType === 'movie') {
        checkoutItemHtml += `<p>Director: <span id="director">${director.textContent}</span></p>`;
    }
    
    const brand = itemInfo.querySelector('#brand');
    if (brand && itemType === 'device') {
        checkoutItemHtml += `<p>Brand: <span id="brand">${brand.textContent}</span></p>`;
    }
    
    checkoutItemHtml += `<p>Type: <span id="medium">${itemType.charAt(0).toUpperCase() + itemType.slice(1)}</span></p>`;
    
    const isbn = itemInfo.querySelector('#isbn');
    if (isbn && itemType === 'book') {
        checkoutItemHtml += `<p>ISBN: <span id="isbn">${isbn.textContent}</span></p>`;
    }
    
    const movieId = itemInfo.querySelector('#mov_asset_id');
    if (movieId && itemType === 'movie') {
        checkoutItemHtml += `<p>ID: <span id="movie-id">${movieId.textContent}</span></p>`;
    }
    
    const deviceId = itemInfo.querySelector('#dev_asset_id');
    if (deviceId && itemType === 'device') {
        checkoutItemHtml += `<p>ID: <span id="device_id">${deviceId.textContent}</span></p>`;
    }
    
    checkoutItemHtml += '</div></div>';
    checkoutItemHtml += '<button class="remove-btn"><i class="uil uil-trash-alt"></i>Remove</button></div>';
    
    return checkoutItemHtml;
}

function searchCatalog() {
    const keyword = document.getElementById('keyword').value;
    const searchBy = document.getElementById('search-by').value;
    const limitBy = document.getElementById('limit-by').value;
    const availabilityCheckbox = document.querySelector('#availability input[type="checkbox"]');
    const availability = availabilityCheckbox.checked ? 'on' : '';
    
    const selectedGenres = [];
    document.querySelectorAll('#bgenre input[type="checkbox"]:checked').forEach((checkbox) => {
        selectedGenres.push(checkbox.value);
    });  
    
    const selectedLang = [];
    document.querySelectorAll('#language input[type="checkbox"]:checked').forEach((checkbox) => {
        selectedLang.push(checkbox.value);
    });

    const selectedYears = [];
    document.querySelectorAll('#year-published input[type="checkbox"]:checked').forEach((checkbox) => {
        selectedYears.push(checkbox.value);
    });

    const selectedBrands = [];
    document.querySelectorAll('#brand input[type="checkbox"]:checked').forEach((checkbox) => {
        selectedBrands.push(checkbox.value);
    });
    
    const xhr = new XMLHttpRequest();
    xhr.open('POST', catalogUrl); 
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = function() {
        if (xhr.status === 200) {
            const catalogResultsDiv = document.querySelector('.catalog-results');
            catalogResultsDiv.innerHTML = xhr.responseText;

            const limit = parseInt(document.getElementById('limit-select').value);
            updateItemsShownOnPage(limit);
            updateButtonStates();
        } 
        else {
            console.error('Error:', xhr.statusText);
        }
    };

    xhr.onerror = function() {
        console.error('Network error');
    };

    const data = JSON.stringify({ 
        keyword: keyword, 
        searchBy: searchBy, 
        limitBy: limitBy,
        availability: availability,
        genres: selectedGenres,
        langs: selectedLang,
        years: selectedYears,
        brands: selectedBrands
    });

    xhr.send(data);
}