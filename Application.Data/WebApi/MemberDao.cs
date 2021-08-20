using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using WebApi.DTO;

namespace Application.Data.WebApi
{
	public class MemberDao : IMemberDao
	{
		private IWebApiClient _webApiClient;

		public MemberDao(IWebApiClient webApiClient)
		{
			_webApiClient = webApiClient;
		}

		public async Task<MemberDto> CreateMember(RegisterDto model, List<string> outErrors)
		{
			string url = "https://nofb.org/LNVApi/Member/Register";
			var token = await _webApiClient.GetGuestToken();
			var cancellationToken = new System.Threading.CancellationToken();

			var response = await _webApiClient.PostRequest(cancellationToken, url, model, token.AccessToken);
			if (response != null)
			{
				if (response.StatusCode == HttpStatusCode.OK)
				{
					string body = await response.Content.ReadAsStringAsync();
					var apiResponse = JsonConvert.DeserializeObject<WebApiResponse>(body);
					if (apiResponse != null && apiResponse.Status == WebApiResponseStatus.SUCCESS)
					{
						var member = JsonConvert.DeserializeObject<MemberDto>(apiResponse.Data);
						if (member != null)
						{
							return member;
						}
					}
					else
					{
						outErrors = JsonConvert.DeserializeObject<List<string>>(apiResponse.Data);
					}
				}
			}

			return null;
		}

		public async Task<MemberDto> GetMemberByEmail(string email)
		{
			string url = "https://nofb.org/LNVApi/Member/GetMemberByEmail";
			var token = await _webApiClient.GetGuestToken();
			var cancellationToken = new System.Threading.CancellationToken();

			var response = await _webApiClient.PostRequest(cancellationToken, url, new EmailDto() { Email = email, OrderBy = null, Paging = null }, token.AccessToken);
			if (response != null)
			{
				if (response.StatusCode == HttpStatusCode.OK)
				{
					string body = await response.Content.ReadAsStringAsync();
					var apiResponse = JsonConvert.DeserializeObject<WebApiResponse>(body);
					if (apiResponse != null && apiResponse.Status == WebApiResponseStatus.SUCCESS)
					{
						var member = JsonConvert.DeserializeObject<MemberDto>(apiResponse.Data);
						if (member != null)
						{
							return member;
						}
					}
				}
			}

			return null;
		}

		public async Task<MemberDto> GetMemberById(int id)
		{
			string url = "https://nofb.org/LNVApi/Member/GetMemberById";
			var token = await _webApiClient.GetGuestToken();
			var cancellationToken = new System.Threading.CancellationToken();
			var uriSegments = new List<string>() { id.ToString() };
			var response = await _webApiClient.GetRequest(cancellationToken, url, uriSegments, token.AccessToken);
			if (response != null)
			{
				if (response.StatusCode == HttpStatusCode.OK)
				{
					string body = await response.Content.ReadAsStringAsync();
					var apiResponse = JsonConvert.DeserializeObject<WebApiResponse>(body);
					if (apiResponse != null && apiResponse.Status == WebApiResponseStatus.SUCCESS)
					{
						var member = JsonConvert.DeserializeObject<MemberDto>(apiResponse.Data);
						if (member != null)
						{
							return member;
						}
					}
				}
			}

			return null;
		}
	}
}