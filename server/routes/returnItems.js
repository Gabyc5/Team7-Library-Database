const mysql = require('mysql');
require('dotenv').config();
const twilio = require('twilio');
const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const connection = mysql.createConnection({
    host: 'library-database-sytem.mysql.database.azure.com',
    user: 'lbrGuest',
    password: 'gu3st@cces$',
    database: 'librarydev',
    port:3306
});

connection.connect((err) => {
    if (err) throw err;
    console.log('Connected to LibraryDev database - return items');
});


function getTransactionItems(response, transactionId) {
    const transactionQuery = 'SELECT * FROM transaction_view where transaction_id = (?) AND returned = 0';

    let transactionInfoHtml = '';
    connection.query(transactionQuery, [transactionId], (err, results) => {
        if (err) {
            console.error('Error querying transaction data:', err);
            response.writeHead(500);
            response.end('Server error');
            return;
        }

        function processItem(item) {
            return new Promise((resolve, reject) => {
                let type = item.asset_type;
                let item_id = item.itemId;

                if (type === 'book') {
                    connection.query('SELECT book_movie_title_model, authors, image_address FROM catalog_view WHERE isbn = (?)', [item_id], (bookErr, results) => {
                        if (bookErr) {
                            console.error('Error getting book item:', bookErr);
                            reject(bookErr);
                        }
                        else {
                            results.forEach(book => {
                                transactionInfoHtml += '<div class="transac-item"><div class="catalog-item-info">';
                                transactionInfoHtml += `<img src="${book.image_address}" onload="this.style.display='block'">`;
                                transactionInfoHtml += '<div class="info">';
                                transactionInfoHtml += `<h3 id="btitle">${book.book_movie_title_model}</h3>`;
                                transactionInfoHtml += `<p>Author: <span id="author">${book.authors}</span></p>`;
                                transactionInfoHtml += `<p>Type: <span id="medium">Book</span></p>`;
                                transactionInfoHtml += `<p>ISBN: <span id="item_id">${item_id}</span></p>`;
                                transactionInfoHtml += '</div></div>';
                                transactionInfoHtml += '<button class="add-btn" id="addBtn"><i class="add-icon uil uil-plus"></i>Return</button>';
                                transactionInfoHtml += '</div>';
                            });
                            resolve();
                        }  
                    });
                    
                }
                else if (type === 'movie') {
                    connection.query('SELECT book_movie_title_model, director_brand, image_address FROM catalog_view WHERE asset_id = (?)', [item_id], (movieErr, results) => {
                        if (movieErr) {
                            console.error('Error getting movie item:', movieErr);
                            reject(movieErr);
                        }
                        else {
                            results.forEach(movie => {
                                transactionInfoHtml += '<div class="transac-item"><div class="catalog-item-info">';
                                transactionInfoHtml += `<img src="${movie.image_address}" onload="this.style.display='block'">`; 
                                transactionInfoHtml += '<div class="info">';
                                transactionInfoHtml += `<h3 id="mtitle">${movie.book_movie_title_model}</h3>`;
                                transactionInfoHtml += `<p>Director: <span id="director">${movie.director_brand}</span></p>`;
                                transactionInfoHtml += `<p>Type: <span id="medium">Movie</span></p>`;
                                transactionInfoHtml += `<p>Movie ID: <span id="item_id">${item_id}</span></p>`;
                                transactionInfoHtml += '</div></div>';
                                transactionInfoHtml += '<button class="add-btn" id="addBtn"><i class="add-icon uil uil-plus"></i>Return</button>';
                                transactionInfoHtml += '</div>';
                            });
                            resolve();
                        }
                    });
                }
                else if (type === 'device') {
                    connection.query('SELECT book_movie_title_model, director_brand, image_address FROM catalog_view WHERE asset_id = (?)', [item_id], (deviceErr, results) => {
                        if (deviceErr) {
                            console.error('Error getting device item:', deviceErr);
                            reject(deviceErr);
                        }
                        else {
                            results.forEach(device => {
                                transactionInfoHtml += '<div class="transac-item"><div class="catalog-item-info">';
                                transactionInfoHtml += `<img src="${device.image_address}" onload="this.style.display='block'">`;
                                transactionInfoHtml += '<div class="info">';
                                transactionInfoHtml += `<h3 id="model">${device.book_movie_title_model}</h3>`;
                                transactionInfoHtml += `<p>Brand: <span id="brand">${device.director_brand}</span></p>`;
                                transactionInfoHtml += `<p>Type: <span id="medium">Device</span></p>`;
                                transactionInfoHtml += `<p>Device ID: <span id="item_id">${item_id}</span></p>`;
                                transactionInfoHtml += '</div></div>';
                                transactionInfoHtml += '<button class="add-btn" id="addBtn"><i class="add-icon uil uil-plus"></i>Return</button>';
                                transactionInfoHtml += '</div>';
                            });
                            resolve();
                        }
                    });
                }
            });
        }

        const processingPromises = results.map(processItem);

        Promise.all(processingPromises)
            .then(() => {
                response.writeHead(200, { 'Content-Type': 'text/html' });
                response.end(transactionInfoHtml, 'utf-8');
            })
            .catch(error => {
                console.error('Error processing items:', error);
                response.writeHead(500);
                response.end('Server error');
            });
        
    });
}

