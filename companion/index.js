import * as messaging from "messaging";
import { settingsStorage } from "settings";
import * as secrets from "../companion/secrets.js";

// Fetch Sleep Data from Fitbit Web API
function fetchOuraData(accessToken)  {
  let date = new Date();
  let todayDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`; //YYYY-MM-DD
  let yesterday = new Date(date);
  yesterday.setDate(date.getDate() - 1);
  let yesterdayDate = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`; //YYYY-MM-DD
  // Sleep API 
  fetch(`https://api.ouraring.com/v1/sleep?start=${yesterdayDate}&access_token=${accessToken}`, {
    method: "GET",
  })
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    var sleep = data['sleep'];
    sleep = sleep[sleep.length-1];
    console.log(sleep.score);
    let myData = {
      sleepScore: sleep.score
    }
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
      messaging.peerSocket.send(myData);
    }
  })
  .catch(err => console.log('[FETCH]: ' + err));
  
  // Readiness API
    fetch(`https://api.ouraring.com/v1/readiness?start=${yesterdayDate}&access_token=${accessToken}`, {
    method: "GET",
  })
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    var readiness = data['readiness'];
    readiness = readiness[readiness.length-1];
    console.log(readiness.score);
    let myData = {
      readinessScore: readiness.score
    }
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
      messaging.peerSocket.send(myData);
    }
  })
  .catch(err => console.log('[FETCH]: ' + err));
  
  // Activity API
  fetch(`https://api.ouraring.com/v1/activity?start=${todayDate}&access_token=${accessToken}`, {
    method: "GET",
  })
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    var activity = data['activity'];
    activity = activity[activity.length-1];
    console.log(activity.score);
    let myData = {
      activityScore: activity.score
    }
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
      messaging.peerSocket.send(myData);
    }
  })
  .catch(err => console.log('[FETCH]: ' + err));
}


// A user changes Settings
settingsStorage.onchange = evt => {
  if (evt.key === "oura_code") {
    // Settings page sent us an oAuth code
    let oura_code = evt.newValue;
    // fetchSleepData(data.access_token) ;
    getToken(oura_code);
  }
};

function getToken(exchangeCode) {
  // initial token exchange
    // Readiness API
  var params = `grant_type=authorization_code&client_id=${secrets.CLIENT_ID}`;
  params += `&client_secret=${secrets.CLIENT_SECRET}&redirect_uri=` + encodeURIComponent('https://app-settings.fitbitdevelopercontent.com/simple-redirect.html');
  params += "&code=" + encodeURIComponent(exchangeCode);
  
  fetch(`https://api.ouraring.com/oauth/token`, {
    method: "POST",
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      },
    body: params
})
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    console.log(data.access_token);
    updateTokenSettings(data);
    fetchOuraData(data.access_token);

  })
  .catch(err => console.log('[FETCH]: ' + err));
}

function refreshToken() {
  var request = new XMLHttpRequest();
  var params = `grant_type=refresh_token&client_id=${secrets.CLIENT_ID}`;
  params += `&client_secret=${secrets.CLIENT_SECRET}&redirect_uri=` + encodeURIComponent('https://app-settings.fitbitdevelopercontent.com/simple-redirect.html');
  params += "&refresh_token=" + encodeURIComponent(settingsStorage.getItem('oura_refresh_token'));
  fetch(`https://api.ouraring.com/oauth/token`, {
    method: "POST",
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      },
    body: params
  })
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    console.log(data.access_token);
    updateTokenSettings(data);
    fetchOuraData(data.access_token);

  })
  .catch(err => console.log('[FETCH]: ' + err));
}

function updateTokenSettings(response){
  // update access/refresh tokens & expiration, i.e. after initial exchange or expiration
  settingsStorage.setItem("oura_access_token", response.access_token);
  settingsStorage.setItem("oura_refresh_token", response.refresh_token);
  var t_now = new Date();
  var expiration = new Date(t_now .getTime() + 1000*response.expires_in);
  settingsStorage.setItem("oura_expires", expiration);
}

// Restore previously saved settings and send to the device
function restoreSettings() {
  for (let index = 0; index < settingsStorage.length; index++) {
    let key = settingsStorage.key(index);
    if (key && key === "oura_access_token") {
      // We already have an oauth token
      let expiration_date = settingsStorage.getItem("oura_expires");
      expiration_date = new Date(expiration_date);
      let t_now = new Date();
      if (expiration_date < t_now) {
        console.log('update tokens')
        refreshToken();
      };
      let access_token = settingsStorage.getItem(key)
      fetchOuraData(access_token);
    }
  }
}

// Message socket opens
messaging.peerSocket.onopen = () => {
  restoreSettings();
};
