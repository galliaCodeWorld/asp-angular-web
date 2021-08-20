import { Component, Inject } from '@angular/core';
import { Http } from '@angular/http';

@Component({
    selector: 'fetchdata',
    templateUrl: './fetchdata.component.html'
})
export class FetchDataComponent {
    public forecasts: WeatherForecast[];
    public _http: Http;
    public _url: string;

    // NOTE: the get url is a web api url SampleDataController.cs
    constructor(http: Http, @Inject('ORIGIN_URL') originUrl: string) {
        this._http = http;
        this._url = originUrl;
        //http.get(originUrl + '/api/SampleData/WeatherForecasts').subscribe(result => {
        //    console.log("fetchdata: ", result);
        //    this.forecasts = result.json() as WeatherForecast[];
        //});
    }

    ngOnInit() {
        this._http.get(this._url + '/ChatClient/api/SampleData/WeatherForecasts').subscribe(result => {
            console.log("fetchdata: ", result);
            this.forecasts = result.json() as WeatherForecast[];
        });
    }
}

interface WeatherForecast {
    dateFormatted: string;
    temperatureC: number;
    temperatureF: number;
    summary: string;
}