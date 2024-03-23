const fs = require('fs');
const mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'library-database-sytem.mysql.database.azure.com',
    user: 'lbrGuest',
    password: 'gu3st@cces$',
    database: 'librarydev'
});

connection.connect((err) => {
    if (err) throw err;
    console.log('Connected to LibraryDev database');
});

function createBookItem(item) {
    let bookHtml = '';
    bookHtml += `<img src="https://m.media-amazon.com/images/I/318nujF5v5L._SY445_SX342_.jpg">`;
    bookHtml += `<div class="info">`;
    bookHtml += `<h3 id = "title">${item.book_movie_title_model}</h3>`;
    bookHtml += `<p id="author-place">by <span id="author">${item.authors}</span></p>`;
    bookHtml += `<p>Type: <span id="medium">Book</span></p>`;
    bookHtml += `<p>ISBN <span id="isbn">${item.isbn}</span></p>`;
    bookHtml += `<p id="year-place">Year Published: <span id="yearPub">${item.year_released}</span></p>`;
    bookHtml += `<p>Current Holds: <span id="currHolds">${item.current_holds}</span></p>`;
    bookHtml += `<p>System availability: <span id="availableItems">${item.available_copies} (of ${item.total_copies})</span></p>`;
    bookHtml += `</div>`;
    return bookHtml;
}

function createMovieItem(item) {
    let movieHtml = '';
    movieHtml += `<img src="${item.image_address}">`;
    movieHtml += `<div class="info">`;
    movieHtml += `<h3 id = "title">${item.book_movie_title_model}</h3>`;
    movieHtml += `<p id="director-place">Director: <span id="director">${item.director_brand}</span></p>`;
    movieHtml += `<p>Type: <span id="medium">Movie</span></p>`;
    movieHtml += `<p>Rating: <span id="rating">${item.rating}</span></p>`;
    movieHtml += `<p id="year-place">Year Released: <span id="yearPub">${item.year_released}</span></p>`;
    movieHtml += `<p>Current Holds: <span id="currHolds">${item.current_holds}</span></p>`;
    movieHtml += `<p>System availability: <span id="availableItems">${item.available_copies} (of ${item.total_copies})</span></p>`;
    movieHtml += `</div>`;
    return movieHtml;
}

function createDeviceItem(item) {
    let deviceHtml = '';
    deviceHtml += `<img src="${item.image_address}">`;
    deviceHtml += `<div class="info">`;
    deviceHtml += `<h3 id = "title">${item.book_movie_title_model}</h3>`;
    deviceHtml += `<p id="brand-place">by <span id="director">${item.director_brand}</span></p>`;
    deviceHtml += `<p>Type: <span id="medium">Device</span></p>`;
    deviceHtml += `<p>Serial number: <span id="serial-num">${item.serial_number}</span></p>`;
    deviceHtml += `<p id="cond-place">Condition: <span id="condition">${item.asset_condition}</span></p>`;
    deviceHtml += `<p>Current Holds: <span id="currHolds">${item.current_holds}</span></p>`;
    deviceHtml += `<p>System availability: <span id="availableItems">${item.available_copies} (of ${item.total_copies})</span></p>`;
    deviceHtml += `</div>`;
    return deviceHtml;
}

function getInitialCatalogInfo(response) {
    const query = 'SELECT * FROM catalog_view LIMIT 4';

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error querying catalog data:', err);
            response.writeHead(500);
            response.end('Server error');
            return;
        }

        let catalogHtml = '';

        results.forEach(item => {
            catalogHtml += `<div class="catalog-item">`;

            catalogHtml += `<div class="catalog-item-info">`;
            if (item.asset_type === `book`) {
                catalogHtml += createBookItem(item);
            }
            else if (item.asset_type === `movie`) {
                catalogHtml += createMovieItem(item);
            }
            else if (item.asset_type === `device`) {
                catalogHtml += createDeviceItem(item);
            }
            catalogHtml += `</div>`;
            catalogHtml += `<div class="item-buttons">`;
            catalogHtml += `<button class="hold-btn">Place Hold</button>`;
            catalogHtml += `<button class="checkout-btn">Add to Checkout</button>`;
            catalogHtml += `</div>`;
            catalogHtml += `</div>`;
        });

        const initialCatalogHtml = fs.readFileSync('./front-end/catalog/catalog.html', 'utf8');
        const finalHtml = initialCatalogHtml.replace('<!--Catalog items-->', catalogHtml);

        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.end(finalHtml, 'utf-8');
    });
}

function getCatalogSearchWithRestrictions(response, keyword, searchBy, limitBy) {
    let query = 'SELECT * FROM catalog_view WHERE ';


    if (searchBy === 'any') {
        query += `(book_movie_title_model LIKE '%${keyword}%' OR authors LIKE '%${keyword}%' OR director_brand LIKE '%${keyword}%')`;
    } 
    else {
        switch (searchBy) {
            case 'title':
                query += `book_movie_title_model LIKE '%${keyword}%'`;
                break;
            case 'author':
                query += `authors LIKE '%${keyword}%'`;
                break;
            case 'director':
                query += `director_brand LIKE '%${keyword}%'`;
                break;
            case 'brand':
                query += `director_brand LIKE '%${keyword}%'`;
                break;
        }
    }

    if (limitBy && limitBy !== 'unlimited') {
        query += ` AND asset_type = '${limitBy}'`;
    }

    console.log(query);

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error querying catalog data:', err);
            response.writeHead(500);
            response.end('Server error');
            return;
        }

        let catalogHtml = '';

        results.forEach(item => {
            catalogHtml += `<div class="catalog-item">`;

            catalogHtml += `<div class="catalog-item-info">`;
            if (item.asset_type === `book`) {
                catalogHtml += createBookItem(item);
            }
            else if (item.asset_type === `movie`) {
                catalogHtml += createMovieItem(item);
            }
            else if (item.asset_type === `device`) {
                catalogHtml += createDeviceItem(item);
            }
            catalogHtml += `</div>`;
            catalogHtml += `<div class="item-buttons">`;
            catalogHtml += `<button class="hold-btn">Place Hold</button>`;
            catalogHtml += `<button class="checkout-btn">Add to Checkout</button>`;
            catalogHtml += `</div>`;
            catalogHtml += `</div>`;
        });

        if (catalogHtml === '') {
            catalogHtml = '<div class="no-results">Sorry, no items found for your search.</div>';
        }

        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.end(catalogHtml, 'utf-8');
    });
}

module.exports = { getInitialCatalogInfo, getCatalogSearchWithRestrictions };