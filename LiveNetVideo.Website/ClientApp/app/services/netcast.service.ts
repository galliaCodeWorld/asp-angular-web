import { Injectable } from '@angular/core';
import {
	JsHelperService,
	ConfigService,
	LocalStorageService,
} from './index';

import {
	LongIdDto,
	IdDto,
	SearchTermDto,
	PagingOrderByDto,
	PropertyTrackingEnum,
	HttpTypeEnum,
	HttpStatusCodeEnum,
	NetcastDto,
	NetcastGenreDto,
	SqlSearchPredicateDto,
	WebApiResponseType,
	WebApiResponseStatusType,
} from '../models/index';

@Injectable()
export class NetcastService {
	constructor(
		private jsHelperService: JsHelperService,
		private storageService: LocalStorageService,
		private configService: ConfigService,
	) { }

	get netcasts(): Array<NetcastDto> {
		return this.storageService.getPermanentItem<Array<NetcastDto>>(this.configService.keyNetcasts);
	}
	set netcasts(value: Array<NetcastDto>) {
		this.storageService.setPermanentItem(this.configService.keyNetcasts, value);
	}

	get netcastGenres(): Array<NetcastGenreDto> {
		return this.storageService.getPermanentItem<Array<NetcastGenreDto>>(this.configService.keyNetcastGenre);
	}
	set netcastGenres(value: Array<NetcastGenreDto>) {
		this.storageService.setPermanentItem(this.configService.keyNetcastGenre, value);
	}

	// #region NetcastGenre

	async getAllNetcastGenres(sqlSearchPredicates: SqlSearchPredicateDto, accessToken: string): Promise<NetcastGenreDto[]> {
		try {
			let payload = this.jsHelperService.formatWebApiPayload(sqlSearchPredicates);
			let url = this.configService.netcastController + 'GetAllNetcastGenres/';
			let dto = await this.jsHelperService.ajaxRequestParsed<NetcastGenreDto[]>(HttpTypeEnum.post, url, payload, accessToken);

			return dto;
		}
		catch (e) {
			throw (e);
		}
	}

	// #endregion NetcastGenre

	// #region Netcast
	async createNetcast(netcastDto: NetcastDto, accessToken: string): Promise<NetcastDto> {
		try {
			let payload = this.jsHelperService.formatWebApiPayload(netcastDto);
			let url = this.configService.netcastController + 'CreateNetcast/';
			let dto: NetcastDto = await this.jsHelperService.ajaxRequestParsed<NetcastDto>(HttpTypeEnum.post, url, payload, accessToken);
			this.jsHelperService.trackArrayProperty<NetcastDto>(this.netcasts, dto, this.jsHelperService.nameof<NetcastDto>("netcastId"), PropertyTrackingEnum.create);
			return dto;
		}
		catch (e) {
			throw (e);
		}
	}

	// Tracks: this.netcasts
	async addNetcastImage(dataUri: string, netcastId: number, accessToken: string): Promise<NetcastDto> {
		try {
			let payload: FormData = new FormData();
			let blob: Blob = this.jsHelperService.dataUriToBlob(dataUri);
			payload.append("uploadImage", blob, "uploadImage" + blob.type.replace("image/", "."));
			let url = this.configService.netcastController + `AddNetcastImage/${netcastId}/`;
			let dto: NetcastDto = await this.jsHelperService.ajaxRequestParsed<NetcastDto>(HttpTypeEnum.post, url, payload, accessToken);
			this.jsHelperService.trackArrayProperty<NetcastDto>(this.netcasts, dto, this.jsHelperService.nameof<NetcastDto>("netcastId"), PropertyTrackingEnum.update);
			return dto;
		}
		catch (e) {
			throw (e);
		}
	}

	async deleteNetcastImage(netcastId: number, accessToken: string): Promise<NetcastDto> {
		try {
			let payload = null;
			let url = this.configService.netcastController + `DeleteNetcastImage/${netcastId}/`;
			let dto: NetcastDto = await this.jsHelperService.ajaxRequestParsed<NetcastDto>(HttpTypeEnum.delete, url, payload, accessToken);
			this.jsHelperService.trackArrayProperty<NetcastDto>(this.netcasts, dto, this.jsHelperService.nameof<NetcastDto>("netcastId"), PropertyTrackingEnum.delete);
			return dto;
		}
		catch (e) {
			throw (e);
		}
	}

