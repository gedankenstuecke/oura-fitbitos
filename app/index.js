import document from "document";
import * as messaging from "messaging";

let myImage = document.getElementById("myImage");

// Message is received from companion
messaging.peerSocket.onmessage = evt => {
  // Am I Tired?
  if (evt.data.readinessScore) {
    let readiness = document.getElementById("readinesstxt");
    readiness.text = evt.data.readinessScore;
    let readiness_arc = document.getElementById("readiness");
    readiness_arc.sweepAngle = evt.data.readinessScore/100*360;

  } else if (evt.data.activityScore) {
    let activity = document.getElementById("activitytxt");
    activity.text = evt.data.activityScore;
    let activity_arc = document.getElementById("activity");
    activity_arc.sweepAngle = evt.data.activityScore/100*360;
  } else if (evt.data.sleepScore) {
    let sleep = document.getElementById("sleeptxt");
    sleep.text = evt.data.sleepScore;
    let sleep_arc = document.getElementById("sleep");
    sleep_arc.sweepAngle = evt.data.sleepScore/100*360;
  }
};
