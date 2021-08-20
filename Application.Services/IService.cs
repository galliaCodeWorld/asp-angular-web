using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using WebApi.DTO;

namespace Application.Services
{
	public interface IService
	{
		#region MemberDao

		Task<MemberDto> CreateMember(RegisterDto model, List<string> outErrors);

		Task<MemberDto> GetMemberByEmail(string email);

		Task<MemberDto> GetMemberById(int id);

		#endregion MemberDao

		#region CompanyProfileDao

		Task<CompanyProfileDto> GetCompanyProfileById(int id);

		#endregion CompanyProfileDao

		#region CompanyEmployeeDao

		Task<CompanyEmployeeDto> CreateCompanyEmployee(CompanyEmployeeDto model, List<string> outErrors);

		Task<CompanyEmployeeDto> GetCompanyEmployeeByEmail(string email, int companyProfileId);

		#endregion CompanyEmployeeDao

		#region CompanyEmployeeInviteDao

		Task<CompanyEmployeeInviteDto> GetCompanyEmployeeInviteById(long id);

		Task<CompanyEmployeeInviteDto> UpdateCompanyEmployeeInvite(CompanyEmployeeInviteDto model, List<string> outErrors);

		#endregion CompanyEmployeeInviteDao

		#region ContactUsDao

		Task<ContactUsDto> CreateContactUs(ContactUsDto model, List<string> outErrors);

		Task<ContactUsDto> UpdateContactUs(ContactUsDto model, List<string> outErrors);

		Task DeleteContactUs(ContactUsDto model);

		Task<ContactUsDto> GetContactUsById(long id);

		Task<List<ContactUsDto>> GetContactUses(List<OrderByDto> orderBys = null, PagingOrderByDto paging = null);

		#endregion ContactUsDao
	}
}