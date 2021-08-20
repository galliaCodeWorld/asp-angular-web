using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using WebApi.DTO;

namespace Application.Data
{
	public interface IContactUsDao
	{
		#region ContactUsDao

		Task<ContactUsDto> CreateContactUs(ContactUsDto model, List<string> outErrors);

		Task<ContactUsDto> UpdateContactUs(ContactUsDto model, List<string> outErrors);

		Task DeleteContactUs(ContactUsDto model);

		Task<ContactUsDto> GetContactUsById(long id);

		Task<List<ContactUsDto>> GetContactUses(List<OrderByDto> orderBys = null, PagingOrderByDto paging = null);

		#endregion ContactUsDao
	}
}