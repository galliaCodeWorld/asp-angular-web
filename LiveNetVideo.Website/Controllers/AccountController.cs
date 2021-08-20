using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using LiveNetVideo.Website.Models;
using LiveNetVideo.Website.Models.AccountViewModels;
using LiveNetVideo.Website.Services;
using PaulMiami.AspNetCore.Mvc.Recaptcha;
using Microsoft.AspNetCore.Authentication;
using System.Net.Http;
using Application.Services;
using System.Net;
using Newtonsoft.Json;
using WebApi.DTO;
using System.Threading;

namespace LiveNetVideo.Website.Controllers
{
	[Authorize]
	public class AccountController : Controller
	{
		private readonly UserManager<ApplicationUser> _userManager;
		private readonly SignInManager<ApplicationUser> _signInManager;
		private readonly IEmailSender _emailSender;
		private readonly ISmsSender _smsSender;
		private readonly ILogger _logger;
		//private readonly string _externalCookieScheme;

		private IService _service;
		private IWebApiClient _webApiClient;

		private readonly IOptions<AppSettings> _appSettings;

		public AccountController(
			UserManager<ApplicationUser> userManager,
			SignInManager<ApplicationUser> signInManager,
			//IOptions<IdentityCookieOptions> identityCookieOptions,
			IEmailSender emailSender,
			ISmsSender smsSender,
			ILoggerFactory loggerFactory,
			IService service,
			IWebApiClient webApiClient,
			IOptions<AppSettings> appSettings)
		{
			_userManager = userManager;
			_signInManager = signInManager;
			// _externalCookieScheme = identityCookieOptions.Value.ExternalCookieAuthenticationScheme;
			_emailSender = emailSender;
			_smsSender = smsSender;
			_logger = loggerFactory.CreateLogger<AccountController>();

			_service = service;

			_appSettings = appSettings;

			//var webApiConfig = new WebApiConfig()
			//{
			//	ApiBaseUrl = _appSettings.Value.JwtAuthBase,
			//	ClientSecret = _appSettings.Value.JwtClientSecret,
			//	GuestTokenEndPoint = _appSettings.Value.JwtTokenEndPoints,
			//	MemberTokenEndPoint = _appSettings.Value.JwtTokenEndPoints,
			//	RefreshTokenEndPoint = _appSettings.Value.JwtTokenEndPoints
			//};

			//_webApiClient = new WebApiClient(new LocalStorage(), webApiConfig);

			_webApiClient = webApiClient;
		}

		[HttpGet]
		[AllowAnonymous]
		public async Task<IActionResult> EmployeeInvite(long id)
		{
			var errorMessages = new List<string>();

			var model = new EmployeeInviteViewModel();

			var employeeInvite = await _service.GetCompanyEmployeeInviteById(id);
			if (employeeInvite != null)
			{
				// check if the user has already accepted this invitation, if already accepted, send
				// them to app
				if (employeeInvite.IsAccepted == null || employeeInvite.IsAccepted == false)
				{
					// check to see if the invitee is already a member
					var member = await _service.GetMemberByEmail(employeeInvite.Email);
					model.EmployeeInvite = employeeInvite;
					model.Member = member;
					model.DenyLink = _appSettings.Value.BaseUrl + "Account/EmployeeInviteDeny/" + employeeInvite.CompanyEmployeeInviteId;
					if (member != null)
					{
						model.AcceptLink = _appSettings.Value.BaseUrl + "Account/EmployeeInviteAccept?id=" + employeeInvite.CompanyEmployeeInviteId.ToString() + "&memberId=" + member.MemberId.ToString();
					}
					else
					{
						model.Registration = new EmployeeInviteRegisterViewModel()
						{
							CompanyEmployeeInviteId = employeeInvite.CompanyEmployeeInviteId,
							FirstName = employeeInvite.FirstName,
							LastName = employeeInvite.LastName,
							Email = employeeInvite.Email,
							AltEmail = "",
							Password = "",
							Username = employeeInvite.Email,
							AvatarDataUri = "",
							IsSuspended = false,
							IsVerified = true
						};
					}
				}
				else
				{
					return RedirectToAction("Index", "Home");
				}
			}

			ViewBag.ErrorMessages = errorMessages;

			return View("~/Views/Account/EmployeeInvite.cshtml", model);
		}

