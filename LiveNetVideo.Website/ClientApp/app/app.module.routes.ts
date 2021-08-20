import {
	RouterModule,
	Routes
} from '@angular/router';

import {
	HomeComponent,

	Page404Component,
	PageErrorComponent,

	LoginShellComponent,
	DashboardHomeComponent,
	CompanyComponent,
	PbxRepLinesComponent,
	EmployeesComponent,
	PbxLinesComponent,
	CreateCompanyComponent,
	CallQueueComponent,
	CompanyOverviewComponent,
	PbxLineComponent,
	PbxSearchComponent,
	PbxCustomerComponent,
	PbxRepShellComponent,
	PbxEmployersComponent,
	EmployeeCompaniesComponent,

	CompanyLocationsComponent,
	CompanyPbxlineDetailsComponent,
	CompanyPbxlineRepsComponent,
	CompanyPhotosComponent,
	CompanyVideosComponent,
	EmployerAssignedPbxlineComponent,

	EmployerDetailsComponent,
} from "./components/index";

import {
	CompanyEmployeeDetailsPage,
	RepPbxPage,
	CustomerPbxPage,
	MyCompanyPage,
	CompanyEditPage,
	DashboardPage,
	CompanyPbxlinesPage,
	CompanyEmployeesPage,
	CompanyEmployeeInvitesPage,
	RegisterPage,
	LoginPage,
	CompanyProfilePage,
	SettingsPage,
	AccountPage,
	MyEmployersPage,
	ContactsPage,
	ContactUsPage,
	PublicUserProfilePage,
	LoginHelpPage,
	LogoutPage,
	PhonePage,
	BlockListPage,
	CompanyCreatePage,
	EmployerAssignedPbxlinesPage,
	CompanySearchPage,
	GuestAccountPage,
	ManageMeetingsPage,
	MeetingsPage,
	MeetingInvitesPage,
	CreateMeetingPage,
	MeetingPage,
	MeetingsDashboardPage,
	PastMeetingsPage,
	NetcasteePage,
	NetcasterPage,
	NetcastListPage,
	NetcastDashboardPage,
	NetcastSearchPage,
	NetcastDetailsPage,
	ErrorPage,
} from "./pages/index";

import { MaterialAlertMessageType } from "./models/index";
import {
	GuestCanActivate,
	MemberCanActivate,
	PageCanActivate
} from "./guards/index";

export const appRoutes: Routes = [

	{
		path: '',
		redirectTo: '/login',
		pathMatch: 'full'
	},
	{
		path: 'register',
		component: RegisterPage,
		canActivate: [PageCanActivate]
	},
	{
		path: 'login-help',
		component: LoginHelpPage,
		canActivate: [PageCanActivate]
	},

	{
		path: 'contactus',
		component: ContactUsPage,
		canActivate: [PageCanActivate]
	},
	{
		path: 'login',
		component: LoginPage,
		canActivate: [PageCanActivate]
	},
	{
		path: 'logout',
		component: LogoutPage
	},
	{
		path: 'dashboard',
		component: DashboardPage,
		canActivate: [GuestCanActivate]
	},

	{
		path: 'settings',
		component: SettingsPage,
		canActivate: [GuestCanActivate]
	},
	{
		path: 'netcast-dashboard',
		component: NetcastDashboardPage,
		canActivate: [GuestCanActivate]
	},
	{
		path: 'netcast-details/:netcastId',
		component: NetcastDetailsPage,
		canActivate: [PageCanActivate]
	},
	{
		path: 'netcast-search',
		component: NetcastSearchPage,
		canActivate: [GuestCanActivate]
	},
	{
		path: 'netcast-list',
		component: NetcastListPage,
		canActivate: [MemberCanActivate]
	},
	{
		path: 'netcaster/:netcastId',
		component: NetcasterPage,
		canActivate: [MemberCanActivate]
	},
	{
		path: 'netcastee/:netcastId',
		component: NetcasteePage,
		canActivate: [PageCanActivate]
	},
	{
		path: 'phone',
		component: PhonePage,
		canActivate: [PageCanActivate]
	},
	{
		path: 'phone/:emailToCall',
		component: PhonePage,
		canActivate: [PageCanActivate]
	},
	{
		path: 'account',
		component: AccountPage,
		canActivate: [GuestCanActivate]
	},
	{
		path: 'block-list',
		component: BlockListPage,
		canActivate: [MemberCanActivate]
	},
	{
		path: 'contacts',
		component: ContactsPage,
		canActivate: [MemberCanActivate]
	},
	{
		path: 'my-company',
		component: MyCompanyPage,
		canActivate: [MemberCanActivate]
	},
	{
		path: 'company-create',
		component: CompanyCreatePage,
		canActivate: [MemberCanActivate]
	},
	{
		path: 'company-edit',
		component: CompanyEditPage,
		canActivate: [MemberCanActivate]
	},
	{
		path: 'company-profile/:companyProfileId',
		component: CompanyProfilePage,
		canActivate: [GuestCanActivate]
	},
	{
		path: 'company-employee-invites',
		component: CompanyEmployeeInvitesPage,
		canActivate: [MemberCanActivate]
	},
	{
		path: 'company-employees/:companyProfileId',
		component: CompanyEmployeesPage,
		canActivate: [MemberCanActivate]
	},
	{
		path: 'company-employee-details/:companyEmployeeId',
		component: CompanyEmployeeDetailsPage,
		canActivate: [MemberCanActivate]
	},

	{
		path: 'company-pbxlines',
		component: CompanyPbxlinesPage,
		canActivate: [MemberCanActivate]
	},

	{
		path: 'my-employers',
		component: MyEmployersPage,
		canActivate: [MemberCanActivate]
	},

	{
		path: 'employer-assigned-pbxlines/:companyProfileId',
		component: EmployerAssignedPbxlinesPage,
		canActivate: [MemberCanActivate]
	},
	{
		path: 'public-user-profile/:memberId',
		component: PublicUserProfilePage,
		canActivate: [PageCanActivate]
	},
	{
		path: 'rep-pbx/:pbxlineRepId',
		component: RepPbxPage,
		canActivate: [MemberCanActivate]
	},
	{
		path: 'customer-pbx/:pbxlineId',
		component: CustomerPbxPage,
		canActivate: [PageCanActivate]
	},

	{
		path: 'company-search',
		component: CompanySearchPage,
		canActivate: [GuestCanActivate]
	},

	{
		path: 'guest-account',
		component: GuestAccountPage,
		canActivate: [GuestCanActivate]
	},
	{
		path: 'meetings-dashboard',
		component: MeetingsDashboardPage
	},
	{
		path: 'manage-meetings',
		component: ManageMeetingsPage,
		canActivate: [MemberCanActivate]
	},
	{
		path: 'create-meeting',
		component: CreateMeetingPage,
		canActivate: [MemberCanActivate]
	},
	{
		path: 'past-meetings',
		component: PastMeetingsPage,
		canActivate: [MemberCanActivate]
	},
	{
		path: 'meetings',
		component: MeetingsPage,
		canActivate: [GuestCanActivate]
	},
	{
		path: 'meeting/:meetingId',
		component: MeetingPage,
		canActivate: [PageCanActivate]
	},
	{
		path: 'meeting-invites',
		component: MeetingInvitesPage,
		canActivate: [GuestCanActivate]
	},
	{
		path: 'error-page',
		component: ErrorPage
	},
	{ path: 'error', component: PageErrorComponent },
	{ path: '**', component: Page404Component }
];