	async updateNetcast(netcastDto: NetcastDto, accessToken: string): Promise<NetcastDto> {
		try {
			let payload: object = this.jsHelperService.formatWebApiPayload(netcastDto);
			let url: string = this.configService.netcastController + 'UpdateNetcast/';
			let dto: NetcastDto = await this.jsHelperService.ajaxRequestParsed<NetcastDto>(HttpTypeEnum.post, url, payload, accessToken);
			this.jsHelperService.trackArrayProperty<NetcastDto>(this.netcasts, dto, this.jsHelperService.nameof<NetcastDto>("netcastId"), PropertyTrackingEnum.update);
			return dto;
		}
		catch (e) {
			throw (e);
		}
	}

	async deleteNetcast(netcastDto: NetcastDto, accessToken: string): Promise<string> {
		try {
			let payload = null;
			let url = this.configService.netcastController + `DeleteNetcast/${netcastDto.netcastId.toString()}/`;
			let resultMessage: string = await this.jsHelperService.ajaxRequestParsed<string>(HttpTypeEnum.delete, url, payload, accessToken);
			this.jsHelperService.trackArrayProperty<NetcastDto>(this.netcasts, netcastDto, this.jsHelperService.nameof<NetcastDto>("netcastId"), PropertyTrackingEnum.delete);
			return resultMessage;
		}
		catch (e) {
			throw (e);
		}
	}

	async getNetcastById(netcastId: number, accessToken: string): Promise<NetcastDto> {
		try {
			let payload = null;
			let url: string = this.configService.netcastController + `GetNetcastById/${netcastId}/`;
			let dto: NetcastDto = await this.jsHelperService.ajaxRequestParsed<NetcastDto>(HttpTypeEnum.get, url, payload, accessToken);
			return dto;
		}
		catch (e) {
			throw (e);
		}
	}

	async getRemoteGuidByNetcastId(netcastId: number, accessToken: string): Promise<string> {
		try {
			let payload = null;
			let url: string = this.configService.netcastController + `GetRemoteGuidByNetcastId/${netcastId}/`;
			let response: string = await this.jsHelperService.ajaxRequest(HttpTypeEnum.get, url, payload, accessToken);
			let apiResponse: WebApiResponseType = this.jsHelperService.jsonToObject<WebApiResponseType>(response, true);
			if (this.jsHelperService.isEmpty(apiResponse) === false) {
				if (apiResponse.status === WebApiResponseStatusType.success) {
					return apiResponse.data;
				}
				else {
					throw ("getRemoteGuidByNetcastId: WebApiResponse failed");
				}
			}
			else {
				throw ("getRemoteGuidByNetcastId: unable to parse webApiResponseType.");
			}
		}
		catch (e) {
			console.log("getRemoteGuidByNetcastId error: ", e);
			return null;
		}
	}

	async getNetcastsByMemberId(idDto: IdDto, accessToken: string): Promise<NetcastDto[]> {
		try {
			let payload: object = this.jsHelperService.formatWebApiPayload(idDto);
			let url: string = this.configService.netcastController + 'GetNetcastsByMemberId/';
			let dto: NetcastDto[] = await this.jsHelperService.ajaxRequestParsed<NetcastDto[]>(HttpTypeEnum.post, url, payload, accessToken);
			return dto;
		}
		catch (e) {
			throw (e);
		}
	}

	async getNetcastsByGenreId(idDto: IdDto, accessToken: string): Promise<NetcastDto[]> {
		try {
			let payload: object = this.jsHelperService.formatWebApiPayload(idDto);
			let url: string = this.configService.netcastController + 'GetNetcastsByGenreId/';
			let dto: NetcastDto[] = await this.jsHelperService.ajaxRequestParsed<NetcastDto[]>(HttpTypeEnum.post, url, payload, accessToken);
			return dto;
		}
		catch (e) {
			throw (e);
		}
	}