function returnItems(response, items) {
    const transactionId = items[0].transactionId;
    const returnableItems = items.slice(1);
    const updatePromises = [];

    returnableItems.forEach(item => {
        const { medium, itemId } = item;
        let returnQuery = '';
        let updateCopiesQuery = '';

        if (medium === 'Book') {
            returnQuery = 'UPDATE book_transaction SET returned = 1 WHERE book_id = ? AND transaction_id = ?';
            updateCopiesQuery = 'UPDATE book SET available_copies = available_copies + 1 WHERE isbn = ? AND current_holds = 0';
            updateHoldsQuery = 'UPDATE book SET current_holds = current_holds - 1 WHERE isbn = ? AND current_holds > 0';
        }
        else if (medium === 'Movie') {
            returnQuery = 'UPDATE movie_transaction SET returned = 1 WHERE movie_id = ? AND transaction_id = ?';
            updateCopiesQuery = 'UPDATE movie SET available_copies = available_copies + 1 WHERE movie_id = ? AND current_holds = 0';
            updateHoldsQuery = 'UPDATE movie SET current_holds = current_holds - 1 WHERE movie_id = ? AND current_holds > 0';
        }
        else if (medium === 'Device') {
            returnQuery = 'UPDATE device_transaction SET returned = 1 WHERE device_id = ? AND transaction_id = ?';
            updateCopiesQuery = 'UPDATE device SET available_copies = available_copies + 1 WHERE device_id = ? AND current_holds = 0';
            updateHoldsQuery = 'UPDATE device SET current_holds = current_holds - 1 WHERE device_id = ? AND current_holds > 0';
        }
        updateReturnDateQuery = 'UPDATE transaction SET return_date = NOW() WHERE transaction_id = ?';
        findNextHoldQuery = `SELECT hold_id, phone_number, hold_request.member_id, item_name, COALESCE(movie_id, isbn, device_id) AS item_id FROM hold_request, member WHERE hold_request.member_id = member.member_id AND COALESCE(movie_id, isbn, device_id) = ? AND hold_request.status = 'active' ORDER BY hold_id ASC LIMIT 1`;

        if (returnQuery && updateCopiesQuery) {
            updatePromises.push(
                connection.query(returnQuery, [itemId, transactionId]),
                connection.query(updateCopiesQuery, [itemId]),
                connection.query(updateHoldsQuery, [itemId]),
                connection.query(updateReturnDateQuery, [transactionId]),
                //Used to identify who to notify using Twilio
                connection.query(findNextHoldQuery, [itemId], (err, results) => {
                    if (err) {
                        console.error('Error retrieving next hold:', err);
                        return;
                    }
                    if (results.length > 0) {
                        const holdTurnId = results[0].hold_id;
                        const turnPhoneNum = results[0].phone_number;
                        const turnMemberId = results[0].member_id;
                        const turnItemName = results[0].item_name;
                        const turnItemId = results[0].item_id; 
                        
                        client.messages.create ({
                            body: `Your item on hold, ${turnItemName}, is ready for checkout.`,
                            from: '+18445030158',
                            to: turnPhoneNum
                        })
                        .then(message => console.log('Message sent:', message.sid))
                        .catch(err => console.error('Error sending message:', err));

                        connection.query(`UPDATE hold_request SET status = 'ready' WHERE hold_id = ? AND member_id = ?`, [holdTurnId, turnMemberId]);
                    }
                })
            );
        }
    });
    
    Promise.all(updatePromises).then(() => {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ message: 'Items returned successfully' }));
    })
    .catch(error => {
        console.error('Error updating returned status and available copies:', error);
        response.writeHead(500, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ message: 'Error processing your request' }));
    });
}

module.exports = { getTransactionItems, returnItems };

