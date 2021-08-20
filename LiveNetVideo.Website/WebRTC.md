# Testing


Like the rest of Chrome, there’s a focus on automated tests.

For manual development and testing, here are some command line flags that are useful for WebRTC-related testing:

--allow-file-access-from-files allows getUserMedia() to be called from file:// URLs.

--disable-gesture-requirement-for-media-playback removes the need to tap a <video> element to start it playing on Android.

--use-fake-ui-for-media-stream avoids the need to grant camera/microphone permissions.

--use-fake-device-for-media-stream feeds a test pattern to getUserMedia() instead of live camera input.

--use-file-for-fake-video-capture=path/to/file.y4m feeds a Y4M test file to getUserMedia() instead of live camera input.

# Testing with Wireshark

## Before You Start
Download and install Wireshark.

Note: On Mac OS you might have to install XQuartz as well (X11 window system).

Starting Wireshark
Make sure to start it with appropriate permissions (admin/root accounts usually have access to the network interfaces). Note: On Mac OS/Unix OS’s you might have to grant read access to the network interfaces (e.g. sudo chmod +r /dev/bpf* works but has to be done after every OS restart) as well, more info can be found here.

## Capturing RTP streams
Select the network interface currently used for RTP traffic and start a capture.

Right click on any package in the capture view and select Decode as.

Make sure Both (src/dst port <> src/dst port) is selected in the drop-down menu.

On the right scroll down to and select RTP then click OK.

RTP packets should now be visible with SSRC details in the info column.

If Unknown RTP version 0 appears its most likely not a RTP packet.

If Unknown RTP version 1 appears it’s most likely RTP encapsulated in a TURN packet, see the Capturing TURN RTP streams section on how to capture them properly.

Go to the Telephony menu and select RTP then Show All Streams.

A popup window should appear with lots of RTP streams.

The ones we are interested in should have a proper payload type e.g. 100 (VP8 in Chrome), 111 (Opus in Chrome) and 116 (VP8 with FEC in Chrome). Firefox and Opera may have different payload types for VP8 etc.

Sorting by number of packets is usually a good approach to filter out the relevant streams.
If an rtcdump file is desired select a stream and click Save As.

## Capturing TURN RTP streams
First we need to enable the Try to decode RTP outside of conversations option.

In Wireshark press Shift+Ctrl+p to bring up the preferences window.

In the menu to the left, expand protocols.

Scroll down to RTP.

Check the Try to decode RTP outside of conversations checkbox.

Click OK.

Now perform the steps in Capturing RTP streams section but skip the Decode As steps (2-4).

