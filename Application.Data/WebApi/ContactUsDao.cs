using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using WebApi.DTO;

namespace Application.Data.WebApi
{
	public class ContactUsDao : IContactUsDao
	{
		private IWebApiClient _webApiClient;

		public ContactUsDao(IWebApiClient webApiClient)
		{
			_webApiClient = webApiClient;
		}

		public async Task<ContactUsDto> CreateContactUs(ContactUsDto model, List<string> outErrors)
		{
			string url = "https://nofb.org/LNVApi/api/CreateContactUs";
			var cancellationToken = new System.Threading.CancellationToken();

			var response = await _webApiClient.PostRequest(cancellationToken, url, model, null);
			if (response != null)
			{
				if (response.StatusCode == HttpStatusCode.OK)
				{
					string body = await response.Content.ReadAsStringAsync();
					var apiResponse = JsonConvert.DeserializeObject<WebApiResponse>(body);
					if (apiResponse != null && apiResponse.Status == WebApiResponseStatus.SUCCESS)
					{
						var dto = JsonConvert.DeserializeObject<ContactUsDto>(apiResponse.Data);
						if (dto != null)
						{
							return dto;
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

		public async Task DeleteContactUs(ContactUsDto model)
		{
			await Task.Delay(0);
			throw new NotImplementedException();
		}

		public async Task<ContactUsDto> GetContactUsById(long id)
		{
			string url = "https://nofb.org/LNVApi/api/GetContactUsById/";

			var cancellationToken = new System.Threading.CancellationToken();
			var uriSegments = new List<string>() { id.ToString() };
			var response = await _webApiClient.GetRequest(cancellationToken, url, uriSegments, null);
			if (response != null)
			{
				if (response.StatusCode == HttpStatusCode.OK)
				{
					string body = await response.Content.ReadAsStringAsync();
					var apiResponse = JsonConvert.DeserializeObject<WebApiResponse>(body);
					if (apiResponse != null && apiResponse.Status == WebApiResponseStatus.SUCCESS)
					{
						var dto = JsonConvert.DeserializeObject<ContactUsDto>(apiResponse.Data);
						if (dto != null)
						{
							return dto;
						}
					}
				}
			}

			return null;
		}

		public async Task<List<ContactUsDto>> GetContactUses(List<OrderByDto> orderBys = null, PagingOrderByDto paging = null)
		{
			await Task.Delay(0);
			throw new NotImplementedException();
		}

		public async Task<ContactUsDto> UpdateContactUs(ContactUsDto model, List<string> outErrors)
		{
			await Task.Delay(0);
			throw new NotImplementedException();
		}
	}
}