	async searchNetcastsByTitle(searchTermDto: SearchTermDto, accessToken: string): Promise<NetcastDto[]> {
		try {
			let payload: object = this.jsHelperService.formatWebApiPayload(searchTermDto);
			let url = this.configService.netcastController + 'SearchNetcastsByTitle/';
			//console.log("payload: ", payload);
			//console.log("url: ", url);
			//let dto: NetcastDto[] = await this.jsHelperService.ajaxRequestParsed<NetcastDto[]>(HttpTypeEnum.post, url, payload, accessToken, true);
			let dto: NetcastDto[] = await this.jsHelperService.ajaxRequestParsed<NetcastDto[]>(HttpTypeEnum.post, url, payload, accessToken);

			//console.log("searchNetcastsByTitle dto:", dto);
			return dto;
		}
		catch (e) {
			throw (e);
		}
	}

	async searchNetcastsByTags(searchTermDto: SearchTermDto, accessToken: string): Promise<NetcastDto[]> {
		try {
			let payload: object = this.jsHelperService.formatWebApiPayload(searchTermDto);
			let url = this.configService.netcastController + 'SearchNetcastsByTags/';
			let dto: NetcastDto[] = await this.jsHelperService.ajaxRequestParsed<NetcastDto[]>(HttpTypeEnum.post, url, payload, accessToken);
			return dto;
		}
		catch (e) {
			throw (e);
		}
	}

	async searchNetcastsByDescription(searchTermDto: SearchTermDto, accessToken: string): Promise<NetcastDto[]> {
		try {
			let payload: object = this.jsHelperService.formatWebApiPayload(searchTermDto);
			let url = this.configService.netcastController + 'SearchNetcastsByDescription/';
			let dto: NetcastDto[] = await this.jsHelperService.ajaxRequestParsed<NetcastDto[]>(HttpTypeEnum.post, url, payload, accessToken);
			return dto;
		}
		catch (e) {
			throw (e);
		}
	}

	async isNetcastStreaming(netcastId: number, accessToken: string): Promise<boolean> {
		//TODO: need to implement, make call to webapi server and check to see if the netcastId provided is streaming.

		return true;
	}

	async startNetcast(netcastId: number, connectionGuid: string, accessToken: string): Promise<boolean> {
		try {
			let payload = null;
			let url: string = this.configService.netcastController + `StartNetcast/${netcastId}/${connectionGuid}/`;
			let response: string = await this.jsHelperService.ajaxRequest(HttpTypeEnum.get, url, payload, accessToken);

			let apiResponse: WebApiResponseType = this.jsHelperService.jsonToObject<WebApiResponseType>(response, true);
			if (this.jsHelperService.isEmpty(apiResponse) === false) {
				if (apiResponse.status === WebApiResponseStatusType.success) {
					return true;
				}
				else {
					console.log("netcast.service.ts endNetcast(): Request rejected by server WebApiResponseStatusType.fail: ", apiResponse.data);
					return false;
				}
			}
			else {
				console.log("netcast.service.ts startNetcast(): unable to parse apiResponse");
				return false;
			}
		}
		catch (e) {
			throw (e);
		}
	}

	async endNetcast(accessToken: string): Promise<void> {
		try {
			let payload = null;
			let url: string = this.configService.netcastController + `EndNetcast/`;
			let response: string = await this.jsHelperService.ajaxRequest(HttpTypeEnum.get, url, payload, accessToken);

			let apiResponse: WebApiResponseType = this.jsHelperService.jsonToObject<WebApiResponseType>(response, true);
			if (this.jsHelperService.isEmpty(apiResponse) === false) {
				if (apiResponse.status === WebApiResponseStatusType.fail) {
					console.log("netcast.service.ts endNetcast(): Request rejected by server WebApiResponseStatusType.fail: ", apiResponse.data);
				}
			}
			else {
				console.log("netcast.service.ts endNetcast(): unable to parse apiResponse");
			}
		}
		catch (e) {
			throw (e);
		}
	}

	// #endregion Netcast
}