const mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'library-database-sytem.mysql.database.azure.com',
    user: 'lbrGuest',
    password: 'gu3st@cces$',
    database: 'librarydev',
    port:3306
});


function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function createEventHtml(item) {
    let eventHtml = '';
    eventHtml += '<tr class="event-item">';
    eventHtml += `<td class="event_id">${item.event_id}</td>`;
    eventHtml += `<td id="event_name">${item.event_name}</td>`;
    eventHtml += `<td id="event_date">${item.date}</td>`;
    eventHtml += `<td id="sponsor">${item.sponsor}</td>`;
    eventHtml += `<td id="attendance">${item.attendance_count}</td>`;
    eventHtml += `<td id="event_status">${capitalizeFirstLetter(item.event_status)}</td>`;
    eventHtml += '</tr>';
    return eventHtml;
}

function createAlertHtml(item) {
    let alertHtml = '';
    alertHtml += `<ul class="trigEvent">ID: ${item.event_id}</ul>`;
    return alertHtml;
}

function getAdminAlerts(res) {
    connection.query(`SELECT event_id FROM event_alerts_for_admin WHERE alert_status = 'active' ORDER BY event_id ASC`, (err, results) => {
        if (err) {
            console.error('Error getting admin alerts data:', err);
            response.writeHead(500);
            response.end('Server error');
            return;
        }

        let alertHtml = '';

        if (results.length > 0) {
            results.forEach(item => { alertHtml += createAlertHtml(item); });
        }
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(alertHtml, 'utf-8');
    });
}

function getEventsForAdmin(res) {
    connection.query('SELECT event_id, event_name, date, sponsor, attendance_count, event_status FROM event ORDER BY event_id ASC', (err, results) => {
        if (err) {
            console.error('Error querying staff data:', err);
            response.writeHead(500);
            response.end('Server error');
            return;
        }

        let eventHtml = '';
        
        results.forEach(item => { eventHtml += createEventHtml(item); });
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(eventHtml, 'utf-8');
    });
}

function insertEvent(res, name, des, img, sponsor, date, normalizedStartTime, stPeriod, normalizedEndTime, endPeriod) {
    connection.query(`INSERT INTO event (event_name, event_description, event_img, date, start_time, startAMPM, end_time, endAMPM, event_status, sponsor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [name, des, img, date, normalizedStartTime, stPeriod, normalizedEndTime, endPeriod, 'active', sponsor ], (newEventErr, result) => {
        if (newEventErr) {
            console.log('error entering new event into librarydev db:', newEventErr);
        }
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'eventCreationSuccessful' }));
}

function deleteEvent(res, eventId) {
    connection.query(`UPDATE event SET event_status = 'ended' WHERE event_id = ?`, [eventId], (removeEventErr, result) => {
        if (removeEventErr) {
            console.log('error entering new member into librarydev db:', removeEventErr);
        }
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'eventDeletionSuccessful' }));
}

function filterEvents(res, startDate, endDate) {
    filterByDate = 'SELECT * FROM event WHERE date BETWEEN ? AND ? ORDER BY date ASC';

    connection.query(filterByDate, [startDate, endDate], (err, results) => {
        if (err) {
            console.log('error getting filtered info from event into librarydev db:', err);
        }

        let eventHtml = '';
        
        results.forEach(item => { eventHtml += createEventHtml(item); });
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(eventHtml, 'utf-8');
    });
}


module.exports = { getAdminAlerts, getEventsForAdmin, insertEvent, deleteEvent, filterEvents };