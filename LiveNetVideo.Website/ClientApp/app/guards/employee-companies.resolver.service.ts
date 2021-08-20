import { Injectable } from '@angular/core';
import { Observable } from "rxjs/Observable";
import {
	Router,
	Resolve,
	ActivatedRouteSnapshot,
	RouterStateSnapshot
} from '@angular/router';
import {
	Service
} from "../services/index";

import {
	CompanyProfileDto,
	IdDto,
	PagingDto,
	OrderByDto,
} from "../models/index";

@Injectable()
export class EmployeeCompaniesResolver implements Resolve<Array<CompanyProfileDto>> {
	constructor(
		private service: Service,
		private router: Router
	) { }

	resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Array<CompanyProfileDto>> {
		let memberId = this.service.profile.memberId;
		let dto = new IdDto();
		dto.id = memberId;
		dto.paging = new PagingDto();
		dto.paging.skip = 0;
		dto.paging.take = 0;
		dto.orderBy = new Array<OrderByDto>();
		let orderBy = new OrderByDto();
		orderBy.column = "CompanyName";
		orderBy.direction = "ASC";
		dto.orderBy.push(orderBy);
		let promise = this.service.getAccessToken().then((accessToken: string) => { return this.service.getEmployeeCompanies(dto, accessToken); });
		return Observable.fromPromise(promise);
	}
}