		[HttpGet]
		[AllowAnonymous]
		public async Task<IActionResult> EmployeeInviteDeny(long id)
		{
			var errorMessages = new List<string>();

			var model = new EmployeeInviteDenyViewModel();

			var employeeInvite = await _service.GetCompanyEmployeeInviteById(id);
			if (employeeInvite != null)
			{
				employeeInvite.IsAccepted = false;

				await _service.UpdateCompanyEmployeeInvite(employeeInvite, errorMessages);
			}

			ViewBag.ErrorMessages = errorMessages;

			return View("~/Views/Account/EmployeeInviteDeny.cshtml", model);
		}

		[HttpGet]
		[AllowAnonymous]
		public async Task<IActionResult> EmployeeInviteAccept(long id, int memberId)
		{
			var errorMessages = new List<string>();
			var model = new EmployeeInviteAcceptViewModel();
			var employeeInvite = await _service.GetCompanyEmployeeInviteById(id);
			if (employeeInvite != null)
			{
				// make sure memberId provided is valid
				var member = await _service.GetMemberById(memberId);
				if (member != null)
				{
					// make sure retrieved member email is same as the invite email
					if (member.Email.ToLower() == employeeInvite.Email.ToLower())
					{
						employeeInvite.IsAccepted = true;
						employeeInvite.DateAccepted = DateTime.UtcNow;
						await _service.UpdateCompanyEmployeeInvite(employeeInvite, errorMessages);

						//string email = UtilityHelper.Base64Encode(employeeInvite.Email);
						string email = member.Email.ToLower();
						var existingEmployee = await _service.GetCompanyEmployeeByEmail(email, employeeInvite.CompanyProfileId);
						if (existingEmployee == null)
						{
							var companyEmployee = new CompanyEmployeeDto()
							{
								CompanyProfileId = employeeInvite.CompanyProfileId,
								CreatedDate = DateTime.UtcNow,
								MemberId = memberId,
								Title = "New Employee",
								AvatarFilename = "",
								IsSuspended = false,
								FirstName = employeeInvite.FirstName,
								LastName = employeeInvite.LastName
							};

							companyEmployee = await _service.CreateCompanyEmployee(companyEmployee, errorMessages);
							if (companyEmployee != null && companyEmployee.CompanyEmployeeId > 0)
							{
								// redirect user to angular app page
								return RedirectToAction("Index", "Home");
							}
							else
							{
								// an error occured, do a roll back
								employeeInvite.IsAccepted = false;
								employeeInvite.DateAccepted = null;
								await _service.UpdateCompanyEmployeeInvite(employeeInvite, errorMessages);
								errorMessages.Add("An error occurred while trying to add the employee.");
							}
						}
						else
						{
							// user is already an employee
							return RedirectToAction("Index", "Home");
						}
					}
					else
					{
						errorMessages.Add("An error mismatch email.");
					}
				}
				else
				{
					errorMessages.Add("Unable to authenticate user.");
				}
			}

			ViewBag.ErrorMessages = errorMessages;

			return View("~/Views/Account/EmployeeInviteAccept.cshtml", model);
		}

