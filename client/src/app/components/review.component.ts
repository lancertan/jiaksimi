import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AppService } from '../app.service';
import { CameraService } from '../camera.service';
import { LocationService } from '../location.service';
import { LoginService } from '../login.service';

@Component({
  selector: 'app-review',
  templateUrl: './review.component.html',
  styleUrls: ['./review.component.css']
})
export class ReviewComponent implements OnInit {

  imagePath = '/assets/camera_placeholder.jpg'

  form: FormGroup

  imgSet = false

  locSet = false

  loc

  constructor(private cameraSvc: CameraService, private locationSvc: LocationService, private fb: FormBuilder, private router: Router, private appSvc: AppService, private loginSvc: LoginService) { }

  ngOnInit(): void {

    this.form = this.fb.group({
      title: new FormControl('', [Validators.required]),
      rating: new FormControl('', []),
      comments: new FormControl('', [])
    })
    
    if (this.cameraSvc.hasImage()) {
      const img = this.cameraSvc.getImage()
      this.imagePath = img.imageAsDataUrl
      this.imgSet = true
    }
    console.info('cameraSvc.hasImage: ', this.cameraSvc.hasImage())
    console.info('locationSvc.hasLocation: ', this.locationSvc.hasLocation())
    console.info('locationSvc.locationInfo: ', this.locationSvc.locationInfo)

    if (this.locationSvc.hasLocation()) {
      this.loc = this.locationSvc.getLocation()
      this.locSet = true
    }

  }

  clear() {
    this.imagePath = '/assets/camera_placeholder.jpg'
    this.imgSet = false
    this.locSet = false
    this.cameraSvc.clear()
    this.locationSvc.clear()
    this.form.reset()
  }

  back() {
    this.clear()
    this.router.navigate(['/menu'])
  }

  submit() {
    //submit form
    const formData = new FormData()
    formData.set('user', this.loginSvc.getUser())
    formData.set('title', this.form.get('title').value)
    formData.set('img', this.cameraSvc.getImage().imageData)
    formData.set('address', this.loc.address)
    formData.set('lat', this.loc.lat)
    formData.set('lng', this.loc.lng)
    formData.set('rating', this.form.get('rating').value)
    formData.set('comments', this.form.get('comments').value)

    this.appSvc.uploadReview(formData)
      .subscribe(response => {
        this.clear()
        console.log('Successfully uploaded')
        alert("Review successfully recorded")
        this.router.navigate(['/menu'])
      }, e => {
        console.error(e)
        if (e.status.toString() == '401') {
          console.log('Share not successful')
          alert("Error. Review not recorded")
          this.router.navigate(['/'])
        }
      })
  }    
}
