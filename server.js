var firebase = require('firebase-admin');
var request = require('request');

var API_KEY = "FCM_API_KEY"; // Your Firebase Cloud Messaging Server API key

// Fetch the service account key JSON file contents
var serviceAccount = require("FIREBASE_PRIVATE_KEY_FILE");

// Initialize the app with a service account, granting admin privileges
firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: "DB_URL"
});
ref = firebase.database().ref("notificationRequests");
projectsRef = firebase.database().ref("projects");

function listenForNotificationRequests() {
    projectsRef.on('child_added', function(projectSnapshot) {
        var request = projectSnapshot.val();
        if (request.notified === false) {
            sendNotificationToUser(request.name, projectSnapshot.key);
            setNotified(projectSnapshot.key);
        }
    });

    ref.on('child_added', function(requestSnapshot) {
        var request = requestSnapshot.val();
        console.log('New user token for the user: ', request.username);
        addUserToTopics(
            request.username,
            request.token
        )
        deleteUserNotification(requestSnapshot.key);
    }, function(error) {
        console.log('ERROR');
        console.error(error);
    });
};

function addUserToTopics(username, token) {
    request({
        url: 'https://iid.googleapis.com/iid/v1/' + token + '/rel/topics/users',
        method: 'POST',
        headers: {
            'Content-Type': ' application/json',
            'Authorization': 'key=' + API_KEY
        }
    }, function(error, response, body) {
        if (error) {
            console.log('ERROR USER TOPIC');
            console.error(error);
        } else if (response.statusCode >= 400) {
            console.error('HTTP Error: ' + response.statusCode + ' - ' + response.statusMessage);
        } else {
            console.log('Subscribed to users topic. Response: ', response.statusCode);
        }
    });
}

function sendNotificationToUser(projectName, id) {
    request({
        url: 'https://fcm.googleapis.com/fcm/send',
        method: 'POST',
        headers: {
            'Content-Type': ' application/json',
            'Authorization': 'key=' + API_KEY
        },
        body: JSON.stringify({
            to: '/topics/users',
            notification: {
                title: 'Checkout the new project, ' + projectName,
                icon: "/images/icon-notification-192x192.png",
                click_action: "https://crowdevelop-40f3c.firebaseapp.com/projects/index/" + id
            },
            priority: 10
        })
    }, function(error, response, body) {
        if (error) {
            console.error(error);
        } else if (response.statusCode >= 400) {
            console.error('HTTP Error: ' + response.statusCode + ' - ' + response.statusMessage);
        } else {
            console.log('New project notification sended');
        }
    });
}

function setNotified(key) {
    var projectsRef = firebase.database().ref("projects/" + key);
    projectsRef.child("notified").set(true);
}

function deleteUserNotification(keyToDelete) {
    var notificationTokenReference = firebase.database().ref("notificationRequests");
    notificationTokenReference.remove()
        .then(function() {
            console.log('Token reference removed');
        })
        .catch(function() {
            console.log('Failed to remove reference token');
        });
}

// start listening
listenForNotificationRequests();
