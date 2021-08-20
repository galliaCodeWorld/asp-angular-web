var VideoControls = VideoControls || {};

VideoControls.VideoHelper = function () {
    /*
    if( !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia || navigator.msGetUserMedia) === true) {
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
        //navigator.getUserMedia = navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
    }
    */

    //navigator.getUserMedia = navigator.mozGetUserMedia || navigator.webkitGetUserMedia;

    //this.gUM = navigator.getUserMedia;
};

/*
 calls getUserMedia and returns the stream to the successCB else calls failCB
 @param cameraID is the id of a media source with source.kind === "video" as returned from MediaStreamTrack.getSources()
 @param micID is the id of a media source with source.kind === "audio" as returned from MediaStreamTrack.getSource()

 successCB will receive a media stream param
 failCB will receive an error param
 */

VideoControls.VideoHelper.prototype.getDefaultMediaStream = function () {
    console.log("getting default media stream");
    let self = this;
    return new Promise(function (resolve, reject) {
        let supportedConstraints = null;

        self.getSupportedMediaTrackContraints()
            .then(function (constraints) {
                supportedConstraints = constraints;
            })
            .catch(function (error) {
                console.log("getSupportedConstraints error: ", error);
            })
            .then(setupMedia);

        function setupMedia() {
            console.log("setupMedia");
            let audioConstraints = true;
            if (supportedConstraints.echoCancellation) {
                audioConstraints.echoCancellation = true;
            }

            let videoConstraints = {
                width: { max: 320 }
                , height: { max: 240 }
            };
            //let videoConstraints = true;
            navigator.mediaDevices.getUserMedia({
                audio: audioConstraints
                , video: videoConstraints
            })
                .then(function (stream) {
                    console.log("Successfully got local media stream: ", stream);
                    resolve(stream);
                })
                .catch(function (error) {
                    console.log("getMediaDevice error", error);
                    reject(error);
                });
        }
    });
}

//VideoControls.VideoHelper.prototype.getSpecificMediaStream = function (cameraId, micId, resolution) {
//    let self = this;
//    return new Promise(function (resolve, reject) {
//        let supportedConstraints = null;
//        self.getSupportedMediaTrackContraints()
//            .then(function (constraints) {
//                supportedConstraints = constraints;
//            })
//            .catch(function (error) {
//                cosnole.log("getSupportedConstraints error: ", error);
//            })
//            .then(setupMedia);

//        function setupMedia() {
//            var constraints = {};
//            if (cameraID) {
//                constraints.video.deviceId = cameraId;
//                if (resolution) {
//                    if (resolution == 'hd') {
//                        constraints.video.width.max = 1280;
//                        constraints.video.height.max = 720;
//                    }
//                    else if (resolution == 'sd') {
//                        constraints.video.width.max = 640;
//                        constraints.video.height.max = 360;
//                    }
//                    else if (resolution == 'ld') {
//                        //default resolution
//                        constraints.video.width.max = 320;
//                        constraints.video.height.max = 240;
//                    }
//                }
//            }
//            else {
//                //set true so browser can set default (firefox)
//                constraints.video = true;
//            }

//            if (micID) {
//                constraints.audio.deviceId = micId;
//                if (supportedConstraints && supportedConstraints.echoCancellation) {
//                    constraints.audio.echoCancellation = true;
//                }
//            }
//            else {
//                //set true so browser can set default (firefox)
//                if (supportedConstraints && supportedConstraints.echoCancellation) {
//                    constraints.audio.echoCancellation = true;
//                }
//                else {
//                    constraints.audio = true;
//                }
//            }

//            navigator.getUserMedia(constraints,
//                function (stream) {
//                    resolve(stream);
//                },
//                function (error) {
//                    reject(error);
//                }
//            );
//        }
//    });
//};

/*
    @param chromeMediaSourceId is a param in getScreenId callback
    @successCB will get the stream, we should call self.attachMediaStream() to attach the stream to a video element
*/
//VideoControls.VideoHelper.prototype.getScreenStream = function (chromeMediaSourceId, successCB, failCB) {
//    // TODO: currently not used legacy code, need to implement with updated code
//    var self = this;
//    var constraints = {};

//    constraints.audio = false;
//    constraints.video = {
//        "mandatory": {
//            "chromeMediaSource": "desktop",
//            "maxWidth": 1920,
//            "maxHeight": 1080,
//            "chromeMediaSourceId": chromeMediaSourceId
//        },
//        "optional": []
//    };

//    navigator.getUserMedia(constraints,
//        function (stream) {
//            successCB && successCB(stream);
//        },
//        function (error) {
//            failCB && failCB(error);
//        }
//    );
//};

/*
 @param video is a video dom element
 @param stream is a video stream from getUserMedia
 @param httpVideoSrc is a http url string to a video file, will usuall be just a blank string ""
 @param successCB is a callback function if all goes well with attaching the stream to the video
 @param failCB is a callback function if there is an errors attaching the stream to the video
 */
