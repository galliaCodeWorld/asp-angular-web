# Markdown File

ngAfterViewInit() will start the listeners this.startSubscriptions();

GUI will only have button to enter meeting if
the current local time is 15 min prior to meeting 
time or 15 min after meeting end time

First person to enter a meeting grabs a phoneLineId if 
one doesn't already exist in meeting table.

TODO: Meetings keep their PhoneLineId unless the phoneLine is older than 24 hours.
if older than 24 hours then, have the first user to enter the meeting grab a new phoneline

MeetDate is stored as UTC on server and is returned in UTC time, so the GUI has to 
use Momentjs to convert it to local time.

Edit and create meeting both process the date and time the same way, so
date processing changes should be done in both files



