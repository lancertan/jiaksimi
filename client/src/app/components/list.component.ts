import { MapsAPILoader, MouseEvent } from '@agm/core';
import { Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AppService } from '../app.service';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit {

  title: string = 'Locator'
  latitude: number = 1.290270
  longitude: number = 103.851959
  zoom: number
  address: string
  private geoCoder
  reviews
  hawkers
  //showDetails = false
  reviewDetails
  previous
  showHawkers = false
  form: FormGroup
  distance = []  

  @ViewChild('search')
  public searchElementRef: ElementRef

  constructor(private mapsAPILoader: MapsAPILoader, private ngZone: NgZone, private router: Router, private appSvc: AppService, private fb: FormBuilder) { }

  ngOnInit(): void {

    this.form = this.fb.group({
      lat: this.fb.control('', []),
      lng: this.fb.control('', []),
      rad: this.fb.control('', [Validators.required, Validators.pattern('^-?[0-9]\\d*(\\.\\d*)?$'), Validators.min(0)])
    })

    //locate places autocomplete
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
          this.zoom = 15
          
        })
      })
    })
    //retrieve list of hawker information
    this.appSvc.getHawkers()
      .subscribe(
        results => {
          this.hawkers = results.hawkers
          console.log('results: ', results.hawkers)
        },
        err => console.error('err: ', err),
        () => {
        }
      )
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

  getReviews(){
    //removes previous map marker
    if (this.previous)
      this.previous=""
  
    //retrieve reviews based on params
    this.appSvc.getReviews(this.latitude, this.longitude, parseFloat(this.form.get('rad').value))
      .subscribe(
        results => {
          this.reviews = results.result
          console.log('results: ', results)
        },
        err => console.error('err: ', err),
        () => {
          console.log('>>Reviews: ', this.reviews)
          //compute distance from origin
          const origin = new google.maps.LatLng(this.latitude, this.longitude)
          //clear distance array
          this.distance = []
          for (let i = 0 ; i < this.reviews.length; i++){
            let destination = new google.maps.LatLng(this.reviews[i].location.coordinates[1], this.reviews[i].location.coordinates[0])
            this.distance.push(Math.round(google.maps.geometry.spherical.computeDistanceBetween(origin, destination)))
          }
          console.info(this.distance)
        }
      )
  }

  clickedMarker(infowindow) {
    if (this.previous) {
      this.previous.close()
    }
    this.previous = infowindow
  }

  checkDisplayHawkers(event){
    if (this.previous) {
      this.previous=""
    }
    this.showHawkers = event.target.checked
    console.log(event.target.checked)
  }

  //setDetails(i){
   // console.log('set details')
   // this.showDetails = true
   // this.reviewDetails = i
 // }

  delete(i)
  {
    if(confirm(`Are you sure you wish to delete the ${this.reviews[i].title} review?`)){
      //delete review on database
      this.appSvc.deleteReview(this.reviews[i]._id)
      //delete review from array
      this.reviews.splice(i, 1) 
      //refresh
      console.log("deleted: ", this.reviews[i]._id )
    }
  }

  reset() {
    this.setCurrentLocation()
  }


}