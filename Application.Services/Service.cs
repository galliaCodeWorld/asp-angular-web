using Application.Data;
using Application.Data.WebApi;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using WebApi.DTO;

namespace Application.Services
{
	public class Service : IService
	{
		//private IWebApiClient _webApiClient;

		private IMemberDao MemberDao;
		private ICompanyProfileDao CompanyProfileDao;
		private ICompanyEmployeeDao CompanyEmployeeDao;
		private ICompanyEmployeeInviteDao CompanyEmployeeInviteDao;
		private IContactUsDao ContactUsDao;

		public Service(IDaoFactory factory)
		{
			MemberDao = factory.MemberDao;
			CompanyProfileDao = factory.CompanyProfileDao;
			CompanyEmployeeDao = factory.CompanyEmployeeDao;
			CompanyEmployeeInviteDao = factory.CompanyEmployeeInviteDao;
			ContactUsDao = factory.ContactUsDao;
		}

		#region MemberDao

		public async Task<MemberDto> CreateMember(RegisterDto model, List<string> outErrors)
		{
			return await MemberDao.CreateMember(model, outErrors);
		}

		public async Task<MemberDto> GetMemberByEmail(string email)
		{
			return await MemberDao.GetMemberByEmail(email);
		}

		public async Task<MemberDto> GetMemberById(int id)
		{
			return await MemberDao.GetMemberById(id);
		}

		#endregion MemberDao

		#region CompanyProfileDao

		public async Task<CompanyProfileDto> GetCompanyProfileById(int id)
		{
			return await CompanyProfileDao.GetCompanyProfileById(id);
		}

		#endregion CompanyProfileDao

		#region CompanyEmployeeDao

		public async Task<CompanyEmployeeDto> CreateCompanyEmployee(CompanyEmployeeDto model, List<string> outErrors)
		{
			return await CompanyEmployeeDao.Create(model, outErrors);
		}

		public async Task<CompanyEmployeeDto> GetCompanyEmployeeByEmail(string email, int companyProfileId)
		{
			return await CompanyEmployeeDao.GetCompanyEmployeeByEmail(email, companyProfileId);
		}

		#endregion CompanyEmployeeDao

		#region CompanyEmployeeInviteDao

		public async Task<CompanyEmployeeInviteDto> GetCompanyEmployeeInviteById(long id)
		{
			return await CompanyEmployeeInviteDao.GetCompanyEmployeeInviteById(id);
		}

		public async Task<CompanyEmployeeInviteDto> UpdateCompanyEmployeeInvite(CompanyEmployeeInviteDto model, List<string> outErrors)
		{
			return await CompanyEmployeeInviteDao.UpdateCompanyEmployeeInvite(model, outErrors);
		}

		#endregion CompanyEmployeeInviteDao

		#region ContactUsDao

		public async Task<ContactUsDto> CreateContactUs(ContactUsDto model, List<string> outErrors)
		{
			return await ContactUsDao.CreateContactUs(model, outErrors);
		}

		public async Task<ContactUsDto> UpdateContactUs(ContactUsDto model, List<string> outErrors)
		{
			await Task.Delay(0);
			throw new NotImplementedException();
		}

		public async Task DeleteContactUs(ContactUsDto model)
		{
			await Task.Delay(0);
			throw new NotImplementedException();
		}

		public async Task<ContactUsDto> GetContactUsById(long id)
		{
			return await ContactUsDao.GetContactUsById(id);
		}

		public async Task<List<ContactUsDto>> GetContactUses(List<OrderByDto> orderBys = null, PagingOrderByDto paging = null)
		{
			await Task.Delay(0);
			throw new NotImplementedException();
		}

		#endregion ContactUsDao
	}
}