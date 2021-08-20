using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Data
{
	public class UtilityHelper
	{
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