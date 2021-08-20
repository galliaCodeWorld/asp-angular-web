export enum LoginOptionsEnum {
	name = "LoginOptionsEnum",

	// cancel login
	cancelLogin = "cancelLogin",

	// user enters email and password to login
	memberLogin = "memberLogin",

	// user enters their name and any unused email to login
	guestLogin = "guestLogin",

	// system generates an email and allows user access with the generated email
	// for anonymouse login
	instantGuestLogin = "instantGuestLogin",
}