VideoControls.VideoHelper.prototype.attachMediaStream = function (video, stream) {
    console.log("Attaching media stream (video element, stream): ", video, stream);
    return new Promise(function (resolve) {
        //video.setAttribute("src", URL.createObjectURL(stream));
        video.srcObject = stream;
        resolve();

        //let isDomElement = false;
        //if (video instanceof Node) {
        //    isDomElement = !!(video && (typeof video === "object") && (typeof video.nodeType === "number") && (typeof video.nodeName === "string"));
        //}
        //else if (video instanceof HTMLElement) {
        //    isDomElement = !!(video && (typeof video === "object") && (video !== null) && (video.nodeType === 1) && (typeof video.nodeName === "string"));
        //}

        //if (isDomElement === false) {
        //    reject('video must be a dom element');
        //}
        //else {
        //    //video.setAttribute("src", URL.createObjectURL(stream));
        //    video.srcObject = stream;
        //    resolve();
        //    //var success = true;

        //    //if (video && video.srcObject) {
        //    //    video.srcObject = stream;
        //    //} else if (video && video.mozSrcObject) {
        //    //    video.mozSrcObject = stream;
        //    //} else if (video && video.src) {
        //    //    video.src = URL.createObjectURL(stream);
        //    //} else if (httpVideoSrc) {
        //    //    video.src = httpVideoSrc;
        //    //}
        //    //else {
        //    //    success = false;
        //    //}

        //    //if (success === true) {
        //    //    resolve('stream attached');
        //    //}
        //    //else {
        //    //    reject('no stream to set video element');
        //    //}
        //}
    })
};

VideoControls.VideoHelper.prototype.getAllMediaSources = function () {
    return new Promise(function (resolve, reject) {
        if (navigator.mediaDevices.enumerateDevices) {
            navigator.mediaDevices.enumerateDevices(function (sources) {
                resolve(sources);
            });
        }
        else {
            reject("no support for enumerateDevices");
        }
    });
}

/*
 successCB will receive all the video sources from MediaStreamTrack.getSources() as an array param
 failCB will receive an empty array param
 */
VideoControls.VideoHelper.prototype.getCameraSources = function () {
    return new Promise(function (resolve, reject) {
        let results = [];
        if (navigator.mediaDevices.enumerateDevices) {
            navigator.mediaDevices.enumerateDevices(function (sources) {
                for (let i = 0; i < sources.length; i++) {
                    if (sources[i].kind === "videoinput") {
                        results.push(sources[i]);
                    }
                }
                resolve(results);
            });
        }
        else {
            reject("no support for enumerateDevices");
        }
    });
}

/*
 successCB will receive all the audio sources from MediaStreamTrack.getSources() as an array param
 failCB will receive an empty array param
 */
VideoControls.VideoHelper.prototype.getMicSources = function () {
    return new Promise(function (resolve, reject) {
        let audioInputs = [];
        if (navigator.mediaDevices.enumerateDevices) {
            Mnavigator.mediaDevices.enumerateDevices(function (sources) {
                for (let i = 0; i < sources.length; i++) {
                    if (sources[i].kind === "audioinput") {
                        audioInputs.push(sources[i]);
                    }
                }
                resolve(audioInputs);
            });
        }
        else {
            reject("No support for enumerateDevices");
        }
    });
}

/*
 @param video is a dom video element
 */
VideoControls.VideoHelper.prototype.clearMediaStream = function (video) {
    return new Promise(function (resolve, reject) {
        let isDomElement = false;
        if (video instanceof Node) {
            isDomElement = !!(video && (typeof video === "object") && (typeof video.nodeType === "number") && (typeof video.nodeName === "string"));
        }
        else if (video instanceof HTMLElement) {
            isDomElement = !!(video && (typeof video === "object") && (video !== null) && (video.nodeType === 1) && (typeof video.nodeName === "string"));
        }

        if (isDomElement === false) {
            reject('video must me a dom element');
        }

        //video.setAttribute("src", "");
        video.srcObject = null;
        resolve();

        //var success = true;
        //if (typeof video.srcObject !== 'undefined') {
        //    video.srcObject = null;
        //} else if (typeof video.mozSrcObject !== 'undefined') {
        //    video.mozSrcObject = null;
        //} else if (typeof video.src !== 'undefined') {
        //    //noinspection JSUndefinedPropertyAssignment
        //    video.src = "";
        //}
        //else {
        //    success = false;
        //}

        //if (success === true) {
        //    successCB && successCB();
        //    return true;
        //}
        //else {
        //    failCB && failCB('unable to clear video source');
        //    return false;
        //}
    });
};

VideoControls.VideoHelper.prototype.getSupportedMediaTrackContraints = function () {
    return new Promise(function (resolve, reject) {
        if (typeof navigator.mediaDevices !== undefined && navigator.mediaDevices.getSupportedConstraints !== undefined) {
            let supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
            if (supportedConstraints) {
                resolve(supportedConstraints);
            }
            else {
                reject("unable to get supported constraints");
            }
        }
        else {
            reject("browsers does not support getSupportedConstraints");
        }
    });
}