		// POST: /Account/Register
		[ValidateRecaptcha]
		[HttpPost]
		[AllowAnonymous]
		[ValidateAntiForgeryToken]
		public async Task<IActionResult> EmployeeInviteRegister(EmployeeInviteRegisterViewModel post)
		{
			List<string> errorMessages = new List<string>();
			if (ModelState.IsValid && post != null)
			{
				var employeeInvite = await _service.GetCompanyEmployeeInviteById(post.CompanyEmployeeInviteId);
				// make sure the email matches
				if (employeeInvite != null && employeeInvite.Email == post.Email)
				{
					var registerDto = new RegisterDto()
					{
						FirstName = post.FirstName,
						LastName = post.LastName,
						Email = post.Email,
						AltEmail = post.AltEmail,
						Password = post.Password,
						Username = post.Email,
						AvatarDataUri = post.AvatarDataUri,
						IsSuspended = false,
						IsVerified = true
					};

					var member = await _service.CreateMember(registerDto, errorMessages);
					if (member != null && member.MemberId > 0)
					{
						// now we can add the member as a employee
						employeeInvite.IsAccepted = true;
						employeeInvite.DateAccepted = DateTime.UtcNow;
						await _service.UpdateCompanyEmployeeInvite(employeeInvite, errorMessages);

						var companyEmployee = new CompanyEmployeeDto()
						{
							CompanyProfileId = employeeInvite.CompanyProfileId,
							CreatedDate = DateTime.UtcNow,
							MemberId = member.MemberId,
							Title = "New Employee",
							AvatarFilename = "",
							IsSuspended = false,
							FirstName = member.FirstName,
							LastName = member.LastName
						};

						companyEmployee = await _service.CreateCompanyEmployee(companyEmployee, errorMessages);
						if (companyEmployee != null && companyEmployee.CompanyEmployeeId > 0)
						{
							// redirect user to angular app page
							//return RedirectToAction("Index", "Home");
							//return new RedirectResult("https://livenetvideo.com/Phone/dist/#/login");
							return new RedirectResult("https://" + HttpContext.Request.Host + "/Phone/dist/#/login");
						}
						else
						{
							// an error occured, do a roll back
							employeeInvite.IsAccepted = false;
							employeeInvite.DateAccepted = null;
							await _service.UpdateCompanyEmployeeInvite(employeeInvite, errorMessages);
							errorMessages.Add("An error occurred while trying to add the employee.");
						}
					}
					else
					{
						errorMessages.Add("An error occurred while trying to add the user as a member.");
					}
				}
				else
				{
					errorMessages.Add("Unable to retrieve invitation.");
				}
			}
			else
			{
				var allErrors = ModelState.Values.SelectMany(v => v.Errors.Select(b => b.ErrorMessage));
				foreach (var error in allErrors)
				{
					errorMessages.Add(error);
				}
			}

			ViewBag.ErrorMessages = errorMessages;

			// If we got this far, something failed, redisplay form
			return View("~/Views/Account/EmployeeInviteRegister.cshtml", post);
		}

		// GET: /Account/Login
		[HttpGet]
		[AllowAnonymous]
		public async Task<IActionResult> Login(string returnUrl = null)
		{
			// Clear the existing external cookie to ensure a clean login process
			//await HttpContext.Authentication.SignOutAsync(_externalCookieScheme);
			await HttpContext.SignOutAsync(IdentityConstants.ExternalScheme);

			ViewData["ReturnUrl"] = returnUrl;
			return View();
		}

		// POST: /Account/Login
		[HttpPost]
		[AllowAnonymous]
		[ValidateAntiForgeryToken]
		public async Task<IActionResult> Login(LoginViewModel model, string returnUrl = null)
		{
			ViewData["ReturnUrl"] = returnUrl;
			if (ModelState.IsValid)
			{
				// This doesn't count login failures towards account lockout To enable password
				// failures to trigger account lockout, set lockoutOnFailure: true
				var result = await _signInManager.PasswordSignInAsync(model.Email, model.Password, model.RememberMe, lockoutOnFailure: false);
				if (result.Succeeded)
				{
					_logger.LogInformation(1, "User logged in.");
					return RedirectToLocal(returnUrl);
				}
				if (result.RequiresTwoFactor)
				{
					return RedirectToAction(nameof(SendCode), new { ReturnUrl = returnUrl, RememberMe = model.RememberMe });
				}
				if (result.IsLockedOut)
				{
					_logger.LogWarning(2, "User account locked out.");
					return View("Lockout");
				}
				else
				{
					ModelState.AddModelError(string.Empty, "Invalid login attempt.");
					return View(model);
				}
			}

			// If we got this far, something failed, redisplay form
			return View(model);
		}

		// GET: /Account/Register
		[HttpGet]
		[AllowAnonymous]
		public IActionResult Register(string returnUrl = null)
		{
			ViewData["ReturnUrl"] = returnUrl;
			return View();
		}

