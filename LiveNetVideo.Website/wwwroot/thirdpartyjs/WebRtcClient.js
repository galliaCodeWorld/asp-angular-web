var MultiPlatformChat = MultiPlatformChat || {};

if (MultiPlatformChat.hasOwnProperty("WebRtcClient") === false) {
    MultiPlatformChat.WebRtcClient = function () {
    }

    MultiPlatformChat.WebRtcClient.prototype.start = function (jsHelperParam, videoHelperParam, localStorage, hubUrlParam, jQuery) {
        // define global vars

        // define global vars
        let $ = jQuery;
        // NOTE: all Start params are required and are global vars
        let jsHelper = jsHelperParam;
        let videoHelper = videoHelperParam;
        let hubUrl = hubUrlParam;
        let ip = "";

        let enterNamePrompt = document.getElementById("enter-name-prompt");
        let localUserName = document.getElementById("local-user-name");
        let saveNameButton = document.getElementById("save-name");

        saveNameButton.addEventListener("click", function () {
            // TODO: we are currently using the value stored in the localUserName field,
            // this is for example only, you ideally want to store the localUserName in a cookie or some sort of local storage
            if (jsHelper.isEmpty(localUserName.value)) {
                displayErrorToUser("Your name is required to identify you to other people you call.");
            }
            else {
                hideNamePrompt();
            }
        }, false);

        let testButton = document.getElementById("test-button");

        let app = document.getElementById("multiplatformchat-app");

        let alertBox = document.getElementById("alert-box");

        let loginForm = document.getElementById("login-form");
        let loginEmail = document.getElementById("login-email");
        let loginPassword = document.getElementById("login-password");
        let loginSubmit = document.getElementById("login-submit");
        let logout = document.getElementById("logout");

        let videoInterface = document.getElementById("video-interface");
        let remoteVideo = document.getElementById("remote-video");
        let localVideo = document.getElementById('local-video');

        let connectBar = document.getElementById("connect-bar");
        let connectForm = document.getElementById("connect-form");
        let connectEmail = document.getElementById('connect-email');
        let connectButton = document.getElementById("connect-button");
        let cancelCall = document.getElementById("cancel-call");
        let endCall = document.getElementById("end-call");

        let contactList = document.getElementById("contact-list");
        let connectLinks = document.getElementsByClassName("connect-link");

        let commandBar = document.getElementById("command-bar");

        let denyCall = document.getElementById("deny-call");
        let acceptCallImage = document.getElementById("accept-call-image");
        let acceptCall = document.getElementById("accept-call");
        let acceptCallPrompt = document.getElementById("accept-call-prompt");
        let callPromptTimeout = null;
        let makeCallTimeout = null;

        let localStream = null;
        let remotStream = null;
        let peerConnectionFactory = null;
        let remoteGuid = "";

        let guestTokenName = "MultiPlatformChatAppGuestJwtToken.txt";
        let memberTokenName = "MultiPlatformChatAppMemberJwtToken.txt";

        let connection = $.hubConnection(hubUrl, {});

        let clientIdHub = connection.createHubProxy("clientIdProxyHub");
        clientIdHub.state.ip = "";

        let webRtcHub = connection.createHubProxy("webRtcHub");
        startWebRtcHubListeners();

        /*
        // signalr connectino states
        connection.starting(function () { console.log("connection starting"); });
        connection.received(function () { console.log("connection received"); });
        connection.connectionSlow(function () { console.log("connection slow"); });
        connection.reconnecting(function () { console.log("connection reconnecting"); });
        connection.reconnected(function () { console.log("connection reconnected"); });
        connection.stateChanged(function () { console.log("connection state changed"); });
        connection.disconnected(function () {
            console.log("connection disconnected");
            //if (isLogout) {
            //    setTimeout(function () {
            //        console.log("attempt restart after faile");
            //        connection.start();
            //    }, 1000);
            //    isLogout = false;

            //}
        });
        */

        connection.start()
            .done(function () {
                console.log("connetion: ", connection);
                initApp()
                    .catch(function (error) { console.log("Application Error: ", error); })
            })
            .fail(function (error) {
                console.log("connection start error:", error);
            })

        // WebRtcHub Listeners
        function startWebRtcHubListeners() {
            console.log("start webrtc hub listeners");

            webRtcHub.on("receivePing", function (json) {
                console.log("handling ping json: ", json);
                //if the user is logged in get their email and connectionId
            });

            webRtcHub.on("receivePingResponse", function (json) {
                console.log("handling ping json: ", json);
                //if the user is logged in get their email and connectionId
            });

            webRtcHub.on("receiveHubConnection", function (response) {
                //TODO: process the hub connection object
                let hubConnection = jsHelper.tryParse(response);
                if (jsHelper.isEmpty(hubConnection) === false && jsHelper.isEmpty(hubConnection.connectionGuid) === false) {
                    webRtcHub.state.connectionGuid = hubConnection.connectionGuid;
                }

                console.log("received hubConnection object: ", response);
            });

            webRtcHub.on("receiveRemoteGuidUpdate", function (response) {
                if (jsHelper.isEmpty(response) === false) {
                    setRemoteGuid(response)
                        .then(function () {
                            console.log("updated remoteGuid");
                        })
                        .catch(function (error) {
                            console.log("receiveRemoteGuid error: ", error);
                        });
                }

                console.log("received hubConnection object: ", response);
            });

            webRtcHub.on("receiveDisconnect", function (response) {
                console.log("receiveDisconnection: ", response);
                let currentRemoteGuid = response;
                if (currentRemoteGuid === remoteGuid || jsHelper.isEmpty(remoteGuid)) {
                    endCurrentCall()
                        .catch(function (error) {
                            console.log("receive end call error: ", error);
                        });
                }
            });

            webRtcHub.on("receiveCall", function (httpResponse) {
                console.log("received call from remoteGuid httpResponse: ", httpResponse);

                if (jsHelper.isEmpty(httpResponse) === false) {
                    // parse the json response
                    var response = jsHelper.tryParseJson(httpResponse);
                    if (jsHelper.isEmpty(response) === false && jsHelper.isEmpty(response.remoteGuid) === false) {
                        let otherUserGuid = response.remoteGuid;
                        let profile = response.profile;

                        // NOTE: if the user use is currently in another call, the remoteGuid will not be empty
                        // we only allow one call at a time, in the future we will allow multiple calls
                        if (jsHelper.isEmpty(remoteGuid)) {
                            showAcceptCallPrompt(otherUserGuid, profile).then(disableCalling);
                        }
                        else {
                            // send the other user a "Busy Response""
                            console.log("sending busy response to caller with remoteGuid: ", response);
                            sendBusyResponse(otherUserGuid)
                                .catch(function (error) {
                                    console.log("busyCallResponse error:", error);
                                });
                        }
                    }
                    else {
                        console.log('received call with empty remoteGuid');
                    }
                }
                else {
                    // no connectionId to respond to
                    console.log('received call with empty httpResponse');
                }
            });

            webRtcHub.on("receiveSDP", function (json) {
                //console.log("receiveSDP SdpMessage: ", json);

                let sdpMessageDto = jsHelper.tryParseJson(json);
                console.log("Received SDP sdpMessageDto: ", sdpMessageDto);
                if (jsHelper.isEmpty(sdpMessageDto) === false && jsHelper.isEmpty(sdpMessageDto.sender) === false) {
                    remoteGuid = sdpMessageDto.sender;
                    let sdp = jsHelper.tryParseJson(sdpMessageDto.sdp);
                    if (jsHelper.isEmpty(sdp) === false) {
                        //if (sdp.type === "answer") {
                        //    sdp.sdp.toString().replace('active', 'passive');
                        //    console.log("Altered SDP: ", sdp.sdp);
                        //}

                        peerConnectionFactory.setRemoteDescription(new RTCSessionDescription(sdp), function () {
                            console.log("setRemoteDescription SDP: ", sdp);
                            if (peerConnectionFactory.remoteDescription.type === 'offer') {
                                peerConnectionFactory.createAnswer(function (localSdpAnswer) {
                                    sendLocalSdp(localSdpAnswer, remoteGuid)
                                        .then(function () {
                                            console.log("localSdpAnswer sent: ", localSdpAnswer);
                                        })
                                        .catch(function (error) {
                                            console.log("unable to send localSdpAnswer: ", localSdpAnswer);
                                        });
                                }, function (error) { console.log("pc.createAnswer error: ", error); });
                            }
                        }, function (error) { console.log("pc.setRemoteDescription error: ", error); });
                    }
                }
                else {
                    console.log("error: ", response.content);
                }
            });

            webRtcHub.on("receiveICE", function (json) {
                console.log("receiveICE IceMessage: ", json);

                let iceMessageDto = jsHelper.tryParseJson(json);
                if (jsHelper.isEmpty(iceMessageDto) === false && jsHelper.isEmpty(iceMessageDto.sender) === false) {
                    remoteGuid = iceMessageDto.sender;
                    let ice = jsHelper.tryParseJson(iceMessageDto.ice);
                    if (jsHelper.isEmpty(ice) === false) {
                        peerConnectionFactory.addIceCandidate(new RTCIceCandidate(ice));
                    }
                    //else {
                    //    peerConnectionFactory.addIceCandidate(null);
                    //}
                    //console.log("received Empty ice:", json);
                }
                else {
                    console.log("iceMessage error: ", json);
                }
            });

            webRtcHub.on("receiveBusyResponse", function (remoteGuidResponse) {
                console.log("receivedBusyResponse", remoteGuidResponse);
                clearTimeout(makeCallTimeout);
                endCurrentCall().then(hideCallingPrompt).then(enableCalling);
                displayErrorToUser("The user is busy with another call. Please try your call later.")
            });

            webRtcHub.on("receiveNotAcceptCall", function (remoteGuidResponse) {
                console.log("receive Not Accept Call remoteGuid: ", remoteGuidResponse);
                clearTimeout(makeCallTimeout);
                endCurrentCall().then(hideCallingPrompt).then(enableCalling);
                displayErrorToUser("The user did not accept your call. Please try your call later.")
            });

            webRtcHub.on("receiveAcceptCall", function (remoteGuidResponse) {
                console.log("receiveAcceptCall: ", remoteGuidResponse);
                setRemoteGuid(remoteGuidResponse)
                    .then(hideCallingPrompt)
                    .then(function () {
                        // stop the 30 second automatic endCurrentCall();
                        clearTimeout(makeCallTimeout);

                        // send ice to the other user
                    })
                    .then(startP2PConnection)
                    .catch(function (error) {
                        showAlert("Error: Your call was accepted by the other user, but we were unable to identify the other user.");
                        clearTimeout(makeCallTimeout);
                        endCurrentCall().then(hideCallingPrompt).then(enableCalling);
                    });
            });

            webRtcHub.on("receiveRemoteLogout", function (connectionId) {
                console.log("received Remote Logout local connectionId, connectionId: ", webRtcHub, connectionId);
                if (jsHelper.isEmpty(connectionId) === false && connectionId === webRtcHub.connection.id) {
                    doLogout()
                        .then(function () {
                            console.log("user logged out");
                        })
                        .catch(function (error) {
                            console.log("logout error: ", error);
                        });
                }
            });
        }

        function endCurrentCall(guid) {
            return new Promise(function (resolve, reject) {
                //console.log("peerConnectionFactory.close() after close: ", peerConnectionFactory);
                endPeerConnectionFactory()
                    .then(function () {
                        //console.log("sendDisconnect remoteGuid: ", remoteGuid);
                        if (jsHelper.isEmpty(guid) === false) {
                            webRtcHub.invoke("sendDisconnect", guid)
                                .done(function () {
                                    console.log("remoteDisconnect sent: ", guid);
                                })
                                .fail(function (error) {
                                    //console.log("endCall error:", error);
                                    reject(error);
                                });
                        }
                    })
                    .catch(function (error) {
                        reject(error);
                    })
                    .then(function () {
                        setRemoteGuid("")
                            .then(setStateEndCall)
                            .then(function () {
                                console.log("Call ended");
                                resolve();
                            })
                            .catch(function (error) {
                                reject(error);
                            });
                    });
            });
        }

        function sendAcceptCall(remoteGuid) {
            console.log("sending accept call to remoteGuid: ", remoteGuid);
            return new Promise(function (resolve, reject) {
                webRtcHub.invoke("sendAcceptCall", remoteGuid)
                    .done(function () {
                        console.log("accept call sent to remoteGuid: ", remoteGuid);
                        resolve();
                    })
                    .fail(function (error) {
                        reject(error);
                    });
            });
        }

        function sendBusyResponse(remoteGuid) {
            return new Promise(function (resolve, reject) {
                webRtcHub.invoke("sendBusyResponse", remoteGuid)
                    .done(function () {
                        resolve();
                    })
                    .fail(function (error) {
                        reject(error);
                    });
            });
        }

        function sendNotAcceptCall(remoteGuid) {
            return new Promise(function (resolve, reject) {
                webRtcHub.invoke("sendNotAcceptCall", remoteGuid)
                    .done(function () {
                        resolve();
                    })
                    .fail(function (error) {
                        reject(error);
                    });
            });
        }

        function setAccessToken(jwtToken) {
            console.log("setting access_token: ", jwtToken.access_token);
            return new Promise(function (resolve, reject) {
                if (jsHelper.isEmpty(jwtToken) === false && jsHelper.isEmpty(jwtToken.access_token) === false) {
                    //console.log("set jwtToken access token", jwtToken.access_token);
                    webRtcHub.state.accessToken = jwtToken.access_token;
                    resolve();
                }
                else {
                    reject("invalid member token");
                }
            });
        }

        function setLocalGuid(guid) {
            console.log("setting local guid: ", guid);
            return new Promise(function (resolve, reject) {
                webRtcHub.state.connectionGuid = guid;
                console.log("done setting local guid");
                resolve();

                //if (jsHelper.isEmpty(guid) === false) {
                //}
                //else {
                //    reject("invalid local guid");
                //}
            });
        }

        function deleteLocalGuid() {
            return new Promise(function (resolve, reject) {
                try {
                    webRtcHub.state.connectionGuid = "";
                    resolve();
                }
                catch (e) {
                    reject(e.toString());
                }
            });
        }

        function setRemoteGuid(guid) {
            console.log("setting remote guid: ", guid);
            return new Promise(function (resolve, reject) {
                remoteGuid = guid;
                resolve();
                //if (jsHelper.isEmpty(guid) === false) {
                //    console.log("done setting remote guid");

                //}
                //else {
                //    reject("invalid remote guid");
                //}
            });
        }

        function deleteRemoteGuid() {
            return new Promise(function (resolve, reject) {
                try {
                    remoteGuid = "";
                    resolve();
                }
                catch (e) {
                    reject(e.toString());
                }
            });
        }

        function webRtcHubCheckIn() {
            console.log("checking in");
            return new Promise(function (resolve, reject) {
                // TODO: invoke the checking
                webRtcHub.invoke("checkIn")
                    .done(function (response) {
                        console.log("checked in: ", response);
                        let httpResponseMessage = jsHelper.parseHttpResponseMessage(response)
                        if (jsHelper.isEmpty(httpResponseMessage) === false && httpResponseMessage.statusCode === 200) {
                            let hubConnection = jsHelper.tryParseJson(httpResponseMessage.content);
                            if (jsHelper.isEmpty(hubConnection) === false && jsHelper.isEmpty(hubConnection.connectionGuid) === false) {
                                resolve(hubConnection.connectionGuid);
                            }
                            else {
                                reject("Unable to parse response");
                            }
                        }
                        else {
                            reject("webRtcHub CheckIn error:" + jsHelper.stringify(httpResponseMessage));
                        }
                    })
                    .fail(function (error) {
                        reject(error);
                    });
            });
        }

        function webRtcHubCheckOut() {
            console.log("checkingout");
            return new Promise(function (resolve, reject) {
                webRtcHub.invoke("checkout")
                    .done(function (response) {
                        let httpResponseMessage = jsHelper.parseHttpResponseMessage(response)
                        if (jsHelper.isEmpty(httpResponseMessage) === false && httpResponseMessage.statusCode === 200) {
                            resolve();
                        }
                        else {
                            reject("webRtcHub Checkout error:" + response);
                        }
                    })
                    .fail(function (error) {
                        reject(error);
                    });
            });
        }

        function initApp() {
            // retrieve proxySecret
            // attach proxySecret to clientIdHub.state.proxySecret
            // retrieve guestToken
            // store guestToken as cookie

            return new Promise(function (resolve, reject) {
                requestIp()
                    .then(setIp)
                    .then(requestProxySecret)
                    .then(setProxySecret)
                    .then(function () {
                        let memberPromise = localStorage.get(memberTokenName);
                        let guestPromise = localStorage.get(guestTokenName);

                        Promise.all([memberPromise, guestPromise])
                            .then(function (results) {
                                //console.log("Promise.all results: ", results);

                                let memberJwtToken = "";
                                let guestJwtToken = "";

                                if (jsHelper.isEmpty(results) === false && jsHelper.isEmpty(results[0]) === false) {
                                    memberJwtToken = jsHelper.tryParseJson(results[0]);
                                }

                                if (jsHelper.isEmpty(results) === false && jsHelper.isEmpty(results[1]) === false) {
                                    guestJwtToken = jsHelper.tryParseJson(results[1]);
                                }

                                if (jsHelper.isEmpty(memberJwtToken) === false) {
                                    // TODO: implement remain logged in check box so the user can decide
                                    // to stay logged in, for now we assume they stay logged in

                                    // user was previously logged in
                                    console.log("Init app using existing member token: ", memberJwtToken);
                                    return startAsMember(memberJwtToken);
                                }
                                else if (jsHelper.isEmpty(guestJwtToken) === false) {
                                    console.log("Init app using existing guest token: ", guestJwtToken);
                                    return startAsGuest(guestJwtToken);
                                }
                                else {
                                    console.log("Init App getting new Guest Token");
                                    deleteGuestToken()
                                        .then(requestGuestToken)
                                        .then(startAsGuest)
                                        .then(function () { resolve(); })
                                        .catch(function (error) {
                                            reject(error);
                                        });
                                }
                            })
                            .catch(function (error) {
                                reject(error);
                            });
                    })
                    .then(function () { resolve(); })
                    .catch(function (error) {
                        reject(error)
                    });
            });
        }

        function requestIp() {
            return new Promise(function (resolve, reject) {
                clientIdHub.invoke("requestIp")
                    .done(function (response) {
                        let httpResponseMessage = jsHelper.parseHttpResponseMessage(response)
                        if (jsHelper.isEmpty(httpResponseMessage) === false && httpResponseMessage.statusCode === 200) {
                            //console.log("got the ip: ", httpResponseMessage.content);
                            resolve(httpResponseMessage.content);
                        }
                        else {
                            reject("requestIp httpResponseMessage error:" + jsHelper.stringify(httpResponseMessage));
                        }
                    })
                    .fail(function (error) {
                        reject(error);
                    });
            });
        }

        function setIp(value) {
            return new Promise(function (resolve, reject) {
                // TODO: do validation for ip value to make sure its a valid ipv4 or possibley ipv6
                if (jsHelper.isEmpty(value) === false) {
                    ip = value;
                    clientIdHub.state.ip = ip;
                    console.log("Ip is set: ", ip);

                    resolve();
                }
                else {
                    reject("No Ip to set");
                }
            });
        }

        function requestProxySecret() {
            return new Promise(function (resolve, reject) {
                let verificationSecret = jsHelper.createHash(ip);

                console.log("verificationSecret: ", verificationSecret);

                clientIdHub.invoke('requestProxySecret', verificationSecret)
                    .done(function (response) {
                        //console.log("got response: ", response);
                        let httpResponseMessage = jsHelper.parseHttpResponseMessage(response)
                        if (jsHelper.isEmpty(httpResponseMessage) === false && httpResponseMessage.statusCode === 200) {
                            let proxySecret = httpResponseMessage.content;
                            //console.log("proxySecret: ", proxySecret);

                            resolve(proxySecret);
                        }
                        else {
                            reject(response.content);
                        }
                    })
                    .fail(function (error) {
                        //console.log("request Proxy Secret error", error);
                        reject(error);
                    });
            });
        }

        function setProxySecret(proxySecret) {
            return new Promise(function (resolve, reject) {
                console.log("set ProxySecret: ", proxySecret);
                clientIdHub.state.proxySecret = proxySecret;
                resolve();
            })
        }

        function requestGuestToken() {
            //console.log("requesting guest token");
            return new Promise(function (resolve, reject) {
                //use existing guesttoken first
                let json = jsHelper.getCookie(guestTokenName);

                let jwtToken = jsHelper.tryParseJson(json);
                console.log("guest cookie: ", jwtToken);
                if (jsHelper.isEmpty(jwtToken) === false && jsHelper.isEmpty(jwtToken.access_token) === false) {
                    console.log("Using existing guestToken: ", jwtToken);
                    if (jsHelper.isExpiredToken(jwtToken) === true) {
                        //console.log("expired guest token:", jwtToken);
                        renewToken(jwtToken)
                            .then(function (jwtToken) {
                                resolve(jwtToken);
                            })
                            .catch(function (error) {
                                console.log("guestToken renewal failed, getting new guesttoken");
                                getNewToken()
                                    .then(function (jwtToken) { resolve(jwtToken); })
                                    .catch(function (error) { reject(error); })
                            })
                    }
                    else {
                        //console.log("resolve guest token: ", jwtToken);
                        resolve(jwtToken);
                    }
                }
                else {
                    getNewToken()
                        .then(function (jwtToken) { resolve(jwtToken); })
                        .catch(function (error) { reject(error); })
                }

                function getNewToken() {
                    return new Promise(function (resolve, reject) {
                        //console.log("request new guest token");
                        clientIdHub.invoke("requestGuestToken")
                            .done(function (httpResponseMessage) {
                                let response = jsHelper.parseHttpResponseMessage(httpResponseMessage)
                                if (jsHelper.isEmpty(response) === false && response.statusCode === 200) {
                                    let jwtToken = jsHelper.tryParseJson(response.content);
                                    if (jsHelper.isEmpty(jwtToken) === false && jsHelper.isEmpty(jwtToken.access_token) === false) {
                                        console.log("Requested new guestToken: ", jwtToken);
                                        resolve(jwtToken);
                                    }
                                    else {
                                        reject("unable to parse guest token");
                                    }
                                }
                                else {
                                    reject(response);
                                }
                            })
                            .fail(function (error) {
                                reject(error);
                            })
                    });
                }
            });
        }

        function storeGuestToken(jwtToken) {
            //console.log("setting guestToken: ", jwtToken);
            return new Promise(function (resolve, reject) {
                localStorage.set(guestTokenName, jwtToken)
                    .then(function () {
                        //webRtcHub.state.guestJwtToken = jwtToken.access_token;
                        //console.log("guestToken set: ", jwtToken);
                        resolve(jwtToken);
                    })
                    .catch(function (error) { reject(error); });
            });
        }

        function deleteGuestToken() {
            return new Promise(function (resolve, reject) {
                //console.log("deleting guest token");
                localStorage.delete(guestTokenName)
                    .then(function () {
                        //console.log("guestToken Deleted")
                        resolve();
                    })
                    .catch(function (error) {
                        reject(error);
                    })
            });
        }

        function storeMemberToken(jwtToken) {
            return new Promise(function (resolve, reject) {
                localStorage.set(memberTokenName, jwtToken)
                    .then(function () {
                        //webRtcHub.state.memberJwtToken = jwtToken.access_token;
                        resolve(jwtToken);
                    })
                    .catch(function (error) { reject(error); });
            });
        }

        function deleteMemberToken() {
            return new Promise(function (resolve, reject) {
                localStorage.delete(memberTokenName)
                    .then(function () {
                        resolve();
                    })
                    .catch(function (error) {
                        reject(error);
                    })
            });
        }

        function renewToken(jwtToken) {
            //console.log("renewing token", jwtToken);
            return new Promise(function (resolve, reject) {
                //console.log("refresh_token: ", jwtToken.refresh_token);

                let refreshToken = jwtToken.refresh_token;
                //let refreshToken = "313e35eaf7064e2097d441db97a9981b";

                clientIdHub.invoke("renewToken", { Id: refreshToken })
                    .done(function (httpResponse) {
                        //console.log("httpResponse: ", httpResponse);
                        let response = jsHelper.parseHttpResponseMessage(httpResponse)
                        if (jsHelper.isEmpty(response) === false && response.statusCode === 200) {
                            let jwtToken = jsHelper.tryParseJson(response.content);
                            if (jsHelper.isEmpty(jwtToken) === false && jsHelper.isEmpty(jwtToken.access_token) === false) {
                                //console.log("got renewed token: ", jwtToken);
                                resolve(jwtToken);
                            }
                            else {
                                reject("unable to parse jwtToken")
                            }
                        }
                        else {
                            reject("unable to parse httpresponse: " + httpResponse);
                        }
                    })
                    .fail(function (error) {
                        reject(error);
                    })
            });
        }

        function initLocalMediaSources() {
            console.log("initLocalMediaSources");
            return new Promise(function (resolve, reject) {
                videoHelper.getDefaultMediaStream()
                    .then(setLocalStream)
                    .then(function () {
                        // NOTE: must return promise to catch errors otherwise
                        // if there is a reject in the attachMediaStream, it doesn't propogate
                        // and the following then will execute
                        return videoHelper.attachMediaStream(localVideo, localStream).then(showLocalVideo);
                    })
                    .then(function () { resolve(); })
                    .catch(function (error) {
                        reject(error);
                    })
            });
        }

        function setLocalStream(stream) {
            console.log("setLocalStream", stream);
            return new Promise(function (resolve, reject) {
                try {
                    localStream = stream;
                    resolve();
                }
                catch (e) {
                    reject(e.toString());
                }
            });
        }

        function setRemoteStream(stream) {
            console.log("setRemoteStream", stream);
            return new Promise(function (resolve) {
                remoteStream = stream;
                resolve();
            });
        }

        // PeerConnectionFactory
        function startPeerConnectionFactory() {
            console.log('starting peer connection factory');
            return new Promise(function (resolve, reject) {
                let config = {
                    iceServers: [{
                        urls: 'stun:stun.l.google.com:19302',
                        urls: "stun:stun1.l.google.com:19302",
                        urls: "stun:stun2.l.google.com:19302",
                        urls: "stun:stun3.l.google.com:19302",
                        urls: "stun:stun4.l.google.com:19302"
                    }]
                };

                //peerConnectionFactory = new RTCPeerConnection(config);

                peerConnectionFactory = new RTCPeerConnection(config, {
                    "optional": [{ "DtlsSrtpKeyAgreement": true }]
                });

                peerConnectionFactory.oniceconnectionstatechange = function (evt) {
                    console.log("oniceconnectionstatechange evt: ", evt);
                    console.log("oniceconnectionstatechange iceconnectionstate: ", evt.target.iceConnectionState);
                    if (evt.target.iceConnectionState === "closed") {
                        //console.log("closed: ", evt);
                        //endCurrentCall();
                    }
                }

                // send any ice candidates to the other peer
                peerConnectionFactory.onicecandidate = function (evt) {
                    //foward all ice candidates to the other user using our SignalR Hub
                    //signalingChannel.send(JSON.stringify({
                    //    'candidate': evt.candidate
                    //}));
                    //console.log("pc.onicecandidate: ", evt);
                    //webRtcHub.invoke("sendICE", evt.candidate);

                    console.log("LocalIce: ", evt.candidate);
                    //if (jsHelper.isEmpty(evt.candidate) === true) {
                    //    console.log("adding null ice");
                    //    peerConnectionFactory.addIceCandidate(null);
                    //}
                    sendLocalIce(evt.candidate, remoteGuid)
                        .catch(function (error) {
                            console.log("sendLocalIce error: ", error);
                        });

                    // NOTE: .push('value') to add to end of array, and
                    // .shift() to get value at beginning of array to send ice when ready
                    //localIce.push(evt.candidate);
                };

                // let the 'negotiationneeded' event trigger offer generation
                peerConnectionFactory.onnegotiationneeded = function (evt) {
                    //note this gets called by webrtc built in code
                    console.log("onnegogiationneeded evt:", evt);

                    //peerConnectionFactory.createOffer(function (localSdpOffer) {
                    //    sendLocalSdp(localSdpOffer);
                    //}, logError);
                };

                // once remote stream arrives, show it in the remote video element
                peerConnectionFactory.onaddstream = function (evt) {
                    //removeVideo.src = URL.createObjectURL(evt.stream);

                    console.log("onaddstream: ", evt);
                    setStateInCall()
                        .then(function () {
                            return setRemoteStream(evt.stream);
                        })
                        .then(function () {
                            return videoHelper.attachMediaStream(remoteVideo, remoteStream).then(showRemoteVideo);
                        })
                        .then(function () {
                            //peerConnectionFactory.addStream(localStream);

                            console.log("peerConnectionFactory.onaddstream add remotestream: peerConnectionFactory: ", peerConnectionFactory);
                        })
                        .catch(function (error) {
                            console.log("peerConnectionFactory.onaddstream setStateInCall error: ", error);
                            // TODO: maybe just call endCurrentCall();
                            setStateEndCall();
                        });
                };

                peerConnectionFactory.addStream(localStream);

                resolve();
            });
        }

        function endPeerConnectionFactory() {
            return new Promise(function (resolve, reject) {
                peerConnectionFactory && peerConnectionFactory.close();
                peerConnectionFactory = null;
                resolve();
            });
        }

        function sendAllIce(iteration, maxIteration) {
            if (typeof iteration === "undefined") {
                iteration = 0;
            }

            if (typeof maxIteration === "undefined") {
                maxIteration = 3;
            }
            // NOTE: this function is not used. just an example of recursive function
            return new Promise(function (resolve, reject) {
                if (iteration < 3) {
                    console.log("sendAllIce iteration: ", iteration);
                    // TODO: when all ice has been received, then send them, for now use gotAllIce for testing
                    let gotAllIce = iteration === 2 ? true : false;
                    if (gotAllIce) {
                        if (localIce.length > 0) {
                            let tasks = [];
                            for (let i = 0; i < localIce.length; i++) {
                                tasks.push(sendLocalIce(localIce[i], remoteGuid));
                            }

                            Promise.all(tasks)
                                .then(function (results) {
                                    resolve();
                                })
                                .catch(function (error) {
                                    reject(error);
                                });
                        }
                        else {
                            reject("No local Ice information to sent");
                        }
                    }
                    else {
                        setTimeout(function () { return sendAllIce(++iteration, maxIteration) }, 750);
                    }
                }
                else {
                    reject("Did not receive ice information in timely manner.");
                }
            });
        }

        function sendLocalIce(localIce, otherUserGuid) {
            console.log("sendLocalIce localIce: ", localIce);
            //console.log("sendLocalIce remoteGuid: ", remoteGuid);
            return new Promise(function (resolve, reject) {
                webRtcHub.invoke("sendICE", otherUserGuid, JSON.stringify(localIce))
                    .done(function () {
                        resolve();
                    })
                    .fail(function (error) {
                        reject(error);
                    });
            });
        }

        function sendLocalSdp(localSdp, otherUserGuid) {
            return new Promise(function (resolve, reject) {
                peerConnectionFactory.setLocalDescription(localSdp, function () {
                    if (jsHelper.isEmpty(otherUserGuid) === false) {
                        console.log("Send lcal sdp immediately");
                        webRtcHub.invoke("sendSDP", otherUserGuid, JSON.stringify(peerConnectionFactory.localDescription))
                            .done(function () {
                                //console.log("Send Local Sdp: sdp", remoteGuid, localSdp);
                                resolve();
                            })
                            .fail(function (error) {
                                reject(error);
                                //console.log("Send Local Sdp error: ", error);
                            });
                    }
                    else {
                        reject("other users guid required to send local sdp information");
                    }
                }, function (error) { reject(error); });
            });
        }

        function logError(error) {
            console.log(error.name + ': ' + error.message);
        }

        function doLogout() {
            return new Promise(function (resolve, reject) {
                webRtcHubCheckOut()
                    .then(deleteMemberToken)
                    .then(endCurrentCall)
                    .then(requestGuestToken)
                    .then(initGuestSettings)
                    .then(function () { resolve(); })
                    .catch(function (error) {
                        reject(error);
                    });
            });
        }

        // Dom Listeners
        function startDomListeners() {
            console.log("starting dom listeners")
            return new Promise(function (resolve, reject) {
                testButton.addEventListener("click", function (evt) {
                    webRtcHub.invoke("requestNewGuid")
                        .done(function (response) {
                            let httpResponse = jsHelper.parseHttpResponseMessage(response)
                            if (jsHelper.isEmpty(httpResponse) === false && httpResponse.statusCode === 200) {
                                let newGuid = httpResponse.content;
                                if (jsHelper.isEmpty(newGuid) === false) {
                                    setLocalGuid(newGuid)
                                        .then(function () {
                                            // TODO: when a user updates their local guid,
                                            // if they are logged in and connected to another user, they need to notify
                                            // that user of their updated guid
                                            if (jsHelper.isEmpty(remoteGuid) === false) {
                                                webRtcHub.invoke("sendRemoteGuidUpdate", remoteGuid)
                                                    .done(function () {
                                                        console.log("done sending remoteGuidUpdate to ", remoteGuid);
                                                    })
                                                    .fail(function (error) {
                                                        console.log("sendRemoteGuidUpdate failed: ", error);
                                                    });
                                            }
                                            console.log("updated local guid: ", newGuid);
                                        })
                                        .catch(function () {
                                            console.log("set local guid failed: ", newGuid);
                                        });
                                }
                                else {
                                    console.log("requestNewGuid new guid is empty:", newGuid);
                                }
                            }
                            else {
                                console.log("unable to parse response: ", response);
                            }
                        })
                        .fail(function (error) {
                            console.log("request new guid error: ", error);
                        });
                }, false);

                logout.addEventListener("click", function (evt) {
                    doLogout()
                        .then(function () {
                            console.log("user logged out");
                        })
                        .catch(function (error) {
                            console.log("logout error: ", error);
                        });
                }, false);

                //console.log("dome listeners started");
                acceptCall.addEventListener("click", function (evt) {
                    //clear the timeout
                    clearTimeout(callPromptTimeout);

                    //get the remote guid from the button
                    let currentRemoteGuid = this.getAttribute('data-remote-guid');
                    console.log("accepted call with remoteGuid: ", currentRemoteGuid);
                    if (jsHelper.isEmpty(currentRemoteGuid) === false) {
                        if (jsHelper.isEmpty(webRtcHub.state.connectionGuid) === false) {
                            // NOTE: the peer that actually initiates the call is the
                            // user who receives the call request.
                            // create sdp offer by adding stream to peerConnectionFactory
                            // this will create the exchange of sdp and ice to start the P2P connection
                            console.log("sending accept acall to remoteGuid: ", currentRemoteGuid);
                            console.log("sending accept call local guid", webRtcHub.state.connectionGuid);

                            setRemoteGuid(currentRemoteGuid)
                                .then(startPeerConnectionFactory)
                                .then(function () {
                                    // store the remote guid
                                    return sendAcceptCall(currentRemoteGuid);
                                })
                                //.then(startP2PConnection)
                                .then(hideAcceptCallPrompt)
                                .then(setStateInCall)
                                .catch(function (error) {
                                    console.log("acceptCall error: ", error);
                                    displayErrorToUser("An error occured while trying to accept a call.");
                                })
                        }
                        else {
                            displayErrorToUser("user is missing local connectionGuid.");
                        }
                    }
                    else {
                        displayErrorToUser("missing remote connectionGuid.");
                    }
                }, false);

                denyCall.addEventListener("click", function (evt) {
                    clearTimeout(callPromptTimeout);
                    let currentRemoteGuid = this.getAttribute('data-remote-guid');
                    webRtcHub.invoke("sendNotAcceptCall", currentRemoteGuid);

                    hideAcceptCallPrompt().then(enableCalling);
                });

                loginSubmit.addEventListener("click", function (evt) {
                    // NOTE: when a user manually logs in, we are switching them from guest interface to member interface

                    let email = loginEmail.value;
                    let password = loginPassword.value;
                    //console.log("starting login");

                    //console.log("email: ", email);
                    //console.log("password: ", password);

                    //TODO: need to validate email and password

                    if (jsHelper.isEmpty(email) === false) {
                        //console.log("have email:", email);
                        if (jsHelper.isEmpty(password) === false) {
                            //console.log("have password: ", password);

                            clientIdHub.invoke("requestMemberToken", { Email: email, Password: password })
                                .done(function (response) {
                                    //console.log("response: ", response);
                                    let httpResponse = jsHelper.parseHttpResponseMessage(response);
                                    if (jsHelper.isEmpty(httpResponse) === false && httpResponse.statusCode === 200) {
                                        //console.log("response content: ", httpResponse.content);
                                        let jwtToken = jsHelper.tryParseJson(httpResponse.content);
                                        if (jsHelper.isEmpty(jwtToken) === false && jsHelper.isEmpty(jwtToken.access_token) === false) {
                                            //checkout the guestToken
                                            webRtcHubCheckOut()
                                                .then(function () {
                                                    return initMemberSettings(jwtToken);
                                                })
                                                .then(function () {
                                                    console.log("login success");
                                                })
                                                .catch(function (error) {
                                                    //console.log("login error: ", error);
                                                    displayErrorToUser("Network error, Login failed");
                                                });
                                        }
                                        else {
                                            //console.log("loginSubmit unable to extract jwtToken:", jwtToken);
                                            //reject("invalid login response");
                                            displayErrorToUser("Login error, received invalid credentials from server.");
                                        }
                                    }
                                    else {
                                        //console.log("loginSubmit failed response:", response);
                                        //TODO: parse the errors from the response and display then to the user
                                        // for now display general error message, error messages are located as List<string> in httpRepsonse.content
                                        displayErrorToUser("Login failed. Please make sure your email and password are correct.");
                                    }
                                })
                                .fail(function (error) {
                                    //console.log("loginSubmit error:", error);
                                    //reject(error);
                                    displayErrorToUser("Login request failed. Please try your request later.");
                                });
                        }
                        else {
                            displayErrorToUser("password is required");
                        }
                    }
                    else {
                        displayErrorToUser("email is required");
                    }
                }, false);

                connectButton.addEventListener("click", function (evt) {
                    let email = connectEmail.value;
                    //console.log("email: ", email);
                    // TODO: add email validation

                    if (jsHelper.isEmpty(email) === false) {
                        requireAName()
                            .then(function () {
                                makeCall(email)
                                    .catch(function (error) {
                                        console.log("makeCall error: ", error);
                                        displayErrorToUser("An error occurred while trying to make a call. Please try again later.");
                                    });
                            })
                            .catch(function (error) {
                                console.log("user identity required");
                            });
                    }
                    else {
                        //TODO: let user know of error with email
                        //console.log("connectonButton email error: ", email);
                        displayErrorToUser("The email field is required to make a call.");
                    }
                }, false);

                endCall.addEventListener("click", function (evt) {
                    let self = this;
                    let guid = jsHelper.isEmpty(remoteGuid) ? this.getAttribute("data-remote-guid") : remoteGuid;

                    endCurrentCall(guid)
                        .catch(function (error) {
                            console.log("end call error: ", error);
                        })
                        .then(function () {
                            self.setAttribute("data-remote-guid", "");
                        });
                }, false);

                //cancelCall.addEventListener("click", function (evt) {
                //    let email = this.getAttribute('data-email');
                //    if (jsHelper.isEmpty(email) === false) {
                //        cancelMakeCall(email);
                //    }
                //    else {
                //        console.log("can not cancel call without knowing the other users email");
                //    }

                //}, false);

                // addEventListener to current collection of connectLinks.
                // must manually addEventListeners to new links as they are dynamically added
                for (let i = 0; i < connectLinks.length; i++) {
                    connectLinks[i].addEventListener("click", connectLink, false);
                }

                function connectLink(evt) {
                    let email = evt.target.getAttribute("data-email");
                    //console.log("got email: ", email);
                    requireAName()
                        .then(function () {
                            makeCall(email)
                                .catch(function (error) {
                                    console.log("makeCall error: ", error);
                                });
                        });
                }
                resolve();
            });
        }

        function makeCall(email) {
            return new Promise(function (resolve, reject) {
                startPeerConnectionFactory()
                    .then(function () {
                        webRtcHub.invoke("makeCall", email, localUserName.value)
                            .done(function (response) {
                                let httpResponse = jsHelper.parseHttpResponseMessage(response);
                                if (jsHelper.isEmpty(httpResponse) === false && httpResponse.statusCode === 200) {
                                    let guid = httpResponse.content;
                                    endCall.setAttribute("data-remote-guid", guid);
                                    console.log("making call to:", guid);

                                    //everything good, wait for the other user to respond in with in 30 seconds
                                    makeCallTimeout = setTimeout(function () {
                                        endCurrentCall(guid);
                                    }, 30000);

                                    showCallingPrompt()
                                        .then(disableCalling)
                                        .then(showEndCall)
                                    resolve();
                                }
                                else {
                                    displayErrorToUser("Unable to locate the user with email: " + email + ". The user is either busy or not online at this time.");
                                    reject("makeCall response error: " + response);
                                    //console.log("makeCall error httpResponseMessage: ", httpResponse); // log for debugging
                                    // unable to locate the user, they are probably not online
                                }
                            })
                            .fail(function (error) {
                                displayErrorToUser("Unable to reach the other user at this time. Please try to connect later.")

                                //makeCall request failed
                                reject(error);
                                //console.log("makeCall error:", error);
                            });
                    })
                    .catch(function (error) {
                        reject(error);
                    });
            });
        }

        /*
        function showCancelCall(email) {
            return new Promise(function (resolve) {
                cancelCall.setAttribute('data-email', email);
                cancelCall.style.display = "inline-block";
                resolve();
            });
        }

        function hideCancelCall() {
            return new Promise(function (resolve) {
                cancelCall.style.display = "none";
                cancelCall.setAttribute('data-email', "");
                resolve();
            });
        }
        */

        // NOTE: getConnectionId is no longer available on webrtchub, use requestGuid(email)
        //function getRemoteConnectionId(email) {
        function requestGuid(email) {
            //console.log("connection: ", connection);
            return new Promise(function (resolve, reject) {
                //webRtcHub.invoke("getConnectionId", email)
                webRtcHub.invoke("requestGuid", email)
                    .done(function (response) {
                        let httpResponse = jsHelper.parseHttpResponseMessage(response);
                        if (jsHelper.isEmpty(httpResponse) === false && jsHelper.isEmpty(httpResponse.statusCode) === false) {
                            if (httpResponse.statusCode === 200) {
                                let remoteGuid = httpResponse.content;
                                if (jsHelper.isEmpty(remoteGuid) === false) {
                                    resolve(remoteGuid);
                                }
                                else {
                                    reject("no remoteGuid in http response");
                                }
                            }
                            else {
                                reject(httpResponse.content);
                            }
                        }
                        else {
                            reject("getConnectionId invalid response: ", response);
                        }
                    })
                    .fail(function (error) { reject(error); });
            });
        }

        function startP2PConnection() {
            return new Promise(function (resolve, reject) {
                try {
                    console.log("starting p2p connection");
                    //peerConnectionFactory.addStream(localStream);

                    peerConnectionFactory.createOffer(function (localSdpOffer) {
                        sendLocalSdp(localSdpOffer, remoteGuid)
                            .then(function () {
                                resolve();
                            })
                            .catch(function (error) {
                                reject(error);
                            });
                        resolve();
                    }, function (error) {
                        reject(error);
                    });
                }
                catch (e) {
                    reject(e.toString());
                }
            });
        }

        /*
             General State change functions
         */

        function startAsGuest(jwtToken) {
            console.log("starting as guest");
            return new Promise(function (resolve, reject) {
                if (jsHelper.isExpiredToken(jwtToken) === true) {
                    console.log("renewing guest token", jwtToken);
                    renewToken(jwtToken)
                        .then(function (jwtToken) {
                            return startAsGuest(jwtToken);
                        })
                        .then(function () {
                            resolve();
                        })
                        .catch(function () {
                            console.log("unable to renew guest token, getting a new one. old token:", jwtToken);
                            deleteGuestToken()
                                .then(requestGuestToken)
                                .then(function (jwtToken) {
                                    return startAsGuest(jwtToken);
                                })
                                .then(function () {
                                    resolve();
                                })
                                .catch(function (error) {
                                    reject(error);
                                })
                        });
                }
                else {
                    console.log("startAsGuest (could be called recursively) token not expired call. jwtToken: ", jwtToken);
                    initGuestSettings(jwtToken)
                        .then(initLocalMediaSources)
                        //.then(startPeerConnectionFactory)
                        .then(startDomListeners)

                        .then(function () {
                            console.log("enabling guest interface");
                            app.style.display = "block";
                            resolve();
                        })
                        .catch(function (error) {
                            reject(error);
                        });
                }
            });
        }

        function requireAName() {
            return new Promise(function (resolve, reject) {
                if (jsHelper.isEmpty(localUserName)) {
                    showNamePrompt();
                    reject("User identity required");
                }
                else {
                    resolve();
                }
            });
        }

        function showNamePrompt() {
            return new Promise(function (resolve) {
                enterNamePrompt.style.display = "block";
                resolve();
            });
        }

        function hideNamePrompt() {
            return new Promise(function (resolve) {
                enterNamePrompt.style.display = "none";
            });
        }

        function initGuestSettings(jwtToken) {
            return new Promise(function (resolve, reject) {
                storeGuestToken(jwtToken)
                    .then(setAccessToken)
                    .then(webRtcHubCheckIn)
                    .then(setLocalGuid)
                    .then(showLoginForm)
                    .then(enableCalling)
                    .then(hideCallingPrompt)
                    .then(hideAcceptCallPrompt)
                    .then(hideLogoutButton)
                    .then(showNamePrompt)
                    .then(function () {
                        resolve();
                    })
                    .catch(function (error) {
                        reject(error);
                    });
            });
        }

        function initMemberSettings(jwtToken) {
            console.log("initMemberSettings: ", jwtToken);
            return new Promise(function (resolve, reject) {
                storeMemberToken(jwtToken)
                    .then(setAccessToken)
                    .then(webRtcHubCheckIn)
                    .then(setLocalGuid)
                    .then(hideLoginForm)
                    .then(enableCalling)
                    .then(hideCallingPrompt)
                    .then(hideAcceptCallPrompt)
                    .then(showLogoutButton)
                    .then(function () {
                        // TODO: set the actual member first and last name
                        localUserName.value = "member";
                        hideNamePrompt();
                        resolve();
                    })
                    .catch(function (error) {
                        reject(error);
                    });
            });
        }

        function startAsMember(jwtToken) {
            return new Promise(function (resolve, reject) {
                console.log("starting as member: ", jwtToken);

                //check to see if the token is expired, if is expired then renew it
                if (jsHelper.isExpiredToken(jwtToken) === true) {
                    // before renewing the token, we need to checkout the guest token
                    // renew the token

                    console.log("start as member, renewing member token", jwtToken);
                    renewToken(jwtToken)
                        .then(function (jwtToken) {
                            return startAsMember(jwtToken);
                        })
                        .then(function () {
                            resolve();
                        })
                        .catch(function (error) {
                            // the renew of the member token failed. have the user login
                            console.log("start as member, unable to renew member token, start as guest so user can login", jwtToken);
                            requestGuestToken()
                                .then(startAsGuest)
                                .then(function () {
                                    resolve();
                                })
                                .catch(function (error) {
                                    reject(error);
                                })
                        });
                }
                else {
                    console.log("start as member, member token not expires: ", jwtToken);
                    initMemberSettings(jwtToken)
                        .then(initLocalMediaSources)
                        //.then(startPeerConnectionFactory)
                        .then(startDomListeners)
                        .then(function () {
                            app.style.display = "block";
                            resolve();
                        })
                        .catch(function (error) {
                            reject(error);
                        });
                }
            });
        }

        /*
         * UI Show Hide functions
         */

        function showAcceptCallPrompt(remoteGuid, profile) {
            return new Promise(function (resolve) {
                // TODO: check if there is a profile to display. if there is profile, then display the information from the profile
                // like firstName, maybe lastName, AvatarDataUri image
                if (jsHelper.isEmpty(profile.avatarDataUri) === false) {
                    acceptCallImage.setAttribute("src", profile.avatarDataUri);
                    acceptCallImage.style.display = "inline-block";
                }
                acceptCall.innerHTML = "Accept Call From: " + profile.name;
                acceptCall.setAttribute('data-remote-guid', remoteGuid);
                denyCall.setAttribute('data-remote-guid', remoteGuid);
                // user has 30 seconds to respond, when the user responds we will clear this timeout
                callPromptTimeout = setTimeout(function () {
                    //automatically send the other user a "Not Accepting Call" response
                    sendNotAcceptCall(remoteGuid)
                        .catch(function (error) {
                            console.log("notAcceptCall error: ", error);
                        })
                        .then(endCurrentCall);
                }, 30000);

                //show the call prompt so user can accept or deny the call
                acceptCallPrompt.style.display = 'block';
                resolve();
            });
        }

        function hideAcceptCallPrompt() {
            return new Promise(function (resolve) {
                acceptCallImage.setAttribute("src", "");
                acceptCallImage.style.display = "none";
                acceptCall.innerHTML = "Accept Call";
                acceptCall.setAttribute('data-remote-guid', '');
                denyCall.setAttribute('data-remote-guid', '');
                acceptCallPrompt.style.display = 'none';
                resolve();
            });
        }

        function disableCalling() {
            console.log("disabling calling");
            return new Promise(function (resolve) {
                //NOTE: for now just hide the connect form and the connect list
                contactList.style.display = "none";
                connectForm.style.display = "none";
                //TODO: disable the connect button
                //connectButton.disabled = true;
                //for (let i = 0; i < connectLinks.length; i++) {
                //    connectLinks[i].disabled = true;
                //}

                resolve();
            });
        }

        function enableCalling() {
            console.log("enabling calling");
            return new Promise(function (resolve, reject) {
                try {
                    console.log("enable calling, inside promise");
                    endCall.style.display = 'none';
                    connectBar.style.display = 'inline-block';

                    contactList.style.display = "inline-block";
                    connectForm.style.display = "inline-block";

                    console.log("enable calling styles applied");
                    /*
                    connectButton.disabled = false;
                    //console.log("connectButton: ", connectButton);
                    //console.log("connectLinks: ", connectLinks);
                    for (let i = 0; i < connectLinks.length; i++) {
                        connectLinks[i].disabled = false;
                        //console.log("connectLinks[i]", connectLinks[i], i);
                    }
                    */
                    console.log("enabling calling done");

                    resolve();
                }
                catch (e) {
                    console.log("enable calling catched error: ", e);
                    reject(e.toString());
                }
            });
        }

        function setStateInCall() {
            return new Promise(function (resolve) {
                disableCalling()
                    .then(hideAlert)
                    .then(showEndCall)
                    .then(function () {
                        resolve();
                    });
            });
        }

        function setStateEndCall() {
            return new Promise(function (resolve) {
                console.log("set state end call");
                // clear all timers
                clearTimeout(callPromptTimeout);
                clearTimeout(makeCallTimeout);

                enableCalling()
                    .then(hideEndCall)
                    .then(hideRemoteVideo)
                    .then(hideAcceptCallPrompt)
                    .then(hideCallingPrompt)
                    .then(function () {
                        resolve();
                    });
            });
        }

        function showLocalVideo() {
            return new Promise(function (resolve, reject) {
                localVideo.style.display = "inline-block";
                resolve();
            });
        }

        function hideLocalVideo() {
            return new Promise(function (resolve, reject) {
                videoHelper.clearMediaStream(localVideo)
                    .then(function () {
                        localVideo.style.display = "none";
                        resolve();
                    })
                    .catch(function (error) {
                        reject(error);
                    });
            });
        }

        function hideRemoteVideo() {
            return new Promise(function (resolve, reject) {
                videoHelper.clearMediaStream(remoteVideo)
                    .then(function () {
                        remoteVideo.style.display = "none";
                        resolve();
                    })
                    .catch(function (error) {
                        reject(error);
                    });
            });
        }

        function showRemoteVideo() {
            return new Promise(function (resolve, reject) {
                remoteVideo.style.display = "inline-block";
                resolve();
            });
        }

        function showEndCall() {
            return new Promise(function (resolve) {
                endCall.style.display = "inline-block";
                resolve();
            });
        }

        function hideEndCall() {
            return new Promise(function (resolve) {
                endCall.style.display = "none";
                resolve();
            });
        }

        function hideLoginForm() {
            return new Promise(function (resolve) {
                showLogoutButton()
                    .then(function () {
                        loginForm.style.display = 'none';
                    })
                    .then(function () {
                        resolve();
                    })
                    .catch(function (error) {
                        reject(error);
                    });
            });
        }

        function showLoginForm() {
            return new Promise(function (resolve, reject) {
                console.log("showing login form");
                hideLogoutButton()
                    .then(function () {
                        //console.log("login form shown");
                        loginForm.style.display = 'block';
                    })
                    .then(function () {
                        resolve();
                    })
                    .catch(function (error) {
                        reject(error);
                    });
            });
        }

        function showLogoutButton() {
            return new Promise(function (resolve, reject) {
                try {
                    logout.style.display = "inline-block";
                    resolve();
                }
                catch (e) {
                    reject(e.toString());
                }
            });
        }

        function hideLogoutButton() {
            return new Promise(function (resolve, reject) {
                try {
                    logout.style.display = "none";
                    resolve();
                }
                catch (e) {
                    reject(e.toString());
                }
            });
        }

        function showAlert(message, heading, alertType) {
            if (typeof heading === "undefined") {
                heading = "";
            }

            if (typeof alertType === "undefined") {
                alertType = "alert-info";
            }

            console.log("showing alert-box");
            alertBox.innerHTML = "";
            let alert = jsHelper.createAlert(message, heading, alertType);
            alertBox.style.display = "block";
            alertBox.appendChild(alert);
        }

        function hideAlert() {
            alertBox.innerHTML = "";
            alertBox.style.display = "none";
        }

        function displayErrorToUser(error) {
            console.log("displayErrorToUser: ", error);
            alert(error);
        }

        function hideCallingPrompt() {
            //TODO: hide the making call prompt or modal
            console.log("hide calling prompt");
            return new Promise(function (resolve, reject) {
                //hideCancelCall();
                hideAlert();
                resolve();
            });
        }

        function showCallingPrompt() {
            //TODO: create a prompt or modal to have user wait while the call is being made
            console.log("show calling prompt");
            return new Promise(function (resolve) {
                showAlert("Please wait attempting call", "Calling", "alert-danger");
                resolve();
            });
        }

        function cancelMakeCall(email) {
            //TODO: if a user changes their mind about making a call, they can cancel it
            return new Promise(function (resolve, reject) {
                /*
                // invoke cancelCall with email, this will send a disconnect signal to the other user
                endPeerConnectionFactory()
                    .then(function () {
                        webRtcHub.invoke("cancelCall", email)
                            .done(function () {
                                clearTimeout(makeCallTimeout);
                                console.log("remoteDisconnect sent: ", remoteGuid);
                                setRemoteGuid("")
                                    .then(setStateEndCall)
                                    .then(function () {
                                        console.log("Call ended");
                                        resolve();
                                    })
                                    .catch(function (error) {
                                        reject(error);
                                    });
                            })
                            .fail(function (error) {
                                //console.log("endCall error:", error);
                                reject(error);
                            })
                    })
                    .catch(function (error) {
                        reject(error);
                    });
                */

                /*
                // requestGuid with email, then send disconnect signal to the other user
                requestGuid(email)
                    .then(function (guid) {
                        remoteGuid = guid;
                        clearTimeout(makeCallTimeout);
                        endCurrentCall()
                            .then(hideCallingPrompt)
                            .then(hideCancelCall)
                            .then(enableCalling);
                    })
                    .catch(function (error) {
                        reject(error);
                    })
                    .then(function () {
                        remoteGuid = "";
                    });

               */
            });
        }
    }
}