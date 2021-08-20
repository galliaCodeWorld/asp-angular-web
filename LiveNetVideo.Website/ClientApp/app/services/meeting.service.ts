import { Injectable } from '@angular/core';
import * as moment from 'moment';
import {
	JsHelperService,
	ConfigService,
	LocalStorageService,
} from './index';
import {
	MeetingDto,
	IdDto,
	LongIdDto,
	MeetingAttendeeDto,
	StringIdDto,
} from '../models/index';

@Injectable()
export class MeetingService {
	constructor(
		public jsHelperService: JsHelperService,
		public configService: ConfigService,
		public storageService: LocalStorageService,
	) { }

	httpPost: string = "POST";
	httpGet: string = "GET";
	httpDelete: string = "DELETE";

	// #region Meeting

	canEnterMeetingTime(meeting: MeetingDto): boolean {
		let currentMoment = moment(meeting.meetDate);
		let minDate = currentMoment.subtract(15, 'm').toDate();
		let maxDate = currentMoment.add(meeting.meetLength + 15, 'm').toDate();
		let currentDate = new Date();
		return currentDate > minDate && currentDate < maxDate;
	}

	async createMeeting(dto: MeetingDto, accessToken: string): Promise<MeetingDto> {
		try {
			let payload = this.jsHelperService.formatWebApiPayload(dto);
			console.log("payload: ", payload);
			let url = this.configService.webApiBase + 'Meeting/CreateMeeting/';
			let result: MeetingDto = await this.jsHelperService.ajaxRequestParsed<MeetingDto>(this.httpPost, url, payload, accessToken)
			return result;
		}
		catch (e) {
			throw (e);
		}
	}

	async updateMeeting(dto: MeetingDto, accessToken: string): Promise<MeetingDto> {
		try {
			let payload = this.jsHelperService.formatWebApiPayload(dto);
			let url = this.configService.webApiBase + 'Meeting/UpdateMeeting/';
			let result: MeetingDto = await this.jsHelperService.ajaxRequestParsed<MeetingDto>(this.httpPost, url, payload, accessToken)

			//console.log("result: ", result);

			return result;
		}
		catch (e) {
			throw (e);
		}
	}

	async getMeetingsByMemberId(dto: IdDto, accessToken: string): Promise<Array<MeetingDto>> {
		try {
			let payload = this.jsHelperService.formatWebApiPayload(dto);
			//console.log("payload: ", dto);
			let url = this.configService.webApiBase + `Meeting/GetMeetingsByMemberId/`;
			let result: Array<MeetingDto> = await this.jsHelperService.ajaxRequestParsed<Array<MeetingDto>>(this.httpPost, url, payload, accessToken)
			//console.log("meetings: ", result);
			return result;
		}
		catch (e) {
			throw (e);
		}
	}

	// gets only meetings that this user is invited too where they have not RSVP
	async getMeetingsByAttendeeEmail(dto: StringIdDto, accessToken: string): Promise<Array<MeetingDto>> {
		try {
			let payload = this.jsHelperService.formatWebApiPayload(dto);
			let url = this.configService.webApiBase + `Meeting/GetMeetingsByAttendeeEmail/`;
			let result: Array<MeetingDto> = await this.jsHelperService.ajaxRequestParsed<Array<MeetingDto>>(this.httpPost, url, payload, accessToken)
			return result;
		}
		catch (e) {
			throw (e);
		}
	}

	// gets only meetings that this user is invited regardless if they RSVP
	async getMeetingsByAttendeeEmailIgnoreRsvp(dto: StringIdDto, accessToken: string): Promise<Array<MeetingDto>> {
		try {
			let payload = this.jsHelperService.formatWebApiPayload(dto);
			let url = this.configService.webApiBase + `Meeting/GetMeetingsByAttendeeEmailIgnoreRsvp/`;
			let result: Array<MeetingDto> = await this.jsHelperService.ajaxRequestParsed<Array<MeetingDto>>(this.httpPost, url, payload, accessToken)
			return result;
		}
		catch (e) {
			throw (e);
		}
	}

	async getUpcomingMeetings(dto: StringIdDto, accessToken: string): Promise<Array<MeetingDto>> {
		try {
			let payload = this.jsHelperService.formatWebApiPayload(dto);
			let url = this.configService.webApiBase + `Meeting/GetUpcomingMeetings/`;
			let result: Array<MeetingDto> = await this.jsHelperService.ajaxRequestParsed<Array<MeetingDto>>(this.httpPost, url, payload, accessToken)
			return result;
		}
		catch (e) {
			throw (e);
		}
	}

	async getPastMeetings(dto: StringIdDto, accessToken: string): Promise<Array<MeetingDto>> {
		try {
			let payload = this.jsHelperService.formatWebApiPayload(dto);
			let url = this.configService.webApiBase + `Meeting/GetPastMeetings/`;
			let result: Array<MeetingDto> = await this.jsHelperService.ajaxRequestParsed<Array<MeetingDto>>(this.httpPost, url, payload, accessToken)
			return result;
		}
		catch (e) {
			throw (e);
		}
	}

