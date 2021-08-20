using Microsoft.AspNetCore.Html;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;

namespace LiveNetVideo.Website.Services
{
	public class UtilityHelper
	{
		public static HttpRequestMessage BuildHttpRequestMessage(HttpMethod method, string absoluteUrl, string bearer = "", List<string> uriSegments = null)
		{
			Uri uri;
			if (uriSegments != null)
			{
				absoluteUrl = CleanUrl(absoluteUrl);
				string segments = uriSegments != null ? string.Join("/", uriSegments.Select(m => System.Uri.EscapeDataString(m))) : "";
				//uri = new Uri(string.Format(endPoint + "/{0}", segments), UriKind.Relative);
				uri = new Uri(string.Format(absoluteUrl + "/{0}", segments), UriKind.Absolute);
			}
			else
			{
				//uri = new Uri(endPoint, UriKind.Relative);
				uri = new Uri(absoluteUrl, UriKind.Absolute);
			}

			//var httpRequestMessage = new HttpRequestMessage(HttpMethod.Post, uri);
			var httpRequestMessage = new HttpRequestMessage(method, uri);
			httpRequestMessage.Headers.Clear();
			httpRequestMessage.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/x-www-form-urlencoded"));
			httpRequestMessage.Headers.Add("cache-control", "no-cache");
			if (string.IsNullOrEmpty(bearer) == false)
			{
				httpRequestMessage.Headers.Authorization = new AuthenticationHeaderValue("Bearer", bearer);
			}

			return httpRequestMessage;
		}

		public static string BuildAbsolutelUrl(string baseAddress, string endPoint)
		{
			return string.Format(CleanUrl(baseAddress) + CleanUrl(endPoint));
		}

		public static string CleanUrl(string url)
		{
			if (!string.IsNullOrEmpty(url))
			{
				// checks if the last character is a foward slash and removes it if it is
				char lastChar = url[url.Length - 1];
				if (lastChar.Equals('/'))
				{
					url = url.Substring(0, url.Length - 1);
				}

				//checks if the first character is a ~, removes it if it is
				char firstChar = url[0];
				if (firstChar == '~')
				{
					url = url.Substring(1, url.Length - 1);
				}
			}

			return url;
		}

		public static string DisplayAlert(string message = "", string title = "", string alertType = "alert-danger", bool isDismissable = true)
		{
			string alert = "<div class=\"alert @(alertType)";
			if (isDismissable == true)
			{
				alert += " alert-dismissable \"";
			}
			alert += " role=\"alert\">";
			if (isDismissable == true)
			{
				alert += "<button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-label=\"Close\"><span aria-hidden=\"true\">&times;</span></button>";
			}
			if (!string.IsNullOrEmpty(title))
			{
				alert += "<strong>@(title)</strong>";
			}
			alert += message + "</div>";

			return alert;
		}

		public static string Base64Encode(string text)
		{
			if (!string.IsNullOrEmpty(text))
			{
				var plainTextBytes = System.Text.Encoding.UTF8.GetBytes(text);
				return System.Convert.ToBase64String(plainTextBytes);
			}

			return "";
		}

		public static string Base64Decode(string base64EncodedText)
		{
			if (!string.IsNullOrEmpty(base64EncodedText))
			{
				var base64EncodedBytes = System.Convert.FromBase64String(base64EncodedText);
				return System.Text.Encoding.UTF8.GetString(base64EncodedBytes);
			}
			return "";
		}
	}
}