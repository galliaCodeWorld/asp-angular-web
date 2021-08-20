using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using WebApi.DTO;

namespace Application.Data.WebApi
{
	public class CompanyEmployeeInviteDao : ICompanyEmployeeInviteDao
	{
		private IWebApiClient _webApiClient;

		public CompanyEmployeeInviteDao(IWebApiClient webApiClient)
		{
			_webApiClient = webApiClient;
		}

		public async Task<CompanyEmployeeInviteDto> GetCompanyEmployeeInviteById(long id)
		{
			string url = "https://nofb.org/LNVApi/Pbx/GetCompanyEmployeeInviteById/";
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
						var result = JsonConvert.DeserializeObject<CompanyEmployeeInviteDto>(apiResponse.Data);
						if (result != null)
						{
							return result;
						}
					}
				}
			}

			return null;
		}

		public async Task<CompanyEmployeeInviteDto> UpdateCompanyEmployeeInvite(CompanyEmployeeInviteDto model, List<string> outErrors)
		{
			string url = "https://nofb.org/LNVApi/Pbx/UpdateCompanyEmployeeInvite/" + model.CompanyProfileId.ToString();
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
						var result = JsonConvert.DeserializeObject<CompanyEmployeeInviteDto>(apiResponse.Data);
						if (result != null)
						{
							return result;
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
	}
}