import { Injectable } from "@angular/core";
import { LocationInfo } from "./models";

@Injectable()
export class LocationService {

    locationInfo: LocationInfo = null

    clear() {
        this.locationInfo = null
    }

    getLocation(): LocationInfo {
        return this.locationInfo
    }

    hasLocation(): boolean {
        return (this.locationInfo != null)
    }

}