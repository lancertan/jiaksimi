import { MapsAPILoader, MouseEvent } from '@agm/core';
import { Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { LocationService } from '../location.service';
import { LocationInfo } from '../models';

@Component({
  selector: 'app-locate',
  templateUrl: './locate.component.html',
  styleUrls: ['./locate.component.css']
})
export class LocateComponent implements OnInit {

  title: string = 'Locator'
  latitude: number
  longitude: number
  zoom: number
  address: string
  private geoCoder

  @ViewChild('search')
  public searchElementRef: ElementRef

  constructor(private mapsAPILoader: MapsAPILoader, private ngZone: NgZone, private router: Router, private locationSvc: LocationService) { }

  ngOnInit(): void {
    //loca places autocomplete
    this.mapsAPILoader.load().then(() => {
      this.setCurrentLocation()
      this.geoCoder = new google.maps.Geocoder

      let autocomplete = new google.maps.places.Autocomplete(this.searchElementRef.nativeElement)
      autocomplete.addListener("place_changed", () => {
        this.ngZone.run(() => {
          //get the place result
          let place: google.maps.places.PlaceResult = autocomplete.getPlace()

          //verify result
          if (place.geometry === undefined || place.geometry === null) {
            return
          }

          //set latitude, longitude and zoom
          this.latitude = place.geometry.location.lat()
          this.longitude = place.geometry.location.lng()
          this.zoom = 17
        })
      })
    })
  }

  //get current location coordinates
  private setCurrentLocation() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.latitude = position.coords.latitude
        this.longitude = position.coords.longitude
        this.zoom = 17
        this.getAddress(this.latitude, this.longitude)
      })
    }
  }

  markerDragEnd($event: MouseEvent) {
    console.log('event: ', $event)
    this.latitude = $event.coords.lat
    this.longitude = $event.coords.lng
    this.getAddress(this.latitude, this.longitude)
  }

  getAddress(latitude, longitude) {
    this.geoCoder.geocode({ 'location': { lat: latitude, lng: longitude } }, (results, status) => {
      console.log(results)
      console.log(status)
      if (status === 'OK') {
        if (results[0]) {
          this.zoom = 17
          this.address = results[0].formatted_address
        } else {
          window.alert('No results found')
        }
      } else {
        window.alert('Geocoder failed due to ' + status)
      }
      
    })
  }

  back() {
    this.locationSvc.clear() 
    this.router.navigate(['/review'])
  }

  reset() {
    this.ngOnInit()
  }

  submit() {
    this.locationSvc.locationInfo = {
      address: this.address,
      lat: this.latitude,
      lng: this.longitude 
    } as LocationInfo
    this.router.navigate(['/review'])
  }

}
