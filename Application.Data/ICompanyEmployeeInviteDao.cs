using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using WebApi.DTO;

namespace Application.Data
{
	public interface ICompanyEmployeeInviteDao
	{
		Task<CompanyEmployeeInviteDto> GetCompanyEmployeeInviteById(long id);

		Task<CompanyEmployeeInviteDto> UpdateCompanyEmployeeInvite(CompanyEmployeeInviteDto model, List<string> outErrors);
	}
}