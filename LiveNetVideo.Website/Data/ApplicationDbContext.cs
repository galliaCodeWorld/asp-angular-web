using LiveNetVideo.Website.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;

namespace LiveNetVideo.Website.Data
{
	public class ApplicationDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, int>
	{
		public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
		   : base(options)
		{
		}

		protected override void OnModelCreating(ModelBuilder builder)
		{
			base.OnModelCreating(builder);
			// Customize the ASP.NET Identity model and override the defaults if needed. For example,
			// you can rename the ASP.NET Identity table names and more. Add your customizations
			// after calling base.OnModelCreating(builder);

			builder.Entity<ApplicationUser>(i =>
			{
				i.ToTable("member", "net");
				i.HasKey(x => x.Id);
			});
			//builder.Entity<ApplicationUser>().Property(r => r.Id).HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
			builder.Entity<ApplicationUser>().Property(r => r.Id).ValueGeneratedOnAdd();
			builder.Entity<ApplicationUser>().Property(r => r.Id).HasColumnName("memberID");
			builder.Entity<ApplicationUser>().Property(r => r.Email).HasColumnName("email");
			builder.Entity<ApplicationUser>().Property(r => r.EmailConfirmed).HasColumnName("isVerified");
			builder.Entity<ApplicationUser>().Property(r => r.PasswordHash).HasColumnName("hPassword");
			builder.Entity<ApplicationUser>().Property(r => r.PhoneNumber).HasColumnName("lanPhone");
			builder.Entity<ApplicationUser>().Property(r => r.AccessFailedCount).HasColumnName("loginAttempts");
			builder.Entity<ApplicationUser>().Property(r => r.UserName).HasColumnName("username");
			builder.Entity<ApplicationUser>().Property(r => r.SecurityStamp).HasColumnName("aspNetIdentitySecurityStamp");
			builder.Entity<ApplicationUser>().Property(r => r.PhoneNumberConfirmed).HasColumnName("aspNetIdentityPhoneNumberConfirmed");
			builder.Entity<ApplicationUser>().Property(r => r.TwoFactorEnabled).HasColumnName("aspNetIdentityTwoFactorEnabled");
			builder.Entity<ApplicationUser>().Property(r => r.LockoutEnd).HasColumnName("aspNetIdentityLockoutEndDateUtc");
			builder.Entity<ApplicationUser>().Property(r => r.LockoutEnabled).HasColumnName("aspNetIdentityLockoutEnabled");
			builder.Entity<ApplicationUser>().Property(r => r.FirstName).HasColumnName("firstName");
			builder.Entity<ApplicationUser>().Property(r => r.LastName).HasColumnName("lastName");
			builder.Entity<ApplicationUser>().Property(r => r.AvatarDataUri).HasColumnName("avatarDataUri");
			builder.Entity<ApplicationUser>().Property(r => r.IsSuspended).HasColumnName("isSuspended");
			builder.Entity<ApplicationUser>().Property(r => r.AccessToken).HasColumnName("accessToken");
			builder.Entity<ApplicationUser>().Property(r => r.AltEmail).HasColumnName("altEmail");
			builder.Entity<ApplicationUser>().Property(r => r.CellPhone).HasColumnName("cellPhone");
			builder.Entity<ApplicationUser>().Property(r => r.Fax).HasColumnName("fax");
			builder.Entity<ApplicationUser>().Property(r => r.MailingAddress).HasColumnName("mailingAddress");
			builder.Entity<ApplicationUser>().Property(r => r.SmsCarrierId).HasColumnName("smsCarrierID");
			builder.Entity<ApplicationUser>().Property(r => r.AvatarFilename).HasColumnName("avatarFilename");

			builder.Entity<ApplicationRole>(i =>
			{
				i.HasKey(x => x.Id);
			});
			builder.Entity<ApplicationRole>().Property(r => r.Id).ValueGeneratedOnAdd();

			builder.Entity<IdentityUserRole<int>>(i =>
			{
				i.HasKey(x => new { x.RoleId, x.UserId });
			});
			builder.Entity<IdentityUserLogin<int>>(i =>
			{
				i.HasKey(x => new { x.ProviderKey, x.LoginProvider });
			});
			builder.Entity<IdentityRoleClaim<int>>(i =>
			{
				i.HasKey(x => x.Id);
			});
			builder.Entity<IdentityUserClaim<int>>(i =>
			{
				i.HasKey(x => x.Id);
			});
			builder.Entity<IdentityUserClaim<int>>().Property(r => r.Id).ValueGeneratedOnAdd();
		}
	}
}