		// POST: /Account/Register
		[ValidateRecaptcha]
		[HttpPost]
		[AllowAnonymous]
		[ValidateAntiForgeryToken]
		public async Task<IActionResult> Register(RegisterViewModel model, string returnUrl = null)
		{
			ViewData["ReturnUrl"] = returnUrl;
			if (ModelState.IsValid)
			{
				var user = new ApplicationUser { UserName = model.Email, Email = model.Email, FirstName = model.FirstName, LastName = model.LastName };
				var result = await _userManager.CreateAsync(user, model.Password);
				if (result.Succeeded)
				{
					// For more information on how to enable account confirmation and password reset please visit https://go.microsoft.com/fwlink/?LinkID=532713
					// Send an email with this link
					//var code = await _userManager.GenerateEmailConfirmationTokenAsync(user);
					//var callbackUrl = Url.Action(nameof(ConfirmEmail), "Account", new { userId = user.Id, code = code }, protocol: HttpContext.Request.Scheme);
					//await _emailSender.SendEmailAsync(model.Email, "Confirm your account",
					//    $"Please confirm your account by clicking this link: <a href='{callbackUrl}'>link</a>");
					await _signInManager.SignInAsync(user, isPersistent: false);
					_logger.LogInformation(3, "User created a new account with password.");
					return RedirectToLocal(returnUrl);
				}
				AddErrors(result);
			}

			// If we got this far, something failed, redisplay form
			return View(model);
		}

		// POST: /Account/Logout
		[HttpPost]
		[ValidateAntiForgeryToken]
		public async Task<IActionResult> Logout()
		{
			await _signInManager.SignOutAsync();
			_logger.LogInformation(4, "User logged out.");
			return RedirectToAction(nameof(HomeController.Index), "Home");
		}

		// POST: /Account/ExternalLogin
		[HttpPost]
		[AllowAnonymous]
		[ValidateAntiForgeryToken]
		public IActionResult ExternalLogin(string provider, string returnUrl = null)
		{
			// Request a redirect to the external login provider.
			var redirectUrl = Url.Action(nameof(ExternalLoginCallback), "Account", new { ReturnUrl = returnUrl });
			var properties = _signInManager.ConfigureExternalAuthenticationProperties(provider, redirectUrl);
			return Challenge(properties, provider);
		}

		// GET: /Account/ExternalLoginCallback
		[HttpGet]
		[AllowAnonymous]
		public async Task<IActionResult> ExternalLoginCallback(string returnUrl = null, string remoteError = null)
		{
			if (remoteError != null)
			{
				ModelState.AddModelError(string.Empty, $"Error from external provider: {remoteError}");
				return View(nameof(Login));
			}
			var info = await _signInManager.GetExternalLoginInfoAsync();
			if (info == null)
			{
				return RedirectToAction(nameof(Login));
			}

			// Sign in the user with this external login provider if the user already has a login.
			var result = await _signInManager.ExternalLoginSignInAsync(info.LoginProvider, info.ProviderKey, isPersistent: false);
			if (result.Succeeded)
			{
				_logger.LogInformation(5, "User logged in with {Name} provider.", info.LoginProvider);
				return RedirectToLocal(returnUrl);
			}
			if (result.RequiresTwoFactor)
			{
				return RedirectToAction(nameof(SendCode), new { ReturnUrl = returnUrl });
			}
			if (result.IsLockedOut)
			{
				return View("Lockout");
			}
			else
			{
				// If the user does not have an account, then ask the user to create an account.
				ViewData["ReturnUrl"] = returnUrl;
				ViewData["LoginProvider"] = info.LoginProvider;
				var email = info.Principal.FindFirstValue(ClaimTypes.Email);
				return View("ExternalLoginConfirmation", new ExternalLoginConfirmationViewModel { Email = email });
			}
		}