	async getMeetingById(meetingId: number, accessToken: string): Promise<MeetingDto> {
		try {
			let payload = null;
			let url = this.configService.webApiBase + `Meeting/GetMeetingById/${meetingId}/`;
			let result: MeetingDto = await this.jsHelperService.ajaxRequestParsed<MeetingDto>(this.httpGet, url, payload, accessToken)
			return result;
		}
		catch (e) {
			throw (e);
		}
	}

	async deleteMeeting(meetingId: number, accessToken: string): Promise<string> {
		try {
			let payload = null;
			let url = this.configService.webApiBase + `Meeting/DeleteMeeting/${meetingId}/`;
			let message: string = await this.jsHelperService.ajaxRequestParsed<string>(this.httpDelete, url, payload, accessToken)
			return message;
		}
		catch (e) {
			throw (e);
		}
	}

	// #endregion Meeting

	// #region MeetingAttendee

	async createMeetingAttendee(dto: MeetingAttendeeDto, accessToken: string): Promise<MeetingAttendeeDto> {
		try {
			let payload = this.jsHelperService.formatWebApiPayload(dto);
			let url = this.configService.webApiBase + 'MeetingAttendee/CreateMeetingAttendee/';
			let result: MeetingAttendeeDto = await this.jsHelperService.ajaxRequestParsed<MeetingAttendeeDto>(this.httpPost, url, payload, accessToken)
			return result;
		}
		catch (e) {
			throw (e);
		}
	}

	async updateMeetingAttendee(dto: MeetingAttendeeDto, accessToken: string): Promise<MeetingAttendeeDto> {
		try {
			let payload = this.jsHelperService.formatWebApiPayload(dto);
			let url = this.configService.webApiBase + 'MeetingAttendee/UpdateMeetingAttendee/';
			let result: MeetingAttendeeDto = await this.jsHelperService.ajaxRequestParsed<MeetingAttendeeDto>(this.httpPost, url, payload, accessToken)
			return result;
		}
		catch (e) {
			throw (e);
		}
	}

	async getMeetingAttendeesByMeetingId(dto: LongIdDto, accessToken: string): Promise<Array<MeetingAttendeeDto>> {
		try {
			let payload = this.jsHelperService.formatWebApiPayload(dto);
			let url = this.configService.webApiBase + `MeetingAttendee/GetMeetingAttendeesByMeetingId/`;
			let result: Array<MeetingAttendeeDto> = await this.jsHelperService.ajaxRequestParsed<Array<MeetingAttendeeDto>>(this.httpPost, url, payload, accessToken)
			return result;
		}
		catch (e) {
			throw (e);
		}
	}

	async getMeetingAttendeeById(meetingAttendeeId: number, accessToken: string): Promise<MeetingAttendeeDto> {
		try {
			let payload = null;
			let url = this.configService.webApiBase + `MeetingAttendee/GetMeetingAttendeeById/${meetingAttendeeId}/`;
			let result: MeetingAttendeeDto = await this.jsHelperService.ajaxRequestParsed<MeetingAttendeeDto>(this.httpGet, url, payload, accessToken)
			return result;
		}
		catch (e) {
			throw (e);
		}
	}

	async getMeetingAttendeesByMemberId(dto: IdDto, accessToken: string): Promise<Array<MeetingAttendeeDto>> {
		try {
			let payload = this.jsHelperService.formatWebApiPayload(dto);
			let url = this.configService.webApiBase + `MeetingAttendee/GetMeetingAttendeesByMemberId/`;
			let result: Array<MeetingAttendeeDto> = await this.jsHelperService.ajaxRequestParsed<Array<MeetingAttendeeDto>>(this.httpPost, url, payload, accessToken)
			return result;
		}
		catch (e) {
			throw (e);
		}
	}

	async getMeetingAttendeesByEmail(dto: StringIdDto, accessToken: string): Promise<Array<MeetingAttendeeDto>> {
		try {
			let payload = this.jsHelperService.formatWebApiPayload(dto);
			let url = this.configService.webApiBase + `MeetingAttendee/GetMeetingAttendeesByEmail/`;
			let result: Array<MeetingAttendeeDto> = await this.jsHelperService.ajaxRequestParsed<Array<MeetingAttendeeDto>>(this.httpPost, url, payload, accessToken)
			return result;
		}
		catch (e) {
			throw (e);
		}
	}

	async deleteMeetingAttendee(dto: MeetingAttendeeDto, accessToken: string): Promise<string> {
		try {
			let payload = null;
			let url = this.configService.webApiBase + `MeetingAttendee/DeleteMeetingAttendee/${dto.meetingAttendeeId}/`;
			let message: string = await this.jsHelperService.ajaxRequestParsed<string>(this.httpDelete, url, payload, accessToken)
			return message;
		}
		catch (e) {
			throw (e);
		}
	}

	// #endregion MeetingAttendee
}