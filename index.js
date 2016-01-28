var stop = false;

function alertUser() {
    var playAudio = document.getElementById('audio-input').checked;
    var showNotific = document.getElementById('notification-input').checked;
    var notificationDuration = document.getElementById('notificationDuration-input').value * 1000;

    if (playAudio) {
        var audio = new Audio('');
        if (audio.canPlayType('audio/mp3')) {
            audio = new Audio('resources/beep.mp3');
        }
        audio.play();
    }
    if (showNotific) {
        var notification = new Notification("Switch Driver!", { icon: "resources/notification-icon.png" });
        setTimeout(function () { notification.close() }, notificationDuration);
    }
}

function buttonPressed(startButton) {
    var time = document.getElementById('time-input').value * 1000 * 60;
    var repeat = document.getElementById('repeat-input').checked
    
    if(startButton.textContent == "Start") {
        stop = false;
        start(0, time, repeat)
        startButton.textContent = "Stop";
        startButton.className = startButton.className.replace(' btn-success', '');
        startButton.className += ' btn-danger';
    } else {
        stop = true;
        setTimeout(function() { setProgressbar(0); }, 100)
        startButton.textContent = "Start";
        startButton.className = startButton.className.replace(' btn-danger', '');
        startButton.className += ' btn-success';
    } 
}

function start(progress, time, repeat) {       
    if (!stop) {
        setTimeout(function () {
            progress = progress + 100;
            var percent = (progress / time) * 100;
            setProgressbar(percent);
            if (percent >= 100) {
                alertUser();
                if (repeat) start(-2500, time, repeat)
            } else {
                start(progress, time, repeat);
            }
        }, 100);    
    }  
}

function enableNotifications(enable) {
    console.log(enable)
    if (enable) {
        // Let's check if the browser supports notifications
        if (!("Notification" in window)) {
            alert("This browser does not support desktop notification");
        }
        // Let's check whether notification permissions have alredy been granted
        else if (Notification.permission === "granted") {
            // If it's okay let's create a notification
            var notification = new Notification("Notifications enabled");
            setTimeout(function () { notification.close() }, 1400)
        }
        // Otherwise, we need to ask the user for permission
        else if (Notification.permission !== 'denied') {
            Notification.requestPermission(function (permission) {
                // If the user accepts, let's create a notification
                if (permission === "granted") {
                    var notification = new Notification("Notifications enabled");
                    setTimeout(function () { notification.close() }, 1400)
                }
            });
        }
    }
}

function setProgressbar(value) {
    var bar = document.getElementById('progressbar');
    bar.style.width = value + "%"
    var dangerClass = " progress-bar-danger";
    if (value >= 95 && bar.className.indexOf(dangerClass) < 0) {
        bar.className += dangerClass;   
    } else if(value > 0 && value <= 10 && bar.className.indexOf(dangerClass) > -1) {
        bar.className = bar.className.replace(dangerClass, "");
    }
}