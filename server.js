var firebase = require('firebase-admin');
var request = require('request');

var API_KEY = "AIzaSyDeh7Ahz39eimUDn5JUrv-EAqGgu0debxs"; // Your Firebase Cloud Messaging Server API key

// Fetch the service account key JSON file contents
var serviceAccount = require("./crowdevelop-40f3c-firebase-adminsdk-jtulr-a7a097be2b.json");

// Initialize the app with a service account, granting admin privileges
firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: "https://crowdevelop-40f3c.firebaseio.com"
});
ref = firebase.database().ref("notificationRequests");
projectsRef = firebase.database().ref("projects");

function listenForNotificationRequests() {
    projectsRef.on('child_added', function(projectSnapshot) {
        var request = projectSnapshot.val();
        console.log(request);
        sendNotificationToUser(request.name, "-KQMm6HtJZ64VwmTFMj1");
    });

    ref.on('child_added', function(requestSnapshot) {
        var request = requestSnapshot.val();
        console.log('New user token for the user: ', request.username);
        addUserToTopics(
            request.username,
            request.token
        )
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
            console.log('Subscribed to users topic', response.statusCode);
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
            notification: {
                title: 'Checkout the new project' + projectName,
                icon: "/images/icon-notification-192x192.png",
                click_action: "http://crowdevelop-40f3c.firebaseapp.com/projects/index/" + id
            },
            to: '/topics/users'
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

// start listening
listenForNotificationRequests();
