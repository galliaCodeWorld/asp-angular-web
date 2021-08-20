# LiveNetVideo-Website

NOTE: main README.md is located in the web project folder
LiveNetVideo.Website/README.md

The site (livenetvideo.com) is hosted on infolinkdb3 using IIRF isapi filter
for php rewrite to remove requirement for index.php.

The phone app is located in "Phone" folder.

NOTES: Use IIRF isapi filter for url rewrite instead of 
IIS URL_Rewrite module. The Url_Rewrite modules will 
conflict with the .php and the Phone sub application folder.

## Development
All settings should be put into config.service.ts



## Debugging
Run command, note this will delete the wwwroot/dist folder 
```console
ng serve
```

## Production Build
to publish to the webserver
```console
ng build --prod --aot=false
```
TODO: need to remove --aot=false. If --aot=false is omitted, then you will get build errors

After ng build --prod --aot=false, you will get a dist folder (wwwroot/dist), copy these elements of the index.html
into your .cshtml file

TODO: need a taskrunner to do the copying or modifying automatically with build

dist/index.html
```html
<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<title>Livenetvideo</title>
	<base href="./">
	<meta name="viewport" content="width=device-width,initial-scale=1">
	<link rel="icon" type="image/x-icon" href="favicon.ico"><!--<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">--><!--<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bulma/0.6.0/css/bulma.css">-->
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.css"><!-- <link rel="stylesheet" href="~/dist/vendor.css" asp-append-version="true" /> -->
	<link href="https://fonts.googleapis.com/css?family=Open+Sans" rel="stylesheet">
	<link href="https://fonts.googleapis.com/css?family=Roboto:300,400,700" rel="stylesheet">
	<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=News+Cycle:400,700">
	<style></style>
	<link href="styles.7e15d8a986045f2a3065.bundle.css" rel="stylesheet" />
</head>
<body>
	<app></app>
	<script type="text/javascript" src="inline.e9ccdda81e63a931e66b.bundle.js"></script>
	<script type="text/javascript" src="polyfills.4d35a5fcdd5eda47e868.bundle.js"></script>
	<script type="text/javascript" src="scripts.b9141765c843230f1a92.bundle.js"></script>
	<script type="text/javascript" src="vendor.b79fd418036983e39220.bundle.js"></script>
	<script type="text/javascript" src="main.4f2a5858da6abac1a3f3.bundle.js"></script>
</body>
</html>
```

Views/Home/WebPhone.cshtml
```html
@{
	Layout = null;
}

@model LiveNetVideo.Website.Models.WebPhoneViewModel

<!doctype html>
<html lang="en">

<head>
	<meta charset="utf-8">
	<title>Livenetvideo</title>
	<base href="~/dist/">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="icon" type="image/x-icon" href="favicon.ico">
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.css"><!-- <link rel="stylesheet" href="~/dist/vendor.css" asp-append-version="true" /> -->
	<link href="https://fonts.googleapis.com/css?family=Open+Sans" rel="stylesheet">
	<link href="https://fonts.googleapis.com/css?family=Roboto:300,400,700" rel="stylesheet">
	<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=News+Cycle:400,700">
	<style></style>
	<link href="styles.7e15d8a986045f2a3065.bundle.css" rel="stylesheet" />
</head>

<body>
	<app pbx-line-id="@Model.PbxLineId.ToString()"></app>

	<script type="text/javascript" src="~/dist/inline.e9ccdda81e63a931e66b.bundle.js"></script>
	<script type="text/javascript" src="~/dist/polyfills.4d35a5fcdd5eda47e868.bundle.js"></script>
	<script type="text/javascript" src="~/dist/scripts.b9141765c843230f1a92.bundle.js"></script>
	<script type="text/javascript" src="~/dist/vendor.b79fd418036983e39220.bundle.js"></script>
	<script type="text/javascript" src="~/dist/main.4f2a5858da6abac1a3f3.bundle.js"></script>
</body>
</html>
```

publish the production build to 
infolinkdb3 E:\www2\LiveNetVideo.com\Phone

NOTE: livenetvideo.com uses IIRF for url rewrite to remove the index.php instead 
of usign IIS Url_Rewrite Module because, Url_Rewrite module currently isn't working
because of permission to Phone folder is disabled using Url_Rewrite module for IIS_