		// POST: /Account/ExternalLoginConfirmation
		[HttpPost]
		[AllowAnonymous]
		[ValidateAntiForgeryToken]
		public async Task<IActionResult> ExternalLoginConfirmation(ExternalLoginConfirmationViewModel model, string returnUrl = null)
		{
			if (ModelState.IsValid)
			{
				// Get the information about the user from the external login provider
				var info = await _signInManager.GetExternalLoginInfoAsync();
				if (info == null)
				{
					return View("ExternalLoginFailure");
				}
				var user = new ApplicationUser { UserName = model.Email, Email = model.Email };
				var result = await _userManager.CreateAsync(user);
				if (result.Succeeded)
				{
					result = await _userManager.AddLoginAsync(user, info);
					if (result.Succeeded)
					{
						await _signInManager.SignInAsync(user, isPersistent: false);
						_logger.LogInformation(6, "User created an account using {Name} provider.", info.LoginProvider);
						return RedirectToLocal(returnUrl);
					}
				}
				AddErrors(result);
			}

			ViewData["ReturnUrl"] = returnUrl;
			return View(model);
		}

		// GET: /Account/ConfirmEmail
		[HttpGet]
		[AllowAnonymous]
		public async Task<IActionResult> ConfirmEmail(string userId, string code)
		{
			if (userId == null || code == null)
			{
				return View("Error");
			}
			var user = await _userManager.FindByIdAsync(userId);
			if (user == null)
			{
				return View("Error");
			}
			var result = await _userManager.ConfirmEmailAsync(user, code);
			return View(result.Succeeded ? "ConfirmEmail" : "Error");
		}

		// GET: /Account/ForgotPassword
		[HttpGet]
		[AllowAnonymous]
		public IActionResult ForgotPassword()
		{
			return View();
		}

		// POST: /Account/ForgotPassword
		[HttpPost]
		[AllowAnonymous]
		[ValidateAntiForgeryToken]
		public async Task<IActionResult> ForgotPassword(ForgotPasswordViewModel model)
		{
			if (ModelState.IsValid)
			{
				var user = await _userManager.FindByEmailAsync(model.Email);
				if (user == null || !(await _userManager.IsEmailConfirmedAsync(user)))
				{
					// Don't reveal that the user does not exist or is not confirmed
					return View("ForgotPasswordConfirmation");
				}

				// For more information on how to enable account confirmation and password reset please visit https://go.microsoft.com/fwlink/?LinkID=532713
				// Send an email with this link
				//var code = await _userManager.GeneratePasswordResetTokenAsync(user);
				//var callbackUrl = Url.Action(nameof(ResetPassword), "Account", new { userId = user.Id, code = code }, protocol: HttpContext.Request.Scheme);
				//await _emailSender.SendEmailAsync(model.Email, "Reset Password",
				//   $"Please reset your password by clicking here: <a href='{callbackUrl}'>link</a>");
				//return View("ForgotPasswordConfirmation");
			}

			// If we got this far, something failed, redisplay form
			return View(model);
		}

		// GET: /Account/ForgotPasswordConfirmation
		[HttpGet]
		[AllowAnonymous]
		public IActionResult ForgotPasswordConfirmation()
		{
			return View();
		}

		// GET: /Account/ResetPassword
		[HttpGet]
		[AllowAnonymous]
		public IActionResult ResetPassword(string code = null)
		{
			return code == null ? View("Error") : View();
		}

		// POST: /Account/ResetPassword
		[HttpPost]
		[AllowAnonymous]
		[ValidateAntiForgeryToken]
		public async Task<IActionResult> ResetPassword(ResetPasswordViewModel model)
		{
			if (!ModelState.IsValid)
			{
				return View(model);
			}
			var user = await _userManager.FindByEmailAsync(model.Email);
			if (user == null)
			{
				// Don't reveal that the user does not exist
				return RedirectToAction(nameof(AccountController.ResetPasswordConfirmation), "Account");
			}
			var result = await _userManager.ResetPasswordAsync(user, model.Code, model.Password);
			if (result.Succeeded)
			{
				return RedirectToAction(nameof(AccountController.ResetPasswordConfirmation), "Account");
			}
			AddErrors(result);
			return View();
		}

