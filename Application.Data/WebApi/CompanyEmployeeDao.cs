using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using WebApi.DTO;

namespace Application.Data.WebApi
{
	public class CompanyEmployeeDao : ICompanyEmployeeDao
	{
		private IWebApiClient _webApiClient;

		public CompanyEmployeeDao(IWebApiClient webApiClient)
		{
			_webApiClient = webApiClient;
		}

		public async Task<CompanyEmployeeDto> Create(CompanyEmployeeDto model, List<string> outErrors)
		{
			string url = "https://nofb.org/LNVApi/Pbx/CreateCompanyEmployee/" + model.CompanyProfileId.ToString();
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
						var result = JsonConvert.DeserializeObject<CompanyEmployeeDto>(apiResponse.Data);
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

		public async Task<CompanyEmployeeDto> GetCompanyEmployeeByEmail(string email, int companyProfileId)
		{
			string url = "https://nofb.org/LNVApi/Pbx/GetCompanyEmployeeByEmail/";
			//string url = "http://localhost:18303/Pbx/GetCompanyEmployeeByEmail/";
			var token = await _webApiClient.GetGuestToken();
			var cancellationToken = new System.Threading.CancellationToken();
			var uriSegments = new List<string>() { companyProfileId.ToString(), email };
			var response = await _webApiClient.GetRequest(cancellationToken, url, uriSegments, token.AccessToken);
			if (response != null)
			{
				if (response.StatusCode == HttpStatusCode.OK)
				{
					string body = await response.Content.ReadAsStringAsync();
					var apiResponse = JsonConvert.DeserializeObject<WebApiResponse>(body);
					if (apiResponse != null && apiResponse.Status == WebApiResponseStatus.SUCCESS)
					{
						var result = JsonConvert.DeserializeObject<CompanyEmployeeDto>(apiResponse.Data);
						if (result != null)
						{
							return result;
						}
					}
				}
			}

			return null;
		}
	}
}