		// GET: /Account/ResetPasswordConfirmation
		[HttpGet]
		[AllowAnonymous]
		public IActionResult ResetPasswordConfirmation()
		{
			return View();
		}

		// GET: /Account/SendCode
		[HttpGet]
		[AllowAnonymous]
		public async Task<ActionResult> SendCode(string returnUrl = null, bool rememberMe = false)
		{
			var user = await _signInManager.GetTwoFactorAuthenticationUserAsync();
			if (user == null)
			{
				return View("Error");
			}
			var userFactors = await _userManager.GetValidTwoFactorProvidersAsync(user);
			var factorOptions = userFactors.Select(purpose => new SelectListItem { Text = purpose, Value = purpose }).ToList();
			return View(new SendCodeViewModel { Providers = factorOptions, ReturnUrl = returnUrl, RememberMe = rememberMe });
		}

		// POST: /Account/SendCode
		[HttpPost]
		[AllowAnonymous]
		[ValidateAntiForgeryToken]
		public async Task<IActionResult> SendCode(SendCodeViewModel model)
		{
			if (!ModelState.IsValid)
			{
				return View();
			}

			var user = await _signInManager.GetTwoFactorAuthenticationUserAsync();
			if (user == null)
			{
				return View("Error");
			}

			// Generate the token and send it
			var code = await _userManager.GenerateTwoFactorTokenAsync(user, model.SelectedProvider);
			if (string.IsNullOrWhiteSpace(code))
			{
				return View("Error");
			}

			var message = "Your security code is: " + code;
			if (model.SelectedProvider == "Email")
			{
				await _emailSender.SendEmailAsync(await _userManager.GetEmailAsync(user), "Security Code", message);
			}
			else if (model.SelectedProvider == "Phone")
			{
				await _smsSender.SendSmsAsync(await _userManager.GetPhoneNumberAsync(user), message);
			}

			return RedirectToAction(nameof(VerifyCode), new { Provider = model.SelectedProvider, ReturnUrl = model.ReturnUrl, RememberMe = model.RememberMe });
		}

		// GET: /Account/VerifyCode
		[HttpGet]
		[AllowAnonymous]
		public async Task<IActionResult> VerifyCode(string provider, bool rememberMe, string returnUrl = null)
		{
			// Require that the user has already logged in via username/password or external login
			var user = await _signInManager.GetTwoFactorAuthenticationUserAsync();
			if (user == null)
			{
				return View("Error");
			}
			return View(new VerifyCodeViewModel { Provider = provider, ReturnUrl = returnUrl, RememberMe = rememberMe });
		}

		// POST: /Account/VerifyCode
		[HttpPost]
		[AllowAnonymous]
		[ValidateAntiForgeryToken]
		public async Task<IActionResult> VerifyCode(VerifyCodeViewModel model)
		{
			if (!ModelState.IsValid)
			{
				return View(model);
			}

			// The following code protects for brute force attacks against the two factor codes. If a
			// user enters incorrect codes for a specified amount of time then the user account will
			// be locked out for a specified amount of time.
			var result = await _signInManager.TwoFactorSignInAsync(model.Provider, model.Code, model.RememberMe, model.RememberBrowser);
			if (result.Succeeded)
			{
				return RedirectToLocal(model.ReturnUrl);
			}
			if (result.IsLockedOut)
			{
				_logger.LogWarning(7, "User account locked out.");
				return View("Lockout");
			}
			else
			{
				ModelState.AddModelError(string.Empty, "Invalid code.");
				return View(model);
			}
		}

		// GET /Account/AccessDenied
		[HttpGet]
		public IActionResult AccessDenied()
		{
			return View();
		}

		#region Helpers

		private void AddErrors(IdentityResult result)
		{
			foreach (var error in result.Errors)
			{
				ModelState.AddModelError(string.Empty, error.Description);
			}
		}

		private IActionResult RedirectToLocal(string returnUrl)
		{
			if (Url.IsLocalUrl(returnUrl))
			{
				return Redirect(returnUrl);
			}
			else
			{
				return RedirectToAction(nameof(HomeController.Index), "Home");
			}
		}

		#endregion Helpers
	}
}